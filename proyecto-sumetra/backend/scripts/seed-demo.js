const bcrypt = require("bcryptjs");
const { getPool, closePool } = require("../db");
const { config } = require("../config");
const { assertDisposableDatabase } = require("./database-admin");

const DEMO_USERS = [
  {
    nombre: "Administración Demo",
    email: "admin.demo@sumetra.local",
    password: "AdminDemo2026!",
    rol: "administrador"
  },
  {
    nombre: "Usuario Demo",
    email: "usuario.demo@sumetra.local",
    password: "UsuarioDemo2026!",
    rol: "usuario"
  }
];

async function seedDemo(targetPool = getPool()) {
  assertDisposableDatabase();
  for (const user of DEMO_USERS) {
    const hash = await bcrypt.hash(user.password, config.bcryptRounds);
    await targetPool.execute(
      `INSERT INTO usuarios (nombre, email, password, password_hash, rol, activo)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE
         nombre = VALUES(nombre), password = VALUES(password), password_hash = VALUES(password_hash),
         rol = VALUES(rol), activo = 1`,
      [user.nombre, user.email, hash, hash, user.rol]
    );
  }

  const products = [
    ["Cuaderno argollado", "Cuaderno académico de demostración", 12500, 25, 5],
    ["Bolígrafo azul", "Bolígrafo de tinta azul", 2500, 40, 10],
    ["Memoria USB 32 GB", "Unidad USB para datos de demostración", 32000, 8, 3]
  ];
  for (const product of products) {
    const [existing] = await targetPool.execute("SELECT id FROM productos WHERE nombre = ? LIMIT 1", [product[0]]);
    if (existing.length === 0) {
      await targetPool.execute(
        "INSERT INTO productos (nombre, descripcion, precio, stock, umbral_stock) VALUES (?, ?, ?, ?, ?)",
        product
      );
    }
  }
}

if (require.main === module) {
  seedDemo()
    .then(() => console.log(`Datos ficticios cargados en ${config.db.database}.`))
    .catch((error) => {
      console.error(`No se pudieron cargar los datos ficticios: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(closePool);
}

module.exports = { seedDemo, DEMO_USERS };
