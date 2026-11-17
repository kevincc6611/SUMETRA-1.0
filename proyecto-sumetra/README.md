# SUMETRA

Sistema web formativo para gestionar inventario, compras, ventas y movimientos de
dinero de un pequeño negocio.

**Autor:** Kevin Tabares Carvajal  
**Programa:** Análisis y Desarrollo de Software (SENA)  
**Ficha:** 3186649  
**Versión base comprobada:** 1.0.0  
**Actualización en curso:** CAM16 (17 de noviembre de 2026)

> La carpeta recibida no incluía una bitácora anterior ni una versión 1.1
> identificable. Por eso CAM16 se registra como la continuación solicitada sobre
> la versión 1.0, sin afirmar que existieron CAM01–CAM15 en este repositorio.

## Estado

CAM16 está en desarrollo y validación. El proyecto **no debe considerarse listo
para presentar** hasta que el recorrido principal haya sido probado con una base
MySQL/MariaDB real, persista después de reiniciar y la matriz de pruebas de
[`docs/PRUEBAS.md`](docs/PRUEBAS.md) esté actualizada con resultados reales.

Al iniciar CAM16 se encontró una aplicación React/Vite con un backend
Express/MySQL básico, registro e inicio de sesión en el navegador, ingresos,
gastos, balance y un CRUD de productos en trabajo local. Compras, ventas,
transacciones de inventario, autorización, reportes, comprobantes y soporte
requerían terminación o verificación. El detalle se conserva en
[`docs/BITACORA.md`](docs/BITACORA.md).

## Tecnologías

- React 18 y Vite 5 para la interfaz.
- React Router para navegación.
- Express y Node.js para la API.
- MySQL 8 o MariaDB 10.4 de XAMPP como base de datos relacional.
- `mysql2` para la conexión desde Node.js.
- Chart.js para los gráficos.

## Inicio rápido en Windows con XAMPP

El entorno comprobado durante CAM16 usa Node.js 24.18.0, npm 11.16.0 y MariaDB
10.4.32 de XAMPP en `127.0.0.1:3306`.

1. Inicia **MySQL** desde el panel de XAMPP. Apache no es necesario para React ni
   Express.
2. Abre PowerShell en esta carpeta (`proyecto-sumetra`).
3. Instala las dependencias:

   ```powershell
   npm.cmd install
   Set-Location .\backend
   npm.cmd install
   Set-Location ..
   ```

4. Configura las variables del backend siguiendo
   [`docs/INSTALACION.md`](docs/INSTALACION.md). Nunca confirmes el archivo
   `.env` ni publiques su contraseña.
5. Prepara primero una base separada para pruebas y ejecuta el esquema/migración
   indicada por CAM16. No importes sobre una base con datos sin crear un respaldo.
6. En una terminal inicia la API:

   ```powershell
   Set-Location .\backend
   node .\server.js
   ```

7. En otra terminal inicia la interfaz:

   ```powershell
   npm.cmd run dev
   ```

8. Abre la URL que muestre Vite, normalmente `http://localhost:5173`.

La API usa normalmente `http://localhost:3001`. Los comandos definitivos y la
solución de problemas están en [`docs/INSTALACION.md`](docs/INSTALACION.md).

## Documentación

- [Instalación y entorno local](docs/INSTALACION.md)
- [Modelo de datos](docs/MODELO_DATOS.md)
- [Arquitectura y documentación técnica](docs/TECNICA.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Matriz de pruebas](docs/PRUEBAS.md)
- [Bitácora de cambios](docs/BITACORA.md)
- [Guion de demostración](docs/GUION_DEMO.md)
- [Lista previa a la presentación](docs/CHECKLIST_PRESENTACION.md)
- [Alcance y limitaciones](docs/LIMITACIONES.md)

## Seguridad y datos

- Usa únicamente datos ficticios para la demostración.
- No compartas `.env`, contraseñas, tokens, volcados con información real ni
  copias de respaldo.
- No ejecutes el esquema sobre la base de trabajo sin validar primero una base
  separada.
- No publiques ni despliegues este proyecto sin revisar la configuración de
  producción.

## Alcance académico

SUMETRA apoya el control operativo interno. Un comprobante generado por el
sistema es un **comprobante interno**, no una factura electrónica autorizada por
la DIAN. El balance mostrado es la diferencia entre entradas y salidas
registradas y no sustituye estados financieros ni asesoría contable.
