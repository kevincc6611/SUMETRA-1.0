# Documentación técnica

## Propósito

SUMETRA separa una interfaz React, una API Express y una base MariaDB/MySQL. La
API es la única capa autorizada para leer o modificar datos persistentes.

```text
Navegador (React/Vite)
          │ HTTP + JSON
          ▼
API (Express: autenticación, autorización, validación y transacciones)
          │ consultas parametrizadas
          ▼
MariaDB/MySQL (restricciones, relaciones y persistencia)
```

## Carpetas principales

| Ruta | Responsabilidad |
|---|---|
| `src/pages/` | Pantallas y flujos del usuario |
| `src/componentes/` | Componentes de interfaz compartidos |
| `src/services/` | Cliente HTTP; no contiene reglas de negocio sensibles |
| `src/styles/` | Estilos de la aplicación |
| `backend/` | API y acceso a datos |
| `backend/sql/` | Ruta recomendada para esquema, migraciones y datos ficticios |
| `docs/` | Instalación, diseño, pruebas y material de entrega |

`db.json` y el script `npm run server` proceden del prototipo con JSON Server.
No deben confundirse con la base MariaDB usada para certificar CAM16.

## Configuración

La configuración sensible se obtiene mediante variables de entorno. Los nombres
documentados para CAM16 son:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`

El repositorio solo debe incluir un `.env.example` sin secretos. Los errores de
conexión no deben imprimir contraseñas.

## API y responsabilidades

La lista definitiva de rutas debe actualizarse cuando cierre CAM16. Como mínimo,
el diseño requiere recursos para:

- sesión: registro, login, identidad actual y cierre/expiración;
- usuarios/roles: administración restringida;
- productos: CRUD e inventario;
- compras y ventas: encabezado, líneas, consulta y comprobante;
- movimientos: ingresos/gastos manuales y consulta;
- balance/reportes: filtros por fecha y exportación;
- alertas: consulta y atención persistente;
- soporte: creación y seguimiento según rol.

### Respuesta de error

La API debe devolver un código HTTP coherente y un mensaje comprensible sin
detalles internos. Ejemplos esperados:

- `400`: datos o fecha inválidos;
- `401`: no autenticado;
- `403`: rol sin permiso;
- `404`: recurso inexistente;
- `409`: email duplicado, idempotencia o stock en conflicto;
- `500`: error inesperado registrado en servidor, sin secretos en la respuesta.

## Autenticación y autorización

- Las contraseñas se almacenan como hash; nunca se listan ni se devuelven.
- El login se valida en el backend.
- Las rutas privadas del frontend mejoran la experiencia, pero la seguridad real
  siempre se aplica en cada endpoint privado.
- Un usuario estándar no puede elevar su rol enviando `rol: admin`.
- La expiración o renovación de sesión debe definirse y probarse.
- El cierre de sesión elimina el estado local; si existen tokens renovables, se
  revocan según la estrategia implementada.

## Validación de negocio

El servidor vuelve a validar todo lo recibido:

- texto obligatorio y longitudes;
- emails normalizados;
- precios y montos finitos y no negativos o positivos según el caso;
- cantidades enteras positivas;
- fechas reales y rangos ordenados;
- productos activos y existentes;
- stock suficiente;
- total calculado desde las líneas, no aceptado ciegamente desde React.

## Transacciones, concurrencia e idempotencia

Una compra o venta ejecuta encabezado, líneas, cambio de stock y movimiento
financiero dentro de una transacción de base. Ante cualquier error se ejecuta
rollback.

La venta bloquea o actualiza condicionalmente las filas de inventario para que
dos solicitudes simultáneas no vendan la última unidad. Una clave de idempotencia
única permite devolver la operación original cuando el navegador reenvía la
misma solicitud, sin repetir stock ni dinero.

## Observabilidad y errores

- El backend registra fecha, ruta, estado y un identificador de solicitud.
- No registra contraseñas, tokens ni el contenido completo de `.env`.
- La interfaz muestra carga, éxito, vacío y error recuperable.
- Los errores críticos se documentan en la bitácora con pasos de reproducción.

## Construcción y validación

Frontend:

```powershell
npm.cmd run build
```

Backend, hasta que exista un script equivalente:

```powershell
Set-Location .\backend
node --check .\server.js
```

Las pruebas reales y sus comandos se registran en `docs/PRUEBAS.md`; este
documento no presupone que hayan sido ejecutadas.
