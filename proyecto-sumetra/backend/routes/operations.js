const express = require("express");
const crypto = require("node:crypto");
const { withTransaction } = require("../db");
const { AppError, asyncHandler } = require("../lib/errors");
const validation = require("../lib/validation");
const { parseDateRange, dateWhere } = require("../lib/dates");
const { refreshStockAlert } = require("../lib/inventory");

const DEFINITIONS = {
  compra: {
    table: "compras",
    detailsTable: "compra_detalles",
    foreignKey: "compra_id",
    partyColumn: "proveedor",
    partyProperty: "proveedor",
    numberPrefix: "COMP",
    movementType: "GASTO",
    movementOrigin: "COMPRA",
    stockDirection: 1
  },
  venta: {
    table: "ventas",
    detailsTable: "venta_detalles",
    foreignKey: "venta_id",
    partyColumn: "cliente",
    partyProperty: "cliente",
    numberPrefix: "VENT",
    movementType: "INGRESO",
    movementOrigin: "VENTA",
    stockDirection: -1
  }
};

function normalizeLines(lines, type) {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > 100) {
    validation.validationError("lineas debe contener entre 1 y 100 productos.");
  }
  const normalized = lines.map((line, index) => {
    if (!line || typeof line !== "object") validation.validationError(`La línea ${index + 1} no es válida.`);
    const normalizedLine = {
      productoId: validation.id(line.productoId, `lineas[${index}].productoId`),
      cantidad: validation.integer(line.cantidad, `lineas[${index}].cantidad`, { min: 1, max: 100000000 })
    };
    if (type === "compra") {
      normalizedLine.precioUnitario = validation.positiveMoney(
        line.precioUnitario,
        `lineas[${index}].precioUnitario`
      );
    } else if (line.precioUnitario !== undefined && line.precioUnitario !== null && line.precioUnitario !== "") {
      normalizedLine.precioUnitario = validation.positiveMoney(
        line.precioUnitario,
        `lineas[${index}].precioUnitario`
      );
    }
    return normalizedLine;
  });
  const ids = normalized.map((line) => line.productoId);
  if (new Set(ids).size !== ids.length) {
    validation.validationError("Cada producto debe aparecer una sola vez en la operación.");
  }
  return normalized.sort((a, b) => a.productoId - b.productoId);
}

function idempotencyKey(req) {
  const key = req.get("Idempotency-Key") || req.body.idempotencyKey;
  if (typeof key !== "string" || !/^[A-Za-z0-9._:-]{8,128}$/.test(key)) {
    throw new AppError(
      400,
      "Envía un encabezado Idempotency-Key de 8 a 128 caracteres seguros.",
      "IDEMPOTENCY_KEY_REQUERIDA"
    );
  }
  return key;
}

function operationInput(req, type) {
  const definition = DEFINITIONS[type];
  const input = {
    key: idempotencyKey(req),
    fecha: validation.isoDate(req.body.fecha, "fecha", { defaultToday: true }),
    party: validation.optionalString(req.body[definition.partyProperty], definition.partyProperty, { max: 160 }),
    lines: normalizeLines(req.body.lineas, type)
  };
  input.hash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ fecha: input.fecha, party: input.party, lines: input.lines }))
    .digest("hex");
  return input;
}

