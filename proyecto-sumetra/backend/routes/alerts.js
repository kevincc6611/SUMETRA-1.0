const express = require("express");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");

function mapAlert(row) {
  return {
    id: Number(row.id),
    tipo: row.tipo,
    mensaje: row.mensaje,
    estado: row.estado,
    stockObservado: Number(row.stockObservado),
    umbralObservado: Number(row.umbralObservado),
    producto: { id: Number(row.productoId), nombre: row.productoNombre },
    atendidaPor: row.atendidaPorId
      ? { id: Number(row.atendidaPorId), nombre: row.atendidaPorNombre }
      : null,
    atendidaAt: row.atendidaAt,
    resueltaAt: row.resueltaAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

const ALERT_SELECT = `
  SELECT a.id, a.tipo, a.mensaje, a.estado, a.stock_observado AS stockObservado,
         a.umbral_observado AS umbralObservado, a.producto_id AS productoId,
         p.nombre AS productoNombre, a.atendida_por AS atendidaPorId,
         u.nombre AS atendidaPorNombre, a.atendida_at AS atendidaAt,
         a.resuelta_at AS resueltaAt, a.created_at AS createdAt, a.updated_at AS updatedAt
    FROM alertas a
    JOIN productos p ON p.id = a.producto_id
    LEFT JOIN usuarios u ON u.id = a.atendida_por`;

function createAlertsRouter(pool, authenticate) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/", asyncHandler(async (req, res) => {
    const params = [];
    let where = "";
    if (req.query.estado) {
      const estado = validation.enumValue(String(req.query.estado).toUpperCase(), "estado", [
        "PENDIENTE", "ATENDIDA", "RESUELTA"
      ]);
      where = "WHERE a.estado = ?";
      params.push(estado);
    }
    const [rows] = await pool.execute(`${ALERT_SELECT} ${where} ORDER BY a.created_at DESC, a.id DESC LIMIT 1000`, params);
    res.json({ alertas: rows.map(mapAlert) });
  }));

  router.patch("/:id/atender", asyncHandler(async (req, res) => {
    const alertId = validation.id(req.params.id, "alertaId");
    const [result] = await pool.execute(
      `UPDATE alertas
          SET estado = 'ATENDIDA', atendida_por = ?, atendida_at = COALESCE(atendida_at, NOW())
        WHERE id = ? AND estado = 'PENDIENTE'`,
      [req.user.id, alertId]
    );
    if (result.affectedRows === 0) {
      const [existing] = await pool.execute(`${ALERT_SELECT} WHERE a.id = ?`, [alertId]);
      if (existing.length === 0) throw new AppError(404, "Alerta no encontrada.", "ALERTA_NO_ENCONTRADA");
      if (existing[0].estado !== "ATENDIDA") {
        throw new AppError(409, "La alerta ya fue resuelta.", "ALERTA_RESUELTA");
      }
      return res.json({ alerta: mapAlert(existing[0]), reutilizada: true });
    }
    const [rows] = await pool.execute(`${ALERT_SELECT} WHERE a.id = ?`, [alertId]);
    res.json({ alerta: mapAlert(rows[0]), reutilizada: false });
  }));

  return router;
}

module.exports = { createAlertsRouter, mapAlert };
