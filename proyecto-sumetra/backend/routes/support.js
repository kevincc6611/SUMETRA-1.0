const express = require("express");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");

function mapSupport(row) {
  return {
    id: Number(row.id),
    asunto: row.asunto,
    mensaje: row.mensaje,
    estado: row.estado,
    respuesta: row.respuesta,
    usuario: { id: Number(row.usuarioId), nombre: row.usuarioNombre, email: row.usuarioEmail },
    atendidaPor: row.atendidaPorId
      ? { id: Number(row.atendidaPorId), nombre: row.atendidaPorNombre }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

const SUPPORT_SELECT = `
  SELECT s.id, s.asunto, s.mensaje, s.estado, s.respuesta,
         s.usuario_id AS usuarioId, creator.nombre AS usuarioNombre, creator.email AS usuarioEmail,
         s.atendida_por AS atendidaPorId, agent.nombre AS atendidaPorNombre,
         s.created_at AS createdAt, s.updated_at AS updatedAt
    FROM solicitudes_soporte s
    JOIN usuarios creator ON creator.id = s.usuario_id
    LEFT JOIN usuarios agent ON agent.id = s.atendida_por`;

function createSupportRouter(pool, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);

  router.post("/", asyncHandler(async (req, res) => {
    const asunto = validation.requiredString(req.body.asunto, "asunto", { min: 4, max: 160 });
    const mensaje = validation.requiredString(req.body.mensaje, "mensaje", { min: 10, max: 5000 });
    const [result] = await pool.execute(
      "INSERT INTO solicitudes_soporte (usuario_id, asunto, mensaje) VALUES (?, ?, ?)",
      [req.user.id, asunto, mensaje]
    );
    const [rows] = await pool.execute(`${SUPPORT_SELECT} WHERE s.id = ?`, [result.insertId]);
    res.status(201).json({ solicitud: mapSupport(rows[0]) });
  }));

  router.get("/", asyncHandler(async (req, res) => {
    const isAdmin = req.user.rol === "administrador";
    const [rows] = await pool.execute(
      `${SUPPORT_SELECT} ${isAdmin ? "" : "WHERE s.usuario_id = ?"}
       ORDER BY s.created_at DESC, s.id DESC LIMIT 1000`,
      isAdmin ? [] : [req.user.id]
    );
    res.json({ solicitudes: rows.map(mapSupport) });
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    const supportId = validation.id(req.params.id, "solicitudId");
    const [rows] = await pool.execute(`${SUPPORT_SELECT} WHERE s.id = ?`, [supportId]);
    if (rows.length === 0) throw new AppError(404, "Solicitud no encontrada.", "SOLICITUD_NO_ENCONTRADA");
    if (req.user.rol !== "administrador" && Number(rows[0].usuarioId) !== req.user.id) {
      throw new AppError(403, "No puedes consultar esta solicitud.", "SIN_PERMISO");
    }
    res.json({ solicitud: mapSupport(rows[0]) });
  }));

  router.patch("/:id", authorize("administrador"), asyncHandler(async (req, res) => {
    const supportId = validation.id(req.params.id, "solicitudId");
    const estado = validation.enumValue(String(req.body.estado || "").toUpperCase(), "estado", [
      "ABIERTA", "EN_PROCESO", "CERRADA"
    ]);
    const respuesta = validation.optionalString(req.body.respuesta, "respuesta", { max: 5000 });
    const [result] = await pool.execute(
      `UPDATE solicitudes_soporte
          SET estado = ?, respuesta = ?, atendida_por = ?
        WHERE id = ?`,
      [estado, respuesta, req.user.id, supportId]
    );
    if (result.affectedRows === 0) throw new AppError(404, "Solicitud no encontrada.", "SOLICITUD_NO_ENCONTRADA");
    const [rows] = await pool.execute(`${SUPPORT_SELECT} WHERE s.id = ?`, [supportId]);
    res.json({ solicitud: mapSupport(rows[0]) });
  }));

  return router;
}

module.exports = { createSupportRouter };
