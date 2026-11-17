# Instalación local

Esta guía está orientada a Windows, PowerShell y MariaDB incluido en XAMPP. Los
comandos se ejecutan desde la carpeta `proyecto-sumetra`, salvo que se indique
lo contrario.

## 1. Entorno comprobado

- Windows con PowerShell.
- Node.js 24.18.0.
- npm 11.16.0.
- XAMPP MariaDB 10.4.32 en `127.0.0.1:3306`.
- Un navegador moderno.

En el equipo comprobado, la política de ejecución de PowerShell bloquea
`npm.ps1`; por eso los ejemplos usan `npm.cmd`.

Comprueba las herramientas sin modificar datos:

```powershell
node --version
npm.cmd --version
& 'C:\xampp\mysql\bin\mysql.exe' --version
```

## 2. Respaldo antes de migrar

No pruebes una migración por primera vez sobre la base de trabajo. Detén aquí el
proceso si no sabes si la base contiene información que debas conservar.

Ejemplo de respaldo con XAMPP (la herramienta solicita la contraseña de forma
interactiva; no la escribas en el comando ni en esta documentación):

```powershell
New-Item -ItemType Directory -Force -Path .\backups | Out-Null
& 'C:\xampp\mysql\bin\mysqldump.exe' --host=127.0.0.1 --port=3306 --user=root --password --databases sumetra_db --result-file=.\backups\sumetra_db_antes_cam16.sql
```

Verifica que el archivo exista y no esté vacío:

```powershell
Get-Item .\backups\sumetra_db_antes_cam16.sql | Select-Object FullName,Length,LastWriteTime
```

La carpeta `backups` debe permanecer local y fuera de Git si contiene datos. En
CAM16 ya se comprobó una restauración de `sumetra_db` a `sumetra_test` con las
cuatro tablas y sus conteos coincidentes.

## 3. Instalar dependencias

Frontend:

```powershell
npm.cmd install
```

Backend:

```powershell
Set-Location .\backend
npm.cmd install
Set-Location ..
```

Usa `npm.cmd ci` en lugar de `npm.cmd install` cuando los archivos
`package-lock.json` definitivos estén sincronizados y no necesites modificarlos.

## 4. Configurar el entorno

El backend de CAM16 debe leer estas variables. Usa `backend/.env.example` como
plantilla cuando esté disponible y crea un `backend/.env` local.

```dotenv
NODE_ENV=development
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sumetra_test
JWT_SECRET=REEMPLAZAR_LOCALMENTE_POR_UN_VALOR_LARGO_Y_ALEATORIO
```

Reglas:

- `sumetra_test` es la base recomendada para pruebas. No reutilices una base con
  datos reales.
- Una contraseña vacía solo corresponde a instalaciones locales de XAMPP que
  realmente estén configuradas así. No es una configuración de producción.
- No confirmes `backend/.env` en Git y no copies su contenido en capturas.
- El secreto JWT del ejemplo no es válido: sustitúyelo únicamente en tu archivo
  local.

## 5. Crear la base separada de pruebas

Inicia **MySQL** desde el panel de XAMPP. Luego abre el cliente:

```powershell
& 'C:\xampp\mysql\bin\mysql.exe' --host=127.0.0.1 --port=3306 --user=root --password
```

En la consola SQL crea una base independiente:

```sql
CREATE DATABASE IF NOT EXISTS sumetra_test
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

Después aplica el archivo de esquema o migración que quede definido en CAM16.
No uses el antiguo `sumetra.db` sin revisarlo: el archivo recibido no contenía
todas las tablas que esperaba la aplicación.

Ejemplo, si el esquema final se ubica en `backend/sql/schema.sql`:

```powershell
Get-Content -Raw .\backend\sql\schema.sql | & 'C:\xampp\mysql\bin\mysql.exe' --host=127.0.0.1 --port=3306 --user=root --password sumetra_test
```

La ruta definitiva debe confirmarse al cerrar CAM16.

## 6. Iniciar los servicios

Terminal 1 — API:

```powershell
Set-Location .\backend
node .\server.js
```

Terminal 2 — interfaz:

```powershell
npm.cmd run dev
```

Direcciones esperadas:

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

No inicies `npm.cmd run server`: ese script corresponde al prototipo anterior
con JSON Server y no representa la integración MariaDB de CAM16.

## 7. Comprobaciones mínimas de arranque

1. La terminal del backend confirma la conexión sin mostrar credenciales.
2. La URL de salud de la API responde, si CAM16 la incorpora.
3. El frontend abre sin errores rojos en la consola del navegador.
4. El registro/login usa la API y no `db.json`.
5. Un dato de prueba sigue existiendo después de reiniciar backend y frontend.

Registra el comando y resultado real en `docs/PRUEBAS.md`.

## 8. Solución de problemas

### Puerto 3306 ocupado

```powershell
Get-NetTCPConnection -LocalPort 3306 -ErrorAction SilentlyContinue
```

### Puerto 3001 o 5173 ocupado

```powershell
Get-NetTCPConnection -LocalPort 3001,5173 -ErrorAction SilentlyContinue
```

No cierres procesos que no identifiques. Puedes detener el proceso anterior de
SUMETRA desde su terminal con `Ctrl+C`.

### Acceso denegado a MariaDB

Comprueba usuario, contraseña y puerto en el `.env`. No soluciones el problema
incluyendo la contraseña directamente en el código.

### Tabla o columna inexistente

La base no tiene el esquema de CAM16 o la migración falló. Repite la importación
en `sumetra_test` y compara el modelo con `docs/MODELO_DATOS.md`; no añadas
columnas al arrancar sin una migración registrada.

### El navegador no conecta con la API

Comprueba que el backend siga ejecutándose, que la URL base sea la prevista y
que CORS permita el origen local de Vite. Revisa primero el mensaje de la
terminal del backend y la pestaña Red del navegador.
