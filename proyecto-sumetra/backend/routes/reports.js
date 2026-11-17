const express = require("express");
const { asyncHandler } = require("../lib/errors");
const { toCsv } = require("../lib/csv");
const { queryMovements } = require("./movements");
const { mapProduct } = require("./products");

function wantsCsv(req) {
  return String(req.query.formato || "json").toLowerCase() === "csv";
}

function sendCsv(res, filename, headers, rows) {
  res.set("Content-Type", "text/csv; charset=utf-8");
  res.set("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, rows));
}

function createReportsRouter(pool, authenticate) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/movimientos", asyncHandler(async (req, res) => {
    const movements = await queryMovements(pool, req.query);
    if (!wantsCsv(req)) return res.json({ movimientos: movements });
    sendCsv(
      res,
      "sumetra-movimientos.csv",
      [
        { key: "id", label: "ID" },
        { key: "fecha", label: "Fecha" },
        { key: "tipo", label: "Tipo" },
        { key: "origen", label: "Origen" },
        { key: "descripcion", label: "Descripción" },
        { key: "monto", label: "Monto" }
      ],
      movements
    );
  }));

  router.get("/inventario", asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT id, nombre, descripcion, precio, stock, umbral_stock AS umbralStock, activo,
              created_at AS createdAt, updated_at AS updatedAt
         FROM productos WHERE activo = 1 ORDER BY nombre, id`
    );
    const products = rows.map(mapProduct);
    if (!wantsCsv(req)) return res.json({ productos: products });
    sendCsv(
      res,
      "sumetra-inventario.csv",
      [
        { key: "id", label: "ID" },
        { key: "nombre", label: "Producto" },
        { key: "descripcion", label: "Descripción" },
        { key: "precio", label: "Precio" },
        { key: "stock", label: "Existencias" },
        { key: "umbralStock", label: "Umbral" }
      ],
      products
    );
  }));

  return router;
}

module.exports = { createReportsRouter };
