const { getPool, closePool } = require("../db");
const { config, assertDatabaseConfig } = require("../config");
const initialMigration = require("../migrations/001_initial");

const migrations = [initialMigration];

async function migrate(targetPool = getPool()) {
  assertDatabaseConfig();
  const connection = await targetPool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(30) NOT NULL,
        name VARCHAR(160) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (version)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    const [appliedRows] = await connection.query("SELECT version FROM schema_migrations");
    const applied = new Set(appliedRows.map((row) => row.version));

    for (const migration of migrations) {
      if (applied.has(migration.version)) continue;
      await migration.up(connection, { bcryptRounds: config.bcryptRounds });
      await connection.execute(
        "INSERT INTO schema_migrations (version, name) VALUES (?, ?)",
        [migration.version, migration.name]
      );
    }
  } finally {
    connection.release();
  }
}

async function main() {
  try {
    await migrate();
    console.log(`Migraciones aplicadas en ${config.db.database}.`);
  } finally {
    await closePool();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`No se pudieron aplicar las migraciones: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { migrate };
