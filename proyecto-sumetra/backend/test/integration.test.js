process.env.NODE_ENV = "test";
process.env.DB_NAME = "sumetra_test";
process.env.JWT_SECRET = "sumetra-test-secret-2026-only-not-production";
process.env.BCRYPT_ROUNDS = "10";

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const { resetDatabase } = require("../scripts/reset-db");
const { setupDatabase } = require("../scripts/setup-db");
const { getPool, closePool } = require("../db");
const { createApp } = require("../app");
const { AppError } = require("../lib/errors");

let pool;
let app;
let adminToken;
let userToken;
let userId;
const created = {};

async function login(email, password) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.token;
}

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  await resetDatabase();
  await setupDatabase();
  pool = getPool();
  const adminPassword = "AdminTest2026!";
  const hash = await bcrypt.hash(adminPassword, 10);
  await pool.execute(
    `INSERT INTO usuarios (nombre, email, password, password_hash, rol, activo)
     VALUES ('Admin Pruebas', 'admin.test@sumetra.local', ?, ?, 'administrador', 1)`,
    [hash, hash]
  );
  app = createApp({ pool });
  adminToken = await login("admin.test@sumetra.local", adminPassword);
});

after(async () => {
  await closePool();
});

test("SUMETRA integra autenticación, permisos, inventario y finanzas sobre MariaDB", async (t) => {
  await t.test("salud y protección de rutas", async () => {
    const health = await request(app).get("/api/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.estado, "ok");

    const privateRoute = await request(app).get("/api/productos");
    assert.equal(privateRoute.status, 401);
    assert.equal(privateRoute.body.codigo, "SESION_REQUERIDA");
  });

  await t.test("registro valida duplicados y login valida credenciales", async () => {
    const registration = await request(app).post("/api/auth/register").send({
      nombre: "Usuario Pruebas",
      email: "usuario.test@sumetra.local",
      password: "UsuarioTest2026!"
    });
    assert.equal(registration.status, 201, JSON.stringify(registration.body));
    assert.equal(registration.body.usuario.rol, "usuario");
    userId = registration.body.usuario.id;
    userToken = registration.body.token;

    const duplicate = await request(app).post("/api/auth/register").send({
      nombre: "Duplicado",
      email: "USUARIO.TEST@sumetra.local",
      password: "OtraClave2026!"
    });
    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.body.codigo, "CORREO_DUPLICADO");

    const invalid = await request(app).post("/api/auth/login").send({
      email: "usuario.test@sumetra.local",
      password: "Incorrecta2026!"
    });
    assert.equal(invalid.status, 401);

    userToken = await login("usuario.test@sumetra.local", "UsuarioTest2026!");
    const profile = await request(app).get("/api/auth/me").set(auth(userToken));
    assert.equal(profile.status, 200);
    assert.equal(profile.body.usuario.id, userId);
    assert.equal("password" in profile.body.usuario, false);
  });

  await t.test("roles separan acciones de usuario y administrador", async () => {
    const forbiddenUsers = await request(app).get("/api/usuarios").set(auth(userToken));
    assert.equal(forbiddenUsers.status, 403);

    const forbiddenProduct = await request(app).post("/api/productos").set(auth(userToken)).send({
      nombre: "No permitido", precio: 100, stock: 1, umbralStock: 1
    });
    assert.equal(forbiddenProduct.status, 403);

    const roleChange = await request(app)
      .patch(`/api/usuarios/${userId}/rol`)
      .set(auth(adminToken))
      .send({ rol: "usuario" });
    assert.equal(roleChange.status, 200);
    assert.equal(roleChange.body.usuario.rol, "usuario");
  });

  await t.test("CRUD de productos y validación de servidor", async () => {
    const invalid = await request(app).post("/api/productos").set(auth(adminToken)).send({
      nombre: "Producto inválido", precio: -1, stock: 1.5, umbralStock: 0
    });
    assert.equal(invalid.status, 422);

    for (const product of [
      { key: "a", nombre: "Producto A", precio: 1000, stock: 10, umbralStock: 2 },
      { key: "b", nombre: "Producto B", precio: 2500, stock: 3, umbralStock: 1 },
      { key: "last", nombre: "Última unidad", precio: 5000, stock: 1, umbralStock: 0 },
      { key: "alert", nombre: "Producto alerta", precio: 800, stock: 2, umbralStock: 2 }
    ]) {
      const response = await request(app).post("/api/productos").set(auth(adminToken)).send(product);
      assert.equal(response.status, 201, JSON.stringify(response.body));
      created[product.key] = response.body.producto.id;
    }

    const update = await request(app)
      .put(`/api/productos/${created.a}`)
      .set(auth(adminToken))
      .send({ nombre: "Producto A actualizado", descripcion: "Prueba", precio: 1100, stock: 10, umbralStock: 2 });
    assert.equal(update.status, 200);
    assert.equal(update.body.producto.precio, 1100);

    const list = await request(app).get("/api/productos").set(auth(userToken));
    assert.equal(list.status, 200);
    assert.ok(list.body.productos.some((product) => product.id === created.a));
  });

  await t.test("compra multilínea suma stock, genera gasto y es idempotente", async () => {
    const body = {
      proveedor: "Proveedor ficticio",
      fecha: "2026-11-17",
      lineas: [
        { productoId: created.a, cantidad: 4, precioUnitario: 700 },
        { productoId: created.b, cantidad: 2, precioUnitario: 1800 }
      ]
    };
    const first = await request(app)
      .post("/api/compras")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-compra-0001")
      .send(body);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    assert.equal(first.body.compra.total, 6400);
    created.purchase = first.body.compra.id;

    const retry = await request(app)
      .post("/api/compras")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-compra-0001")
      .send(body);
    assert.equal(retry.status, 200);
    assert.equal(retry.body.reutilizada, true);
    assert.equal(retry.body.compra.id, created.purchase);

    const conflict = await request(app)
      .post("/api/compras")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-compra-0001")
      .send({ ...body, lineas: [{ productoId: created.a, cantidad: 1, precioUnitario: 700 }] });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.codigo, "IDEMPOTENCIA_CONFLICTO");

    const [products] = await pool.execute("SELECT id, stock FROM productos WHERE id IN (?, ?) ORDER BY id", [created.a, created.b]);
    const stockById = new Map(products.map((product) => [Number(product.id), Number(product.stock)]));
    assert.equal(stockById.get(created.a), 14);
    assert.equal(stockById.get(created.b), 5);
    const [[movementCount]] = await pool.execute(
      "SELECT COUNT(*) AS total FROM movimientos WHERE origen = 'COMPRA' AND referencia_id = ?",
      [created.purchase]
    );
    assert.equal(movementCount.total, 1);
  });

  await t.test("venta multilínea descuenta stock y rechaza cantidades decimales o insuficientes", async () => {
    const decimal = await request(app)
      .post("/api/ventas")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-venta-decimal")
      .send({ fecha: "2026-11-17", lineas: [{ productoId: created.a, cantidad: 1.5 }] });
    assert.equal(decimal.status, 422);

    const sale = await request(app)
      .post("/api/ventas")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-venta-0001")
      .send({
        cliente: "Cliente ficticio",
        fecha: "2026-11-17",
        lineas: [
          { productoId: created.a, cantidad: 3 },
          { productoId: created.b, cantidad: 2 }
        ]
      });
    assert.equal(sale.status, 201, JSON.stringify(sale.body));
    assert.equal(sale.body.venta.total, 8300);
    created.sale = sale.body.venta.id;

    const before = await pool.execute("SELECT stock FROM productos WHERE id = ?", [created.a]);
    const insufficient = await request(app)
      .post("/api/ventas")
      .set(auth(userToken))
      .set("Idempotency-Key", "test-venta-sin-stock")
      .send({ fecha: "2026-11-17", lineas: [
        { productoId: created.a, cantidad: 1 },
        { productoId: created.b, cantidad: 999999 }
      ] });
    assert.equal(insufficient.status, 409);
    assert.equal(insufficient.body.codigo, "STOCK_INSUFICIENTE");
    const afterStock = await pool.execute("SELECT stock FROM productos WHERE id = ?", [created.a]);
    assert.equal(afterStock[0][0].stock, before[0][0].stock);
  });

  await t.test("dos ventas simultáneas no consumen dos veces la última unidad", async () => {
    const saleBody = { fecha: "2026-11-17", lineas: [{ productoId: created.last, cantidad: 1 }] };
    const responses = await Promise.all([
      request(app).post("/api/ventas").set(auth(userToken)).set("Idempotency-Key", "concurrent-sale-01").send(saleBody),
      request(app).post("/api/ventas").set(auth(userToken)).set("Idempotency-Key", "concurrent-sale-02").send(saleBody)
    ]);
    assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
    const [[product]] = await pool.execute("SELECT stock FROM productos WHERE id = ?", [created.last]);
    assert.equal(product.stock, 0);
  });

  await t.test("una falla interna revierte encabezado, stock y movimiento", async () => {
    const rollbackApp = createApp({
      pool,
      hooks: {
        beforeOperationCommit: async ({ type }) => {
          if (type === "compra") throw new AppError(500, "Fallo simulado.", "FALLO_SIMULADO");
        }
      }
    });
    const [[beforeProduct]] = await pool.execute("SELECT stock FROM productos WHERE id = ?", [created.a]);
    const response = await request(rollbackApp)
      .post("/api/compras")
      .set(auth(userToken))
      .set("Idempotency-Key", "rollback-compra-01")
      .send({ fecha: "2026-11-17", lineas: [{ productoId: created.a, cantidad: 2, precioUnitario: 500 }] });
    assert.equal(response.status, 500);
    assert.equal(response.body.codigo, "FALLO_SIMULADO");
    const [[afterProduct]] = await pool.execute("SELECT stock FROM productos WHERE id = ?", [created.a]);
    assert.equal(afterProduct.stock, beforeProduct.stock);
    const [[headers]] = await pool.execute("SELECT COUNT(*) AS total FROM compras WHERE idempotency_key = 'rollback-compra-01'");
    assert.equal(headers.total, 0);
  });

  await t.test("alertas atendidas se conservan y se renuevan con un nuevo cambio de stock", async () => {
    const pending = await request(app).get("/api/alertas?estado=PENDIENTE").set(auth(userToken));
    const alert = pending.body.alertas.find((item) => item.producto.id === created.alert);
    assert.ok(alert);
    const attended = await request(app)
      .patch(`/api/alertas/${alert.id}/atender`)
      .set(auth(userToken));
    assert.equal(attended.status, 200);
    assert.equal(attended.body.alerta.estado, "ATENDIDA");

    const sale = await request(app)
      .post("/api/ventas")
      .set(auth(userToken))
      .set("Idempotency-Key", "alert-renew-sale")
      .send({ fecha: "2026-11-17", lineas: [{ productoId: created.alert, cantidad: 1 }] });
    assert.equal(sale.status, 201);
    const renewed = await request(app).get("/api/alertas?estado=PENDIENTE").set(auth(userToken));
    const renewedAlert = renewed.body.alertas.find((item) => item.producto.id === created.alert);
    assert.ok(renewedAlert);
    assert.notEqual(renewedAlert.id, alert.id);
  });

  await t.test("movimiento manual, balance, reportes CSV y comprobante coinciden", async () => {
    const invalidMovement = await request(app).post("/api/movimientos").set(auth(adminToken)).send({
      tipo: "GASTO", monto: -10, fecha: "fecha-inválida", descripcion: "No válido"
    });
    assert.equal(invalidMovement.status, 422);

    const manual = await request(app).post("/api/movimientos").set(auth(adminToken)).send({
      tipo: "GASTO", monto: 300, fecha: "2026-11-17", descripcion: "Transporte ficticio"
    });
    assert.equal(manual.status, 201);

    const balance = await request(app)
      .get("/api/balance?desde=2026-11-17&hasta=2026-11-17")
      .set(auth(userToken));
    assert.equal(balance.status, 200);
    const [[databaseSummary]] = await pool.query(
      `SELECT SUM(CASE WHEN tipo='INGRESO' THEN monto ELSE 0 END) ingresos,
              SUM(CASE WHEN tipo='GASTO' THEN monto ELSE 0 END) gastos
         FROM movimientos WHERE fecha = '2026-11-17'`
    );
    assert.equal(balance.body.resumen.ingresos, Number(databaseSummary.ingresos));
    assert.equal(balance.body.resumen.gastos, Number(databaseSummary.gastos));

    const csv = await request(app)
      .get("/api/reportes/movimientos?desde=2026-11-17&hasta=2026-11-17&formato=csv")
      .set(auth(userToken));
    assert.equal(csv.status, 200);
    assert.match(csv.headers["content-type"], /text\/csv/);
    assert.match(csv.headers["content-disposition"], /attachment/);
    assert.match(csv.text, /Descripción/);

    const receipt = await request(app)
      .get(`/api/ventas/${created.sale}/comprobante`)
      .set(auth(userToken));
    assert.equal(receipt.status, 200);
    assert.match(receipt.body.comprobante.aviso, /No es factura electrónica/);
  });

  await t.test("soporte restringe solicitudes propias y permite respuesta administrativa", async () => {
    const createdSupport = await request(app).post("/api/soporte").set(auth(userToken)).send({
      asunto: "Consulta de prueba",
      mensaje: "Esta es una solicitud ficticia para la prueba de integración."
    });
    assert.equal(createdSupport.status, 201);
    const supportId = createdSupport.body.solicitud.id;
    const update = await request(app)
      .patch(`/api/soporte/${supportId}`)
      .set(auth(adminToken))
      .send({ estado: "CERRADA", respuesta: "Solicitud ficticia resuelta." });
    assert.equal(update.status, 200);
    assert.equal(update.body.solicitud.estado, "CERRADA");
  });

  await t.test("los datos persisten al cerrar y recrear el pool de conexiones", async () => {
    await closePool();
    pool = getPool();
    app = createApp({ pool });
    const persisted = await request(app).get(`/api/productos/${created.a}`).set(auth(userToken));
    assert.equal(persisted.status, 200);
    assert.equal(persisted.body.producto.nombre, "Producto A actualizado");
  });
});
