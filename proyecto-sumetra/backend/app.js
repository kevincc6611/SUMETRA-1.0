const express = require("express");
const cors = require("cors");
const { config, assertRuntimeConfig } = require("./config");
const { getPool } = require("./db");
const { AppError, asyncHandler } = require("./lib/errors");
const validation = require("./lib/validation");
const { createAuthMiddleware } = require("./middleware/auth");
const { createAuthRouter } = require("./routes/auth");
const { createUsersRouter } = require("./routes/users");
const { createProductsRouter } = require("./routes/products");
const { createMovementsRouter } = require("./routes/movements");
const { createOperationRouter, fetchOperation } = require("./routes/operations");
const { createBalanceRouter } = require("./routes/balance");
const { createAlertsRouter } = require("./routes/alerts");
const { createSupportRouter } = require("./routes/support");
const { createReportsRouter } = require("./routes/reports");

function createApp({ pool = getPool(), hooks = {} } = {}) {
  assertRuntimeConfig();
  const app = express();
  app.disable("x-powered-by");
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes("*") || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new AppError(403, "Origen no permitido por CORS.", "ORIGEN_NO_PERMITIDO"));
    },
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    maxAge: 600
  }));
  app.use(express.json({ limit: "256kb" }));

  const { authenticate, authorize } = createAuthMiddleware(pool);

  app.get("/api/health", asyncHandler(async (_req, res) => {
    await pool.query("SELECT 1");
    res.json({ estado: "ok", servicio: "sumetra-api", version: "1.1.0" });
  }));
  app.use("/api/auth", createAuthRouter(pool, authenticate));
  app.use("/api/usuarios", createUsersRouter(pool, authenticate, authorize));
  app.use("/api/productos", createProductsRouter(pool, authenticate, authorize));
  app.use("/api/movimientos", createMovementsRouter(pool, authenticate, authorize));
  app.use("/api/compras", createOperationRouter(pool, "compra", authenticate, hooks));
  app.use("/api/ventas", createOperationRouter(pool, "venta", authenticate, hooks));
  app.use("/api/balance", createBalanceRouter(pool, authenticate));
  app.use("/api/alertas", createAlertsRouter(pool, authenticate));
  app.use("/api/soporte", createSupportRouter(pool, authenticate, authorize));
  app.use("/api/reportes", createReportsRouter(pool, authenticate));

  app.get("/api/comprobantes/:tipo/:id", authenticate, asyncHandler(async (req, res) => {
    const tipo = validation.enumValue(String(req.params.tipo).toLowerCase(), "tipo", ["compra", "venta"]);
    const operation = await fetchOperation(pool, tipo, validation.id(req.params.id));
    res.json({
      comprobante: {
        tipo: tipo.toUpperCase(),
        titulo: `Comprobante interno de ${tipo}`,
        ...operation,
        aviso: "Documento interno de control. No es factura electrónica ni documento fiscal."
      }
    });
  }));

  app.use((_req, _res, next) => {
    next(new AppError(404, "Ruta no encontrada.", "RUTA_NO_ENCONTRADA"));
  });

  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed") {
      return res.status(400).json({ error: "El cuerpo JSON no es válido.", codigo: "JSON_INVALIDO" });
    }
    if (error instanceof AppError) {
      const body = { error: error.message, codigo: error.code };
      if (error.details !== undefined) body.detalles = error.details;
      return res.status(error.status).json(body);
    }
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El registro ya existe.", codigo: "REGISTRO_DUPLICADO" });
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(422).json({ error: "Uno de los registros relacionados no existe.", codigo: "RELACION_INVALIDA" });
    }
    console.error("Error no controlado en SUMETRA API:", error);
    return res.status(500).json({
      error: "No se pudo completar la operación.",
      codigo: "ERROR_INTERNO"
    });
  });

  return app;
}

module.exports = { createApp };
