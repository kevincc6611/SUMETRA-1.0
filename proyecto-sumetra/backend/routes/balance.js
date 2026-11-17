const express = require("express");
const { asyncHandler } = require("../lib/errors");
const { parseDateRange, dateWhere } = require("../lib/dates");

function createBalanceRouter(pool, authenticate) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/", asyncHandler(async (req, res) => {
    const range = parseDateRange(req.query);
    const params = [];
    const conditions = dateWhere("m", range, params);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [[summary]] = await pool.execute(
      `SELECT COALESCE(SUM(CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE 0 END), 0) AS ingresos,
              COALESCE(SUM(CASE WHEN m.tipo = 'GASTO' THEN m.monto ELSE 0 END), 0) AS gastos
         FROM movimientos m ${where}`,
      params
    );
    const [series] = await pool.execute(
      `SELECT DATE_FORMAT(m.fecha, '%Y-%m') AS periodo,
              SUM(CASE WHEN m.tipo = 'INGRESO' THEN m.monto ELSE 0 END) AS ingresos,
              SUM(CASE WHEN m.tipo = 'GASTO' THEN m.monto ELSE 0 END) AS gastos
         FROM movimientos m ${where}
        GROUP BY DATE_FORMAT(m.fecha, '%Y-%m')
        ORDER BY periodo`,
      params
    );
    const ingresos = Number(summary.ingresos);
    const gastos = Number(summary.gastos);
    res.json({
      resumen: { ingresos, gastos, balance: Math.round((ingresos - gastos) * 100) / 100 },
      serie: series.map((row) => ({
        periodo: row.periodo,
        ingresos: Number(row.ingresos),
        gastos: Number(row.gastos),
        balance: Math.round((Number(row.ingresos) - Number(row.gastos)) * 100) / 100
      })),
      alcance: "Balance operativo de entradas menos salidas; no equivale a estados financieros completos."
    });
  }));

  return router;
}

module.exports = { createBalanceRouter };
