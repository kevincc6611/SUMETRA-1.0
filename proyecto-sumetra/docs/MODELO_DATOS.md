# Modelo de datos

## Estado del documento

Este archivo describe el **modelo objetivo de CAM16**. Debe compararse con las
migraciones y tablas realmente aplicadas antes de marcarlo como definitivo.

El archivo `sumetra.db` recibido era un script SQL incompleto: solo definía
`ingresos`, `gastos` y `productos`, no incluía usuarios y no coincidía con todas
las consultas del backend. `db.json` pertenece al prototipo con JSON Server y no
es la fuente de verdad de CAM16.

## Principios

- InnoDB para transacciones y bloqueo de filas.
- `utf8mb4` para texto en español.
- Claves foráneas y restricciones en la base, además de validación en la API.
- Dinero en `DECIMAL`, nunca en coma flotante.
- Cantidades enteras positivas para inventario.
- Fechas guardadas de forma consistente; la API valida que sean reales.
- Compras/ventas, stock y movimiento financiero se confirman en una sola
  transacción.
- Una clave de idempotencia evita repetir una operación al reenviar la solicitud.

## Entidades objetivo

### `usuarios`

| Campo | Tipo orientativo | Regla |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK, autoincremental |
| `nombre` | VARCHAR(120) | obligatorio |
| `email` | VARCHAR(190) | obligatorio, normalizado y UNIQUE |
| `password_hash` | VARCHAR(255) | obligatorio; nunca devolverlo al cliente |
| `rol` | ENUM/VARCHAR | `admin` o `usuario` |
| `activo` | BOOLEAN | valor por defecto verdadero |
| `created_at`, `updated_at` | DATETIME/TIMESTAMP | auditoría |

### `productos`

| Campo | Tipo orientativo | Regla |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `nombre` | VARCHAR(150) | obligatorio |
| `sku` | VARCHAR(80) | UNIQUE si se utiliza |
| `precio_compra` | DECIMAL(12,2) | mayor o igual a cero |
| `precio_venta` | DECIMAL(12,2) | mayor o igual a cero |
| `stock` | INT UNSIGNED | entero mayor o igual a cero |
| `stock_minimo` | INT UNSIGNED | umbral de alerta |
| `activo` | BOOLEAN | baja lógica recomendada |
| `created_at`, `updated_at` | DATETIME/TIMESTAMP | auditoría |

Si CAM16 conserva un único campo `precio`, la documentación y la interfaz deben
indicar si representa precio de venta y cómo se captura el costo de compra.

### `compras` y `compra_detalles`

`compras` representa el encabezado: fecha, proveedor opcional, total, usuario,
estado, clave de idempotencia y fecha de creación. `compra_detalles` contiene
producto, cantidad entera, precio unitario y subtotal.

Al confirmar una compra:

1. se bloquean y validan los productos;
2. se insertan encabezado y líneas;
3. aumenta el stock;
4. se inserta **un** movimiento financiero de salida asociado a la compra;
5. se confirma la transacción completa.

### `ventas` y `venta_detalles`

`ventas` representa el encabezado: fecha, cliente opcional, total, usuario,
estado, clave de idempotencia y fecha de creación. `venta_detalles` contiene
producto, cantidad entera, precio unitario y subtotal.

Al confirmar una venta:

1. se bloquean las filas de producto con `SELECT ... FOR UPDATE` o una
   actualización condicional equivalente;
2. se valida que exista stock suficiente;
3. se insertan encabezado y líneas;
4. disminuye el stock sin permitir valores negativos;
5. se inserta **un** movimiento financiero de entrada asociado a la venta;
6. se confirma la transacción completa.

Dos ventas simultáneas no pueden consumir la misma última unidad.

### `movimientos_financieros`

| Campo | Tipo orientativo | Regla |
|---|---|---|
| `id` | BIGINT UNSIGNED | PK |
| `tipo` | ENUM/VARCHAR | `ingreso` o `gasto` |
| `categoria` | VARCHAR(80) | venta, compra o manual |
| `monto` | DECIMAL(12,2) | estrictamente positivo |
| `fecha` | DATE/DATETIME | válida |
| `descripcion` | VARCHAR(255) | contexto del movimiento |
| `origen_tipo` | VARCHAR(30) | venta, compra o manual |
| `origen_id` | BIGINT UNSIGNED/NULL | referencia al origen |
| `usuario_id` | BIGINT UNSIGNED | creador |

Debe existir una restricción lógica o única que impida más de un movimiento
automático para la misma compra/venta. Los formularios manuales no deben volver
a contar una operación ya reflejada automáticamente.

### `alertas_inventario`

Permite conservar el ciclo de vida de una alerta: producto, umbral, estado
(`activa`/`atendida`), fecha de creación, fecha de atención y usuario que la
atendió. Si el stock vuelve a caer después de una reposición, se crea o reactiva
una alerta según la regla implementada.

Una alerta almacenada únicamente en estado React no cumple el requisito de
persistencia.

### `solicitudes_soporte`

Contiene asunto, mensaje, estado, usuario solicitante y marcas de tiempo. El
servidor valida longitud y contenido mínimo; la interfaz muestra el resultado
real del envío.

### Comprobantes y reportes

El comprobante puede generarse a partir de `compras`/`ventas` y sus líneas sin
duplicar datos. Si se almacena un número interno, debe ser único. La exportación
de reportes consulta estas mismas fuentes filtradas por fechas válidas.

## Relaciones principales

```text
usuarios 1 ─── N compras 1 ─── N compra_detalles N ─── 1 productos
usuarios 1 ─── N ventas  1 ─── N venta_detalles  N ─── 1 productos
usuarios 1 ─── N movimientos_financieros
compras  1 ─── 1 movimiento_financiero (salida automática)
ventas   1 ─── 1 movimiento_financiero (entrada automática)
productos 1 ─── N alertas_inventario
usuarios  1 ─── N solicitudes_soporte
```

## Integridad que debe comprobarse

- Email duplicado rechazado por la base y por la API.
- Precios/montos no negativos; cantidades de líneas enteras y mayores que cero.
- Totales recalculados en el servidor a partir de las líneas.
- Clave de idempotencia única por operación/usuario.
- Venta sin stock: no inserta venta, líneas ni movimiento y no cambia stock.
- Fallo intermedio: rollback completo.
- Balance y reportes usan los mismos movimientos confirmados.
- Eliminación de productos con historial: baja lógica o rechazo, nunca pérdida
  silenciosa de relaciones.

## Respaldo y migración

Las migraciones definitivas deben vivir bajo una ruta versionada (por ejemplo,
`backend/sql/`) y ser ejecutables sobre una base vacía. Cada migración aplicada
se registra en `docs/BITACORA.md`, junto con la prueba realizada en
`sumetra_test`. Nunca se modifica automáticamente una tabla al arrancar sin
dejar una migración reproducible.
