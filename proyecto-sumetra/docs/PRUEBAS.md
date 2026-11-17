# Matriz de pruebas

## Regla de registro

`Pendiente` significa que no se ejecutó o que no existe evidencia suficiente.
Solo se cambia a `Aprobada` o `Fallida` después de ejecutar la prueba en el
entorno indicado. Cada resultado incluye fecha, base usada y evidencia
reproducible sin secretos.

## Entorno

| Dato | Valor real |
|---|---|
| Fecha inicial | 2026-11-17 |
| Windows | Pendiente de anotar edición/versión |
| Navegador y versión | Pendiente |
| Node.js | 24.18.0 |
| npm | 11.16.0 (`npm.cmd` en PowerShell) |
| Base de datos | XAMPP MariaDB 10.4.32, `127.0.0.1:3306` |
| Base de prueba | `sumetra_test` |
| Commit/punto de recuperación | Pendiente de anotar al cerrar CAM16 |

## Conservación de datos

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T00 | Respaldar `sumetra_db` y restaurar en `sumetra_test` | Aprobada (2026-11-17) | 4 tablas y conteos coincidentes; evidencia local no publicada |

## Automatización y arranque

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T01 | Instalación limpia de dependencias | Pendiente | |
| T02 | Validación/sintaxis del backend | Pendiente | |
| T03 | Build de producción del frontend | Pendiente | |
| T04 | Arranque API + conexión MariaDB real | Pendiente | |
| T05 | Arranque frontend sin errores críticos de consola | Pendiente | |

## Autenticación y permisos

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T10 | Registro correcto | Pendiente | |
| T11 | Correo duplicado, incluso con mayúsculas/espacios | Pendiente | |
| T12 | Login con credenciales válidas | Pendiente | |
| T13 | Login con contraseña incorrecta | Pendiente | |
| T14 | Acceso directo a ruta privada sin sesión | Pendiente | |
| T15 | Endpoint privado sin token/sesión | Pendiente | |
| T16 | Usuario estándar intenta acción de administrador | Pendiente | |
| T17 | Administrador ejecuta acción permitida | Pendiente | |
| T18 | Cierre de sesión y renovación o expiración | Pendiente | |

## Validaciones y productos

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T20 | Campos obligatorios vacíos | Pendiente | |
| T21 | Fecha inexistente o rango invertido | Pendiente | |
| T22 | Monto o precio negativo/no numérico | Pendiente | |
| T23 | Cantidad decimal, cero y negativa | Pendiente | |
| T24 | Crear y consultar producto | Pendiente | |
| T25 | Editar producto | Pendiente | |
| T26 | Eliminar o desactivar producto | Pendiente | |

## Compras, ventas y transacciones

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T30 | Compra con dos líneas aumenta ambos stocks | Pendiente | |
| T31 | Compra genera una sola salida financiera | Pendiente | |
| T32 | Venta con dos líneas descuenta ambos stocks | Pendiente | |
| T33 | Venta genera una sola entrada financiera | Pendiente | |
| T34 | Venta sin stock suficiente no cambia nada | Pendiente | |
| T35 | Reenvío de la misma compra no duplica | Pendiente | |
| T36 | Reenvío de la misma venta no duplica | Pendiente | |
| T37 | Dos ventas simultáneas por la última unidad | Pendiente | |
| T38 | Fallo forzado intermedio produce rollback completo | Pendiente | |

## Coherencia, persistencia y salidas

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T40 | Movimientos = balance = reporte del mismo rango | Pendiente | |
| T41 | Persistencia después de reiniciar servicios | Pendiente | |
| T42 | Alerta atendida persiste al recargar/reiniciar | Pendiente | |
| T43 | Alerta se renueva cuando vuelve a bajar el stock | Pendiente | |
| T44 | CSV descarga y abre con datos/acentos correctos | Pendiente | |
| T45 | Comprobante interno se abre e imprime | Pendiente | |
| T46 | Solicitud de soporte se almacena | Pendiente | |

## Navegador y accesibilidad básica

| ID | Prueba | Resultado | Evidencia/observación |
|---|---|---|---|
| T50 | Recorrido principal en escritorio | Pendiente | |
| T51 | Recorrido principal en ancho móvil | Pendiente | |
| T52 | Navegación por teclado y foco visible | Pendiente | |
| T53 | Mensajes de carga, éxito, vacío y error | Pendiente | |
| T54 | Sin desbordamiento horizontal inesperado | Pendiente | |

## Evidencia recomendada

- Salida de comandos guardada como texto, sin variables sensibles.
- Consultas de conteo/totales antes y después de la prueba.
- Capturas reales del navegador con datos ficticios.
- CSV exportado y comprobante impreso a PDF con datos ficticios.
- Para concurrencia, solicitudes simultáneas y resultado final del stock.
- Para rollback, error forzado y ausencia de filas/cambios parciales.

No se fabrica evidencia ni se reutiliza una captura para una prueba que no se
ejecutó.
