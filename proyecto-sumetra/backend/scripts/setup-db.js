const { ensureDatabase } = require("./database-admin");
const { migrate } = require("./migrate");
const { closePool } = require("../db");

async function setupDatabase() {
  const database = await ensureDatabase();
  await migrate();
  return database;
}

if (require.main === module) {
  setupDatabase()
    .then((database) => console.log(`Base ${database} creada y migrada.`))
    .catch((error) => {
      console.error(`No se pudo preparar la base: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(closePool);
}

module.exports = { setupDatabase };
