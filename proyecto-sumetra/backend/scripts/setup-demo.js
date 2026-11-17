process.env.DB_NAME = "sumetra_demo";

const { setupDatabase } = require("./setup-db");
const { seedDemo } = require("./seed-demo");
const { closePool } = require("../db");

async function main() {
  await setupDatabase();
  await seedDemo();
  console.log("Base sumetra_demo preparada con datos ficticios.");
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(`No se pudo preparar la demostración: ${error.message}`);
      process.exitCode = 1;
    })
    .finally(closePool);
}
