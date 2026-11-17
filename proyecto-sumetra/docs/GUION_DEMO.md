# Guion breve de demostración

Duración sugerida: 7 a 10 minutos. Usa únicamente la base de demostración y
datos claramente ficticios.

## Preparación

- Usuario ficticio administrador: `admin.demo@sumetra.local`.
- Producto ficticio A: `Café demostración 500 g`.
- Producto ficticio B: `Filtro demostración #2`.
- Stock inicial y saldos anotados antes de empezar.
- Una compra y una venta preparadas, pero sin confirmar.
- Carpeta de descarga vacía para identificar el CSV.

No escribas la contraseña del usuario de demostración en este documento ni la
muestres en una diapositiva.

## Recorrido

### 1. Inicio de sesión

“SUMETRA separa usuarios y permisos. Iniciaré con una cuenta ficticia de
administrador. Una URL privada sin sesión y una cuenta estándar no autorizada
son rechazadas por el backend.”

Inicia sesión y señala el usuario/rol visible sin mostrar información sensible.

### 2. Producto e inventario

Abre inventario, crea o muestra `Café demostración 500 g` y anota el stock. Edita
un dato no crítico y muestra el mensaje de éxito.

### 3. Compra multilínea

Registra una compra con los dos productos ficticios. Antes de confirmar explica
que el total se recalcula en el servidor. Confirma y muestra:

- comprobante interno;
- aumento de ambos stocks;
- una sola salida financiera.

### 4. Venta multilínea

Registra una venta de ambos productos. Muestra:

- comprobante interno;
- descuento de ambos stocks;
- una sola entrada financiera.

Aclara que la operación rechaza cantidades superiores al stock y se revierte
completa ante un fallo.

### 5. Balance y gráficos

Abre el balance. Relaciona compra/venta con movimientos y muestra que el resumen
del periodo coincide. Explica que se trata de entradas menos salidas, no de
estados financieros completos.

### 6. Alertas

Muestra un producto ficticio en umbral bajo, atiende la alerta y explica su
persistencia o renovación según la regla final verificada.

### 7. Reporte y CSV

Filtra el mismo periodo, genera el reporte y descarga el CSV. Ábrelo para mostrar
encabezados, fechas, líneas y totales.

### 8. Comprobante

Abre la vista imprimible de una venta. Señala número interno, líneas y total.
Aclara: “Es un comprobante operativo interno; no es factura electrónica DIAN”.

### 9. Cierre

Menciona brevemente:

- validación del servidor;
- transacciones e idempotencia;
- prueba con MariaDB real;
- límites registrados en `docs/LIMITACIONES.md`.

Finaliza cerrando la sesión.

## Plan de contingencia

- Conserva una captura real reciente y un CSV ficticio solo como respaldo, no
  para fingir una ejecución actual.
- Si XAMPP no inicia, no cambies la base de trabajo: revisa puerto y servicio.
- Si una función falla durante la demostración, informa el error real y no
  repitas una operación financiera sin comprobar antes si se guardó.
