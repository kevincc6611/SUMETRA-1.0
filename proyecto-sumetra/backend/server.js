const { createApp } = require("./app");
const { config, assertRuntimeConfig } = require("./config");
const { getPool, closePool } = require("./db");

async function startServer() {
  assertRuntimeConfig();
  const pool = getPool();
  await pool.query("SELECT 1");
  const app = createApp({ pool });
  const server = app.listen(config.port, () => {
    console.log(`SUMETRA API disponible en http://localhost:${config.port}`);
  });

  let closing = false;
  async function shutdown(signal) {
    if (closing) return;
    closing = true;
    console.log(`Cerrando SUMETRA API (${signal})...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(`No se pudo iniciar SUMETRA API: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { startServer };