async function fetchOperation(pool, type, operationId) {
  const definition = DEFINITIONS[type];
  const [headers] = await pool.execute(
    `SELECT o.id, o.numero, o.${definition.partyColumn} AS party, o.fecha, o.total,
            o.created_by AS createdBy, u.nombre AS createdByName, o.created_at AS createdAt
       FROM ${definition.table} o
       LEFT JOIN usuarios u ON u.id = o.created_by
      WHERE o.id = ? LIMIT 1`,
    [operationId]
  );
  if (headers.length === 0) {
    throw new AppError(404, `${type === "compra" ? "Compra" : "Venta"} no encontrada.`, "OPERACION_NO_ENCONTRADA");
  }
  const [details] = await pool.execute(
    `SELECT d.id, d.producto_id AS productoId, p.nombre AS productoNombre,
            d.cantidad, d.precio_unitario AS precioUnitario, d.subtotal
       FROM ${definition.detailsTable} d
       JOIN productos p ON p.id = d.producto_id
      WHERE d.${definition.foreignKey} = ?
      ORDER BY d.id`,
    [operationId]
  );
  const header = headers[0];
  return {
    id: Number(header.id),
    numero: header.numero,
    [definition.partyProperty]: header.party,
    fecha: header.fecha,
    total: Number(header.total),
    createdBy: header.createdBy
      ? { id: Number(header.createdBy), nombre: header.createdByName }
      : null,
    createdAt: header.createdAt,
    lineas: details.map((line) => ({
      id: Number(line.id),
      productoId: Number(line.productoId),
      productoNombre: line.productoNombre,
      cantidad: Number(line.cantidad),
      precioUnitario: Number(line.precioUnitario),
      subtotal: Number(line.subtotal)
    }))
  };
}

async function findByIdempotency(pool, type, key) {
  const definition = DEFINITIONS[type];
  const [rows] = await pool.execute(
    `SELECT id, request_hash AS requestHash FROM ${definition.table} WHERE idempotency_key = ? LIMIT 1`,
    [key]
  );
  return rows[0] || null;
}

async function createOperation(pool, type, input, user, hooks = {}) {
  const definition = DEFINITIONS[type];
  try {
    const operationId = await withTransaction(async (connection) => {
      const temporaryNumber = `TMP-${crypto.randomUUID()}`;
      const [headerResult] = await connection.execute(
        `INSERT INTO ${definition.table}
           (numero, ${definition.partyColumn}, fecha, total, idempotency_key, request_hash, created_by)
         VALUES (?, ?, ?, 0, ?, ?, ?)`,
        [temporaryNumber, input.party, input.fecha, input.key, input.hash, user.id]
      );
      const id = headerResult.insertId;
      const productIds = input.lines.map((line) => line.productoId);
      const placeholders = productIds.map(() => "?").join(",");
      const [products] = await connection.execute(
        `SELECT id, nombre, precio, stock, umbral_stock, activo
           FROM productos
          WHERE id IN (${placeholders})
          ORDER BY id
          FOR UPDATE`,
        productIds
      );
      const byId = new Map(products.map((product) => [Number(product.id), product]));
      for (const line of input.lines) {
        const product = byId.get(line.productoId);
        if (!product || !product.activo) {
          throw new AppError(422, `El producto ${line.productoId} no existe o está inactivo.`, "PRODUCTO_INVALIDO");
        }
        if (type === "venta" && Number(product.stock) < line.cantidad) {
          throw new AppError(
            409,
            `Stock insuficiente para ${product.nombre}. Disponible: ${product.stock}.`,
            "STOCK_INSUFICIENTE",
            { productoId: line.productoId, disponible: Number(product.stock) }
          );
        }
        if (
          type === "venta" &&
          line.precioUnitario !== undefined &&
          Math.abs(Number(product.precio) - line.precioUnitario) > 0.001
        ) {
          throw new AppError(
            409,
            `El precio de ${product.nombre} cambió. Actualiza la operación.`,
            "PRECIO_DESACTUALIZADO",
            { productoId: line.productoId, precioActual: Number(product.precio) }
          );
        }
      }

      let total = 0;
      for (const line of input.lines) {
        const product = byId.get(line.productoId);
        const unitPrice = type === "compra" ? line.precioUnitario : Number(product.precio);
        const subtotal = Math.round(unitPrice * line.cantidad * 100) / 100;
        total = Math.round((total + subtotal) * 100) / 100;
        if (total > 9999999999.99) validation.validationError("El total de la operación excede el máximo permitido.");

        await connection.execute(
          `UPDATE productos SET stock = stock + ? WHERE id = ?`,
          [definition.stockDirection * line.cantidad, line.productoId]
        );
        await connection.execute(
          `INSERT INTO ${definition.detailsTable}
             (${definition.foreignKey}, producto_id, cantidad, precio_unitario, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [id, line.productoId, line.cantidad, unitPrice, subtotal]
        );
        await refreshStockAlert(connection, line.productoId);
      }

      const number = `${definition.numberPrefix}-${String(id).padStart(6, "0")}`;
      await connection.execute(
        `UPDATE ${definition.table} SET numero = ?, total = ? WHERE id = ?`,
        [number, total, id]
      );
      await connection.execute(
        `INSERT INTO movimientos (tipo, origen, referencia_id, monto, fecha, descripcion, usuario_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          definition.movementType,
          definition.movementOrigin,
          id,
          total,
          input.fecha,
          `${type === "compra" ? "Compra" : "Venta"} interna ${number}`,
          user.id
        ]
      );

      if (typeof hooks.beforeOperationCommit === "function") {
        await hooks.beforeOperationCommit({ type, id, connection });
      }
      return id;
    }, pool);

    return { operation: await fetchOperation(pool, type, operationId), reused: false };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || error.code === "ER_LOCK_DEADLOCK") {
      const existing = await findByIdempotency(pool, type, input.key);
      if (existing) {
        if (existing.requestHash !== input.hash) {
          throw new AppError(
            409,
            "La clave de idempotencia ya fue usada con datos diferentes.",
            "IDEMPOTENCIA_CONFLICTO"
          );
        }
        return { operation: await fetchOperation(pool, type, existing.id), reused: true };
      }
    }
    throw error;
  }
}

