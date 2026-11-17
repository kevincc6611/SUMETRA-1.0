const mysql = require("mysql2/promise");
const { config, assertDatabaseConfig } = require("../config");

function assertDisposableDatabase(database = config.db.database) {
  assertDatabaseConfig();
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error("DB_NAME contiene caracteres no permitidos.");
  }
  if (!/_(test|demo)$/.test(database)) {
    throw new Error("Operación rechazada: solo se permiten bases terminadas en _test o _demo.");
  }
  return database;
}

async function createAdminConnection() {
  return mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    charset: "utf8mb4"
  });
}

async function ensureDatabase() {
  const database = assertDisposableDatabase();
  const connection = await createAdminConnection();
  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
  return database;
}

module.exports = { assertDisposableDatabase, createAdminConnection, ensureDatabase };
