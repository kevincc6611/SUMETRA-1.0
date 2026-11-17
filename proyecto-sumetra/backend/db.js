const mysql = require("mysql2/promise");
const { config, assertDatabaseConfig } = require("./config");

let pool;

function getPool() {
  assertDatabaseConfig();
  if (!pool) {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: config.db.connectionLimit,
      queueLimit: 0,
      decimalNumbers: true,
      dateStrings: true,
      charset: "utf8mb4"
    });
  }
  return pool;
}

async function withTransaction(work, transactionPool = getPool()) {
  const connection = await transactionPool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      error.rollbackError = rollbackError;
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function closePool() {
  if (pool) {
    const activePool = pool;
    pool = undefined;
    await activePool.end();
  }
}

module.exports = { getPool, withTransaction, closePool };