function createOperationRouter(pool, type, authenticate, hooks) {
  const router = express.Router();
  const definition = DEFINITIONS[type];
  router.use(authenticate);

  router.get("/", asyncHandler(async (req, res) => {
    const range = parseDateRange(req.query);
    const params = [];
    const conditions = dateWhere("o", range, params);
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `SELECT o.id, o.numero, o.${definition.partyColumn} AS party, o.fecha, o.total,
              o.created_by AS createdBy, u.nombre AS createdByName, o.created_at AS createdAt
         FROM ${definition.table} o LEFT JOIN usuarios u ON u.id = o.created_by
         ${where}
        ORDER BY o.fecha DESC, o.id DESC LIMIT 1000`,
      params
    );
    const property = type === "compra" ? "compras" : "ventas";
    res.json({
      [property]: rows.map((row) => ({
        id: Number(row.id),
        numero: row.numero,
        [definition.partyProperty]: row.party,
        fecha: row.fecha,
        total: Number(row.total),
        createdBy: row.createdBy ? { id: Number(row.createdBy), nombre: row.createdByName } : null,
        createdAt: row.createdAt
      }))
    });
  }));

  router.post("/", asyncHandler(async (req, res) => {
    const input = operationInput(req, type);
    const result = await createOperation(pool, type, input, req.user, hooks);
    const property = type;
    res.status(result.reused ? 200 : 201).json({ [property]: result.operation, reutilizada: result.reused });
  }));

  router.get("/:id/comprobante", asyncHandler(async (req, res) => {
    const operation = await fetchOperation(pool, type, validation.id(req.params.id));
    res.json({
      comprobante: {
        tipo: type.toUpperCase(),
        titulo: `Comprobante interno de ${type}`,
        ...operation,
        aviso: "Documento interno de control. No es factura electrónica ni documento fiscal."
      }
    });
  }));

  router.get("/:id", asyncHandler(async (req, res) => {
    res.json({ [type]: await fetchOperation(pool, type, validation.id(req.params.id)) });
  }));

  return router;
}

module.exports = {
  createOperationRouter,
  createOperation,
  fetchOperation,
  operationInput,
  DEFINITIONS
};
