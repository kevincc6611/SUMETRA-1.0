const express = require("express");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");
const { parseDateRange, dateWhere } = require("../lib/dates");

function mapMovement(row) {
  return {
    id: Number(row.id),
    tipo: row.tipo,
    origen: row.origen,
    referenciaId: row.referenciaId === null ? null : Number(row.referenciaId),
    monto: Number(row.monto),
    fecha: row.fecha,
    descripcion: row.descripcion,
    usuario: row.usuarioId ? { id: Number(row.usuarioId), nombre: row.usuarioNombre } : null,
    createdAt: row.createdAt
  };
}

async function queryMovements(pool, query) {
  const range = parseDateRange(query);
  const params = [];
  const conditions = dateWhere("m", range, params);
  if (query.tipo !== undefined && query.tipo !== "") {
    conditions.push("m.tipo = ?");
    params.push(validation.enumValue(String(query.tipo).toUpperCase(), "tipo", ["INGRESO", "GASTO"]));
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const [rows] = await pool.execute(
    `SELECT m.id, m.tipo, m.origen, m.referencia_id AS referenciaId, m.monto, m.fecha,
            m.descripcion, m.usuario_id AS usuarioId, u.nombre AS usuarioNombre,
            m.created_at AS createdAt
       FROM movimientos m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
       ${where}
      ORDER BY m.fecha DESC, m.id DESC
      LIMIT 5000`,
    params
  );
  return rows.map(mapMovement);
}

function createMovementsRouter(pool, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/", asyncHandler(async (req, res) => {
    res.json({ movimientos: await queryMovements(pool, req.query) });
  }));

  router.post("/", authorize("administrador"), asyncHandler(async (req, res) => {
    const tipo = validation.enumValue(String(req.body.tipo || "").toUpperCase(), "tipo", ["INGRESO", "GASTO"]);
    const monto = validation.positiveMoney(req.body.monto, "monto");
    const fecha = validation.isoDate(req.body.fecha, "fecha", { defaultToday: true });
    const descripcion = validation.requiredString(req.body.descripcion, "descripcion", { min: 3, max: 500 });

    const [result] = await pool.execute(
      `INSERT INTO movimientos (tipo, origen, referencia_id, monto, fecha, descripcion, usuario_id)
       VALUES (?, 'MANUAL', NULL, ?, ?, ?, ?)`,
      [tipo, monto, fecha, descripcion, req.user.id]
    );
    const [rows] = await pool.execute(
      `SELECT m.id, m.tipo, m.origen, m.referencia_id AS referenciaId, m.monto, m.fecha,
              m.descripcion, m.usuario_id AS usuarioId, u.nombre AS usuarioNombre,
              m.created_at AS createdAt
         FROM movimientos m LEFT JOIN usuarios u ON u.id = m.usuario_id WHERE m.id = ?`,
      [result.insertId]
    );
    if (!rows.length) throw new AppError(500, "No se pudo recuperar el movimiento.");
    res.status(201).json({ movimiento: mapMovement(rows[0]) });
  }));

  return router;
}

module.exports = { createMovementsRouter, queryMovements, mapMovement };
