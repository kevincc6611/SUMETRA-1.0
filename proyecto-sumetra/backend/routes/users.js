const express = require("express");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");
const { publicUser } = require("../middleware/auth");

function createUsersRouter(pool, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate, authorize("administrador"));

  router.get("/", asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      "SELECT id, nombre, email, rol, activo, ultimo_acceso AS ultimoAcceso, created_at AS createdAt FROM usuarios ORDER BY id"
    );
    res.json({
      usuarios: rows.map((row) => ({ ...publicUser(row), ultimoAcceso: row.ultimoAcceso, createdAt: row.createdAt }))
    });
  }));

  router.patch("/:id/rol", asyncHandler(async (req, res) => {
    const userId = validation.id(req.params.id, "usuarioId");
    const rol = validation.enumValue(req.body.rol, "rol", ["administrador", "usuario"]);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.execute(
        "SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ? FOR UPDATE",
        [userId]
      );
      if (rows.length === 0) throw new AppError(404, "Usuario no encontrado.", "USUARIO_NO_ENCONTRADO");
      if (rows[0].rol === "administrador" && rol !== "administrador") {
        const [[count]] = await connection.query(
          "SELECT COUNT(*) AS total FROM usuarios WHERE rol = 'administrador' AND activo = 1"
        );
        if (count.total <= 1) {
          throw new AppError(409, "Debe existir al menos un administrador activo.", "ULTIMO_ADMINISTRADOR");
        }
      }
      await connection.execute("UPDATE usuarios SET rol = ? WHERE id = ?", [rol, userId]);
      await connection.commit();
      res.json({ usuario: publicUser({ ...rows[0], rol }) });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }));

  return router;
}

module.exports = { createUsersRouter };
