const { config } = require("../config");
const { assertDisposableDatabase, createAdminConnection } = require("./database-admin");
const { closePool } = require("../db");

async function resetDatabase() {
  const database = assertDisposableDatabase();
  await closePool();
  const connection = await createAdminConnection();
  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await connection.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
  return database;
}

if (require.main === module) {
  resetDatabase()
    .then((database) => console.log(`Base descartable ${database} reiniciada.`))
    .catch((error) => {
      console.error(`No se pudo reiniciar ${config.db.database || "la base"}: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { resetDatabase };
