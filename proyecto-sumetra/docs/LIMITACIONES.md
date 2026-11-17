# Alcance y limitaciones

## Alcance de SUMETRA

SUMETRA es un proyecto formativo para control interno de un pequeño negocio.
Centraliza usuarios, productos, inventario, compras, ventas, movimientos,
balance operativo, alertas, reportes y solicitudes de soporte dentro del alcance
que se confirme en CAM16.

## Límites que deben comunicarse

### Comprobantes

Los comprobantes de compra o venta son documentos internos de la aplicación. No
son factura electrónica, documento equivalente ni validación ante la DIAN. El
sistema no implementa firma digital, numeración fiscal, envío a proveedor
tecnológico ni recepción de eventos tributarios.

### Balance

El balance corresponde a entradas menos salidas registradas en el periodo. No es
balance general contable ni incluye necesariamente activos, pasivos, patrimonio,
causación, depreciaciones, impuestos, conciliación bancaria o cierre contable.
No sustituye estados financieros ni asesoría profesional.

### Inventario

El stock depende de operaciones correctamente registradas. CAM16 no presume
trazabilidad por lotes, seriales, vencimientos, múltiples bodegas, costos
promedio ni conteos físicos, salvo que la implementación final los incorpore y
se prueben expresamente.

### Pagos e integraciones

No se procesan pagos reales ni se integran bancos, pasarelas, correo, WhatsApp,
DIAN u otros servicios externos, salvo documentación posterior con pruebas.

### Seguridad y despliegue

La ejecución documentada es local para demostración académica. Antes de exponer
el sistema a Internet se requieren configuración de producción, HTTPS, gestión
de secretos, política de copias, monitoreo, límites de solicitudes y revisión de
seguridad. Una configuración local de XAMPP con usuario `root` y contraseña vacía
no es aceptable en producción.

### Datos y privacidad

Los datos de demostración deben ser ficticios. El proyecto no declara
cumplimiento normativo para almacenar información personal real y no incluye una
política de retención o tratamiento de datos.

## Funciones fuera del alcance de CAM16

- Facturación electrónica o contabilidad completa.
- Comercio electrónico y pagos en línea.
- Aplicación móvil nativa.
- Operación multiempresa o multibodega, salvo decisión documentada.
- Integraciones externas no necesarias para la entrega formativa.
- Despliegue público o publicación automática del repositorio.

## Estado de verificación

La existencia de este documento no significa que todos los módulos estén
terminados. El estado real y los bloqueos se consultan en `BITACORA.md` y los
resultados ejecutados en `PRUEBAS.md`.
