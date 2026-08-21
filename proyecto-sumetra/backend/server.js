// server.js
// Dependencias del servidor HTTP, CORS y conexión con MySQL.
const express = require("express");
const cors = require("cors");
const db = require("./db");

// Crea la aplicación Express y permite recibir solicitudes JSON desde el frontend.
const app = express();
app.use(cors());
app.use(express.json());

// Endpoint: obtiene todos los ingresos registrados.
app.get("/ingresos", (req, res) => {
  db.query("SELECT * FROM ingresos", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Endpoint: guarda un nuevo ingreso en MySQL.
app.post("/ingresos", (req, res) => {
  const { monto, fecha } = req.body;
  db.query("INSERT INTO ingresos (monto, fecha) VALUES (?, ?)", [monto, fecha], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Ingreso guardado", id: result.insertId });
  });
});

// Endpoint: obtiene todos los gastos registrados.
app.get("/gastos", (req, res) => {
  db.query("SELECT id, monto, fecha, tipo FROM gastos", (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json(result);
  });
});

// Endpoint: guarda un nuevo gasto en MySQL.
app.post("/gastos", (req, res) => {
  const { monto, fecha, tipo } = req.body;
  db.query(
    "INSERT INTO gastos (monto, fecha, tipo) VALUES (?, ?, ?)",
    [monto, fecha, tipo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ message: "Gasto guardado", id: result.insertId });
    }
  );
});

// Endpoint: obtiene los productos que forman el inventario.
app.get("/productos", (req, res) => {
  db.query("SELECT id, nombre, precio, stock FROM productos", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// Middleware general para responder errores inesperados del servidor.
app.use((err, req, res, next) => {
  console.error("Error en el backend:", err);
  res.status(500).json({ error: "No se pudo completar la operación." });
});

// Asegura que la tabla de gastos tenga la columna usada por el formulario.
db.query(
  "ALTER TABLE gastos ADD COLUMN IF NOT EXISTS tipo VARCHAR(255)",
  (err) => {
    if (err) {
      console.error("Error preparando la tabla gastos:", err);
    }
  }
);

// Inicia el backend en el puerto utilizado por el frontend.
app.listen(3001, () => {
  console.log("🚀 Backend corriendo en http://localhost:3001");
});


