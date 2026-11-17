async function refreshStockAlert(connection, productId) {
  const [products] = await connection.execute(
    "SELECT id, nombre, stock, umbral_stock, activo FROM productos WHERE id = ? FOR UPDATE",
    [productId]
  );
  if (products.length === 0) return;
  const product = products[0];

  const [pending] = await connection.execute(
    "SELECT id FROM alertas WHERE producto_id = ? AND estado = 'PENDIENTE' ORDER BY id DESC LIMIT 1 FOR UPDATE",
    [productId]
  );

  if (product.activo && product.stock <= product.umbral_stock) {
    const message = `Existencias bajas de ${product.nombre}: ${product.stock} unidad(es).`;
    if (pending.length > 0) {
      await connection.execute(
        "UPDATE alertas SET mensaje = ?, stock_observado = ?, umbral_observado = ? WHERE id = ?",
        [message, product.stock, product.umbral_stock, pending[0].id]
      );
    } else {
      await connection.execute(
        `INSERT INTO alertas (producto_id, tipo, mensaje, estado, stock_observado, umbral_observado)
         VALUES (?, 'STOCK_BAJO', ?, 'PENDIENTE', ?, ?)`,
        [productId, message, product.stock, product.umbral_stock]
      );
    }
  } else if (pending.length > 0) {
    await connection.execute(
      "UPDATE alertas SET estado = 'RESUELTA', resuelta_at = NOW() WHERE producto_id = ? AND estado = 'PENDIENTE'",
      [productId]
    );
  }
}

module.exports = { refreshStockAlert };
