const express = require("express");
const bcrypt = require("bcryptjs");
const { config } = require("../config");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");
const { signToken, publicUser } = require("../middleware/auth");

function createAuthRouter(pool, authenticate) {
  const router = express.Router();

  router.post("/register", asyncHandler(async (req, res) => {
    const nombre = validation.requiredString(req.body.nombre, "nombre", { min: 2, max: 120 });
    const email = validation.email(req.body.email);
    const plainPassword = validation.password(req.body.password);
    const passwordHash = await bcrypt.hash(plainPassword, config.bcryptRounds);

    try {
      const [result] = await pool.execute(
        `INSERT INTO usuarios (nombre, email, password, password_hash, rol, activo)
         VALUES (?, ?, ?, ?, 'usuario', 1)`,
        [nombre, email, passwordHash, passwordHash]
      );
      const user = { id: result.insertId, nombre, email, rol: "usuario", activo: true };
      res.status(201).json({ token: signToken(user), usuario: user });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        throw new AppError(409, "Ese correo ya está registrado.", "CORREO_DUPLICADO");
      }
      throw error;
    }
  }));

  router.post("/login", asyncHandler(async (req, res) => {
    const email = validation.email(req.body.email);
    const plainPassword = typeof req.body.password === "string" ? req.body.password : "";
    if (!plainPassword) throw new AppError(401, "Credenciales incorrectas.", "CREDENCIALES_INVALIDAS");

    const [rows] = await pool.execute(
      `SELECT id, nombre, email, password_hash, rol, activo
         FROM usuarios WHERE email = ? LIMIT 1`,
      [email]
    );
    const row = rows[0];
    const matches = row?.password_hash ? await bcrypt.compare(plainPassword, row.password_hash) : false;
    if (!row || !row.activo || !matches) {
      throw new AppError(401, "Credenciales incorrectas.", "CREDENCIALES_INVALIDAS");
    }

    await pool.execute("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?", [row.id]);
    const user = publicUser(row);
    res.json({ token: signToken(user), usuario: user });
  }));

  router.get("/me", authenticate, (req, res) => {
    res.json({ usuario: req.user });
  });

  return router;
}

module.exports = { createAuthRouter };
