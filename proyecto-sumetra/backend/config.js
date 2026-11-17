const path = require("node:path");
const dotenv = require("dotenv");

const envFile = process.env.ENV_FILE
  ? path.resolve(process.cwd(), process.env.ENV_FILE)
  : path.resolve(process.cwd(), ".env");

dotenv.config({ path: envFile, quiet: true });

function integerFromEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${name} debe ser un entero entre ${min} y ${max}.`);
  }
  return value;
}

const config = {
  env: process.env.NODE_ENV || "development",
  port: integerFromEnv("PORT", 3001, { min: 1, max: 65535 }),
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    secret: process.env.JWT_SECRET || "",
    expiresIn: process.env.JWT_EXPIRES_IN || "8h"
  },
  bcryptRounds: integerFromEnv("BCRYPT_ROUNDS", 12, { min: 10, max: 15 }),
  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: integerFromEnv("DB_PORT", 3306, { min: 1, max: 65535 }),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sumetra_db",
    connectionLimit: integerFromEnv("DB_CONNECTION_LIMIT", 10, { min: 2, max: 50 })
  }
};

function assertDatabaseConfig() {
  if (!config.db.database) {
    throw new Error("Falta DB_NAME. Copia .env.example a .env y configura la base de datos.");
  }
}

function assertRuntimeConfig() {
  assertDatabaseConfig();
  if (config.jwt.secret.length < 32) {
    throw new Error("JWT_SECRET debe contener al menos 32 caracteres aleatorios.");
  }
}

module.exports = { config, assertDatabaseConfig, assertRuntimeConfig };
