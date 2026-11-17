const bcrypt = require("bcryptjs");

async function columnExists(connection, table, column) {
  const [rows] = await connection.execute(
    `SELECT 1
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      LIMIT 1`,
    [table, column]
  );
  return rows.length > 0;
}

async function indexExists(connection, table, index) {
  const [rows] = await connection.execute(
    `SELECT 1
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?
      LIMIT 1`,
    [table, index]
  );
  return rows.length > 0;
}

async function addColumn(connection, table, column, definition) {
  if (!(await columnExists(connection, table, column))) {
    await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function addIndex(connection, table, index, definition) {
  if (!(await indexExists(connection, table, index))) {
    await connection.query(`ALTER TABLE \`${table}\` ADD ${definition}`);
  }
}

async function up(connection, { bcryptRounds }) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(254) NOT NULL,
      password VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255) NULL,
      rol VARCHAR(30) NOT NULL DEFAULT 'usuario',
      activo TINYINT(1) NOT NULL DEFAULT 1,
      ultimo_acceso DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_usuarios_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await addColumn(connection, "usuarios", "password_hash", "VARCHAR(255) NULL AFTER `password`");
  await addColumn(connection, "usuarios", "activo", "TINYINT(1) NOT NULL DEFAULT 1 AFTER `rol`");
  await addColumn(connection, "usuarios", "ultimo_acceso", "DATETIME NULL AFTER `activo`");
  await addColumn(connection, "usuarios", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `ultimo_acceso`");
  await addColumn(
    connection,
    "usuarios",
    "updated_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`"
  );
  await addIndex(connection, "usuarios", "uq_usuarios_email", "UNIQUE KEY `uq_usuarios_email` (`email`)");

  const [legacyUsers] = await connection.query(
    "SELECT id, password, password_hash FROM usuarios WHERE password_hash IS NULL OR password_hash = ''"
  );
  for (const user of legacyUsers) {
    const source = String(user.password || "");
    const hash = /^\$2[aby]\$/.test(source) ? source : await bcrypt.hash(source, bcryptRounds);
    await connection.execute("UPDATE usuarios SET password_hash = ?, password = ? WHERE id = ?", [hash, hash, user.id]);
  }
  await connection.query(
    `UPDATE usuarios
        SET rol = CASE
          WHEN LOWER(TRIM(rol)) IN ('admin', 'administrador', 'administrator') THEN 'administrador'
          ELSE 'usuario'
        END,
        email = LOWER(TRIM(email))`
  );

  await connection.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id INT NOT NULL AUTO_INCREMENT,
      nombre VARCHAR(120) NOT NULL,
      descripcion VARCHAR(500) NULL,
      precio DECIMAL(12,2) NOT NULL,
      stock INT NOT NULL DEFAULT 0,
      umbral_stock INT NOT NULL DEFAULT 5,
      activo TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_productos_nombre (nombre),
      KEY idx_productos_activo (activo)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await addColumn(connection, "productos", "descripcion", "VARCHAR(500) NULL AFTER `nombre`");
  await addColumn(connection, "productos", "umbral_stock", "INT NOT NULL DEFAULT 5 AFTER `stock`");
  await addColumn(connection, "productos", "activo", "TINYINT(1) NOT NULL DEFAULT 1 AFTER `umbral_stock`");
  await addColumn(connection, "productos", "created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `activo`");
  await addColumn(
    connection,
    "productos",
    "updated_at",
    "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`"
  );
  await addIndex(connection, "productos", "idx_productos_nombre", "KEY `idx_productos_nombre` (`nombre`)");
  await addIndex(connection, "productos", "idx_productos_activo", "KEY `idx_productos_activo` (`activo`)");

  await connection.query(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      tipo ENUM('INGRESO','GASTO') NOT NULL,
      origen VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
      referencia_id BIGINT UNSIGNED NULL,
      monto DECIMAL(12,2) NOT NULL,
      fecha DATE NOT NULL,
      descripcion VARCHAR(500) NOT NULL,
      usuario_id INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_movimientos_origen_referencia (origen, referencia_id),
      KEY idx_movimientos_fecha_tipo (fecha, tipo),
      CONSTRAINT fk_movimientos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS compras (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      numero VARCHAR(40) NOT NULL,
      proveedor VARCHAR(160) NULL,
      fecha DATE NOT NULL,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      idempotency_key VARCHAR(128) NOT NULL,
      request_hash CHAR(64) NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_compras_numero (numero),
      UNIQUE KEY uq_compras_idempotency (idempotency_key),
      KEY idx_compras_fecha (fecha),
      CONSTRAINT fk_compras_usuario FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS compra_detalles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      compra_id BIGINT UNSIGNED NOT NULL,
      producto_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(12,2) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_compra_producto (compra_id, producto_id),
      KEY idx_compra_detalle_producto (producto_id),
      CONSTRAINT fk_compra_detalle_compra FOREIGN KEY (compra_id) REFERENCES compras(id) ON DELETE CASCADE,
      CONSTRAINT fk_compra_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS ventas (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      numero VARCHAR(40) NOT NULL,
      cliente VARCHAR(160) NULL,
      fecha DATE NOT NULL,
      total DECIMAL(12,2) NOT NULL DEFAULT 0,
      idempotency_key VARCHAR(128) NOT NULL,
      request_hash CHAR(64) NOT NULL,
      created_by INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ventas_numero (numero),
      UNIQUE KEY uq_ventas_idempotency (idempotency_key),
      KEY idx_ventas_fecha (fecha),
      CONSTRAINT fk_ventas_usuario FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS venta_detalles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      venta_id BIGINT UNSIGNED NOT NULL,
      producto_id INT NOT NULL,
      cantidad INT NOT NULL,
      precio_unitario DECIMAL(12,2) NOT NULL,
      subtotal DECIMAL(12,2) NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_venta_producto (venta_id, producto_id),
      KEY idx_venta_detalle_producto (producto_id),
      CONSTRAINT fk_venta_detalle_venta FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
      CONSTRAINT fk_venta_detalle_producto FOREIGN KEY (producto_id) REFERENCES productos(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS alertas (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      producto_id INT NOT NULL,
      tipo VARCHAR(40) NOT NULL DEFAULT 'STOCK_BAJO',
      mensaje VARCHAR(500) NOT NULL,
      estado ENUM('PENDIENTE','ATENDIDA','RESUELTA') NOT NULL DEFAULT 'PENDIENTE',
      stock_observado INT NOT NULL,
      umbral_observado INT NOT NULL,
      atendida_por INT NULL,
      atendida_at DATETIME NULL,
      resuelta_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_alertas_estado_fecha (estado, created_at),
      KEY idx_alertas_producto (producto_id),
      CONSTRAINT fk_alertas_producto FOREIGN KEY (producto_id) REFERENCES productos(id),
      CONSTRAINT fk_alertas_usuario FOREIGN KEY (atendida_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await connection.query(`
    CREATE TABLE IF NOT EXISTS solicitudes_soporte (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      usuario_id INT NOT NULL,
      asunto VARCHAR(160) NOT NULL,
      mensaje TEXT NOT NULL,
      estado ENUM('ABIERTA','EN_PROCESO','CERRADA') NOT NULL DEFAULT 'ABIERTA',
      respuesta TEXT NULL,
      atendida_por INT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_soporte_usuario (usuario_id),
      KEY idx_soporte_estado (estado),
      CONSTRAINT fk_soporte_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
      CONSTRAINT fk_soporte_atendida FOREIGN KEY (atendida_por) REFERENCES usuarios(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const [legacyTables] = await connection.query(
    `SELECT TABLE_NAME
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('ingresos','gastos')`
  );
  const names = new Set(legacyTables.map((row) => row.TABLE_NAME));
  if (names.has("ingresos")) {
    await connection.query(`
      INSERT IGNORE INTO movimientos (tipo, origen, referencia_id, monto, fecha, descripcion)
      SELECT 'INGRESO', 'LEGACY_INGRESO', id, monto, fecha, 'Ingreso migrado del sistema anterior'
        FROM ingresos
       WHERE monto > 0 AND fecha IS NOT NULL
    `);
  }
  if (names.has("gastos")) {
    await addColumn(connection, "gastos", "tipo", "VARCHAR(255) NULL");
    await connection.query(`
      INSERT IGNORE INTO movimientos (tipo, origen, referencia_id, monto, fecha, descripcion)
      SELECT 'GASTO', 'LEGACY_GASTO', id, monto, fecha,
             CONCAT('Gasto migrado', IF(tipo IS NULL OR tipo = '', '', CONCAT(': ', tipo)))
        FROM gastos
       WHERE monto > 0 AND fecha IS NOT NULL
    `);
  }

  await connection.query(`
    INSERT INTO alertas (producto_id, mensaje, stock_observado, umbral_observado)
    SELECT p.id,
           CONCAT('Existencias bajas de ', p.nombre, ': ', p.stock, ' unidad(es).'),
           p.stock,
           p.umbral_stock
      FROM productos p
     WHERE p.activo = 1
       AND p.stock <= p.umbral_stock
       AND NOT EXISTS (
         SELECT 1 FROM alertas a WHERE a.producto_id = p.id AND a.estado = 'PENDIENTE'
       )
  `);
}

module.exports = { version: "001", name: "initial_transactional_schema", up };
