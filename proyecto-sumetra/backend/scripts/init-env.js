const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const backendRoot = path.resolve(__dirname, "..");
const examplePath = path.join(backendRoot, ".env.example");
const envPath = path.join(backendRoot, ".env");

if (fs.existsSync(envPath)) {
  console.log(".env ya existe; no se sobrescribió.");
  process.exit(0);
}

const secret = crypto.randomBytes(48).toString("base64url");
const template = fs.readFileSync(examplePath, "utf8");
const content = template.replace(
  "REEMPLAZAR_CON_UN_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS",
  secret
);

fs.writeFileSync(envPath, content, { encoding: "utf8", flag: "wx", mode: 0o600 });
console.log(".env local creado con un JWT_SECRET aleatorio (el valor no se mostró). ");
