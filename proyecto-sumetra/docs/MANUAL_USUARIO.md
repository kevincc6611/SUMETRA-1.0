# Manual de usuario

## Antes de empezar

Este manual describe el recorrido objetivo de CAM16. Las opciones deben
compararse con la interfaz final y marcarse en la bitácora después de probarlas.
Los nombres o permisos que cambien durante el desarrollo deben actualizarse aquí.

## Roles

### Administrador

Gestiona productos, inventario, compras, ventas, movimientos, reportes, alertas,
usuarios/roles y solicitudes de soporte, según los permisos finales.

### Usuario

Opera los módulos permitidos por la organización. No puede acceder a la gestión
de roles ni ejecutar acciones reservadas, aunque intente abrir directamente una
URL o llamar la API.

## 1. Crear una cuenta

1. Abre SUMETRA y selecciona **Registrarse**.
2. Escribe nombre, correo válido y contraseña.
3. Envía el formulario una sola vez mientras aparece el estado de carga.
4. Si el correo ya existe, el sistema debe indicarlo sin crear otra cuenta.
5. El registro público siempre crea un usuario estándar; el rol administrador no
   se elige desde este formulario.

## 2. Iniciar y cerrar sesión

1. Selecciona **Iniciar sesión**.
2. Ingresa correo y contraseña.
3. Con credenciales correctas se abre el panel; con credenciales incorrectas se
   muestra un mensaje sin revelar qué dato falló.
4. Para salir usa **Cerrar sesión**. Volver a una URL privada no debe mostrar
   información protegida.

## 3. Productos e inventario

1. Abre **Inventario**.
2. Para crear un producto completa nombre, precio(s), stock inicial y mínimo,
   según el formulario final.
3. Guarda y espera el mensaje de éxito.
4. Usa **Editar** para corregir datos permitidos.
5. Usa **Eliminar/Desactivar** solo después de leer la confirmación. Un producto
   con historial no debe hacer desaparecer compras o ventas anteriores.
6. Los cambios de stock derivados de compras/ventas no se capturan nuevamente
   como movimiento manual.

## 4. Registrar una compra

1. Abre **Compras** y selecciona **Nueva compra**.
2. Añade dos o más productos para demostrar una operación multilínea.
3. Indica cantidades enteras, precios válidos y fecha.
4. Revisa el total calculado y confirma una sola vez.
5. Comprueba el número interno del comprobante, el aumento del stock y la salida
   automática de dinero.
6. Reenviar la misma operación no debe crear una segunda compra.

## 5. Registrar una venta

1. Abre **Ventas** y selecciona **Nueva venta**.
2. Añade productos y cantidades enteras.
3. Revisa total y stock disponible.
4. Confirma la operación.
5. Comprueba el comprobante interno, la disminución de stock y la entrada
   automática de dinero.
6. Si no hay stock suficiente, la venta completa debe rechazarse sin cambios
   parciales.

## 6. Ingresos y gastos manuales

1. Abre **Movimientos**, **Ingresos** o **Gastos**, según la navegación final.
2. Selecciona un movimiento manual.
3. Ingresa monto positivo, fecha válida, categoría y descripción.
4. Guarda y verifica el historial.

No registres manualmente una venta como ingreso ni una compra como gasto: esas
operaciones ya generan su movimiento automático.

## 7. Balance y gráficos

1. Abre **Balance** o el panel principal.
2. Revisa entradas, salidas y resultado del periodo.
3. Si existe filtro de fechas, elige un rango válido.
4. Los totales deben coincidir con el reporte de movimientos del mismo rango.

El resultado es un resumen operativo de entradas menos salidas, no un estado
financiero completo.

## 8. Alertas de inventario

1. Abre **Alertas**.
2. Filtra por nivel de prioridad.
3. Revisa el producto y corrige el stock mediante una compra cuando corresponda.
4. Usa **Marcar atendida** si el flujo final lo permite.
5. Recarga o reinicia la aplicación: el estado atendido debe persistir.
6. Si vuelve a cumplirse la condición de stock bajo, la alerta debe renovarse
   según la regla documentada.

## 9. Reportes y exportación

1. Abre **Reportes**.
2. Selecciona el tipo de reporte y un rango de fechas.
3. Genera la consulta y compara los totales visibles.
4. Selecciona **Exportar CSV**.
5. Abre el archivo y confirma encabezados, acentos, fechas, montos y filas.

## 10. Comprobantes internos

1. Abre una compra o venta confirmada.
2. Selecciona **Ver/Imprimir comprobante**.
3. Comprueba número interno, fecha, líneas, cantidades, precios y total.
4. Usa la vista de impresión del navegador.

El documento es soporte interno. No es factura electrónica ni documento fiscal
autorizado por la DIAN.

## 11. Solicitar soporte

1. Abre **Soporte**.
2. Escribe asunto y descripción suficientes para reproducir el problema.
3. Envía y espera la confirmación del servidor.
4. Anota el identificador o estado si la interfaz final lo muestra.

## Mensajes esperados

- **Cargando:** evita enviar repetidamente la misma operación.
- **Éxito:** confirma que la API terminó la operación.
- **Validación:** corrige el campo indicado; no se guardó la operación.
- **Sin stock/conflicto:** actualiza la pantalla antes de intentar otra venta.
- **Sesión vencida:** vuelve a iniciar sesión; no dejes datos sensibles visibles.
- **Error del servidor:** conserva el mensaje y los pasos, y repórtalos por
  soporte. No incluyas contraseñas.
