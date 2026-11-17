# Bitácora de SUMETRA

## Convenciones

- Los cambios usan el identificador `CAM##`.
- Cada entrada separa lo implementado de lo únicamente propuesto.
- Una prueba solo se marca aprobada si se ejecutó y se conserva su resultado.
- Las rutas se expresan desde la carpeta `proyecto-sumetra`.

## Nota sobre el historial recibido

El 17 de noviembre de 2026 se revisó la carpeta abierta y el historial Git
disponible. No se encontró una bitácora anterior, una carpeta `docs`, un archivo
`AGENTS.md`, etiquetas de versión ni evidencia que permita reconstruir CAM01 a
CAM15. Los paquetes y el repositorio remoto identifican la base como 1.0.0.

Se usa **CAM16** porque es el identificador indicado en el encargo de
continuación. Esto no constituye evidencia de que CAM01–CAM15 estén incluidos en
la copia disponible.

---

## CAM16 — Terminación y preparación de entrega

**Fecha de inicio:** 2026-11-17  
**Estado:** En progreso  
**Responsable:** Kevin Tabares Carvajal, con asistencia de Codex  
**Versión base:** SUMETRA 1.0.0

### Problema encontrado

La aplicación tenía módulos parciales y documentación de plantilla. El esquema
SQL no coincidía por completo con las consultas del backend y no existían
pruebas automatizadas. El acceso se resolvía en el navegador mediante datos de
usuario completos, las rutas no estaban protegidas por la API y las operaciones
de compras/ventas no estaban modeladas como transacciones. También faltaban
reportes, comprobantes, soporte y una guía reproducible de instalación.

### Objetivo del cambio

Completar y comprobar el recorrido principal con MySQL/MariaDB real:

1. Autenticación y autorización por rol.
2. CRUD e inventario de productos.
3. Compras y ventas con varias líneas, stock y movimiento financiero atómicos.
4. Ingresos, gastos, balance y alertas coherentes.
5. Reportes, exportación, comprobantes internos y soporte.
6. Validación de servidor, idempotencia y manejo de concurrencia.
7. Documentación, datos ficticios y guion de presentación.

### Cambios realizados

Esta sección se completa durante CAM16. No implica que cada punto objetivo ya
esté implementado.

- [x] Auditoría inicial de repositorio, documentación, interfaz y esquema.
- [x] Creación de la documentación base de CAM16.
- [x] Respaldo local de `sumetra_db` y restauración comprobada en
  `sumetra_test`; las cuatro tablas y sus conteos coincidieron. La evidencia y el
  respaldo permanecen locales y no se publican.
- [ ] Alineación final del esquema/migraciones y variables de entorno.
- [ ] Terminación y validación del backend.
- [ ] Terminación y validación de la interfaz.
- [ ] Pruebas automatizadas.
- [ ] Integración completa con MySQL/MariaDB real.
- [ ] Recorrido completo en navegador de escritorio y móvil.
- [ ] Revisión final de documentación contra la implementación.

### Entorno comprobado

- Node.js 24.18.0.
- npm 11.16.0 (`npm.cmd` en PowerShell por la política de ejecución local).
- XAMPP MariaDB 10.4.32 en `127.0.0.1:3306`.
- Respaldo y restauración verificados antes de cambiar el modelo.

### Archivos afectados

Documentación creada inicialmente:

- `README.md`
- `docs/BITACORA.md`
- `docs/INSTALACION.md`
- `docs/MODELO_DATOS.md`
- `docs/TECNICA.md`
- `docs/MANUAL_USUARIO.md`
- `docs/PRUEBAS.md`
- `docs/GUION_DEMO.md`
- `docs/CHECKLIST_PRESENTACION.md`
- `docs/LIMITACIONES.md`

Los archivos de código y base de datos se enumerarán aquí al finalizar CAM16.

### Cambios de base de datos

**Estado:** Pendientes de confirmar contra el esquema realmente aplicado.

El modelo objetivo está descrito en `docs/MODELO_DATOS.md`. Antes de modificar
la base existente se creó un respaldo local y se restauró en la base separada
`sumetra_test`. La verificación inicial confirmó cuatro tablas y conteos
coincidentes. Falta registrar aquí el nombre de cada migración final y sus
resultados sobre esa copia, sin incluir rutas personales ni secretos.

### Pruebas y resultado real

La evidencia detallada se registra en `docs/PRUEBAS.md`.

| Fecha | Prueba/comando | Entorno | Resultado real | Evidencia |
|---|---|---|---|---|
| 2026-11-17 | Auditoría documental y de estructura | Carpeta local/Git | Se confirmó versión 1.0.0 y ausencia de bitácora previa | Salida local de Git y archivos revisados |
| 2026-11-17 | Respaldo y restauración | MariaDB 10.4.32, `sumetra_db` → `sumetra_test` | Aprobada: 4 tablas y conteos coincidentes | Evidencia local, no publicada |
| Pendiente | Build del frontend | Local | No registrado aún | Pendiente |
| Pendiente | Pruebas del backend | Base de pruebas | No registrado aún | Pendiente |
| Pendiente | Recorrido en navegador | Navegador real | No registrado aún | Pendiente |

### Evidencias disponibles

- Historial Git local y estado del árbol de trabajo revisados el 2026-11-17.
- Verificación local del respaldo/restauración de MariaDB.
- Documentación de auditoría incorporada en esta entrada.
- Las capturas, exportaciones y comprobantes reales se añadirán solo después de
  ejecutar los flujos correspondientes.

### Pendientes y bloqueos

- Confirmar las variables finales que consume el backend.
- Ejecutar todas las pruebas de riesgo descritas en `docs/PRUEBAS.md`.
- Actualizar esta entrada con resultados, archivos y migraciones definitivas.
- No declarar el proyecto listo mientras exista una prueba crítica pendiente o
  un error conocido en el recorrido principal.
