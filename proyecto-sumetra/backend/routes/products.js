const express = require("express");
const { withTransaction } = require("../db");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");
const { refreshStockAlert } = require("../lib/inventory");

function mapProduct(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    descripcion: row.descripcion,
    precio: Number(row.precio),
    stock: Number(row.stock),
    umbralStock: Number(row.umbralStock ?? row.umbral_stock),
    activo: Boolean(row.activo),
    createdAt: row.createdAt ?? row.created_at,
    updatedAt: row.updatedAt ?? row.updated_at
  };
}

function productInput(body) {
  return {
    nombre: validation.requiredString(body.nombre, "nombre", { min: 2, max: 120 }),
    descripcion: validation.optionalString(body.descripcion, "descripcion", { max: 500 }),
    precio: validation.positiveMoney(body.precio, "precio"),
    stock: validation.integer(body.stock, "stock", { min: 0, max: 100000000 }),
    umbralStock: body.umbralStock === undefined
      ? 5
      : validation.integer(body.umbralStock, "umbralStock", { min: 0, max: 100000000 })
  };
}

async function findProduct(pool, productId, { includeInactive = false } = {}) {
  const [rows] = await pool.execute(
    `SELECT id, nombre, descripcion, precio, stock, umbral_stock AS umbralStock, activo,
            created_at AS createdAt, updated_at AS updatedAt
       FROM productos
      WHERE id = ? ${includeInactive ? "" : "AND activo = 1"}
      LIMIT 1`,
    [productId]
  );
  if (rows.length === 0) throw new AppError(404, "Producto no encontrado.", "PRODUCTO_NO_ENCONTRADO");
  return mapProduct(rows[0]);
}

function createProductsRouter(pool, authenticate, authorize) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/", asyncHandler(async (req, res) => {
    const includeInactive = req.user.rol === "administrador" && req.query.incluirInactivos === "true";
    const [rows] = await pool.query(
      `SELECT id, nombre, descripcion, precio, stock, umbral_stock AS umbralStock, activo,
              created_at AS createdAt, updated_at AS updatedAt
         FROM productos
        ${includeInactive ? "" : "WHERE activo = 1"}
        ORDER BY nombre, id`
    );
    res.json({ productos: rows.map(mapProduct) });
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    const productId = validation.id(req.params.id, "productoId");
    const producto = await findProduct(pool, productId, { includeInactive: req.user.rol === "administrador" });
    res.json({ producto });
  }));

  router.post("/", authorize("administrador"), asyncHandler(async (req, res) => {
    const input = productInput(req.body);
    const productId = await withTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO productos (nombre, descripcion, precio, stock, umbral_stock, activo)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [input.nombre, input.descripcion, input.precio, input.stock, input.umbralStock]
      );
      await refreshStockAlert(connection, result.insertId);
      return result.insertId;
    }, pool);
    res.status(201).json({ producto: await findProduct(pool, productId, { includeInactive: true }) });
  }));

  router.put("/:id", authorize("administrador"), asyncHandler(async (req, res) => {
    const productId = validation.id(req.params.id, "productoId");
    const input = productInput(req.body);
    await withTransaction(async (connection) => {
      const [result] = await connection.execute(
        `UPDATE productos
            SET nombre = ?, descripcion = ?, precio = ?, stock = ?, umbral_stock = ?, activo = 1
          WHERE id = ?`,
        [input.nombre, input.descripcion, input.precio, input.stock, input.umbralStock, productId]
      );
      if (result.affectedRows === 0) {
        throw new AppError(404, "Producto no encontrado.", "PRODUCTO_NO_ENCONTRADO");
      }
      await refreshStockAlert(connection, productId);
    }, pool);
    res.json({ producto: await findProduct(pool, productId, { includeInactive: true }) });
  }));

  router.delete("/:id", authorize("administrador"), asyncHandler(async (req, res) => {
    const productId = validation.id(req.params.id, "productoId");
    await withTransaction(async (connection) => {
      const [result] = await connection.execute("UPDATE productos SET activo = 0 WHERE id = ? AND activo = 1", [productId]);
      if (result.affectedRows === 0) {
        throw new AppError(404, "Producto no encontrado.", "PRODUCTO_NO_ENCONTRADO");
      }
      await refreshStockAlert(connection, productId);
    }, pool);
    res.status(204).end();
  }));

  return router;
}

module.exports = { createProductsRouter, mapProduct, findProduct };
