# Lista previa a la presentación

Marca esta lista el mismo día de la demostración. Una casilla vacía no equivale
a un fallo, pero debe resolverse o declararse como límite.

## Equipo y servicios

- [ ] El computador usa cargador y tiene espacio libre suficiente.
- [ ] Node.js/npm coinciden con las versiones probadas.
- [ ] MariaDB de XAMPP inicia y usa el puerto configurado.
- [ ] La base seleccionada es la de demostración, no una base real.
- [ ] Existe un respaldo reciente y verificable de la base que se va a conservar.
- [ ] `backend/.env` existe localmente y no se proyecta ni se abre durante la demo.
- [ ] Puertos 3001 y 5173 están disponibles.

## Datos ficticios

- [ ] Los usuarios terminan en `@sumetra.local` o están identificados como demo.
- [ ] Productos, proveedores, clientes y solicitudes son ficticios.
- [ ] El stock inicial está anotado.
- [ ] Hay una alerta de stock preparada.
- [ ] No hay contraseñas ni información personal en capturas, CSV o comprobantes.

## Validación técnica

- [ ] Dependencias instaladas.
- [ ] Build del frontend aprobado y registrado.
- [ ] Pruebas críticas del backend aprobadas y registradas.
- [ ] Backend conecta a MariaDB real.
- [ ] Frontend abre sin errores críticos de consola.
- [ ] Datos persisten después de reiniciar ambos servicios.
- [ ] Login, producto, compra, venta, inventario, movimiento y balance funcionan.
- [ ] Venta sin stock y reenvío duplicado se rechazan correctamente.
- [ ] Roles impiden una acción administrativa desde interfaz y API.
- [ ] Alertas atendidas persisten y se renuevan según lo documentado.
- [ ] Reporte filtra por fecha y CSV abre correctamente.
- [ ] Comprobante se abre en vista de impresión.
- [ ] Interfaz se revisó en escritorio y ancho móvil.

## Documentación y exposición

- [ ] README coincide con los comandos y rutas reales.
- [ ] CAM16 tiene archivos, migraciones, pruebas y evidencia actualizados.
- [ ] Modelo de datos coincide con el esquema aplicado.
- [ ] Manual coincide con los nombres visibles en pantalla.
- [ ] El guion se ensayó en menos de 10 minutos.
- [ ] Se explican claramente los límites del sistema.

## Comandos de la demostración

Terminal 1:

```powershell
Set-Location .\backend
node .\server.js
```

Terminal 2, desde `proyecto-sumetra`:

```powershell
npm.cmd run dev
```

## Criterio de “listo para presentar”

Solo marcar cuando:

- [ ] El recorrido principal funciona con MariaDB real.
- [ ] No hay errores críticos conocidos.
- [ ] La persistencia fue verificada después de reiniciar.
- [ ] Las pruebas críticas tienen resultados reales.
- [ ] La documentación coincide con la versión ejecutada.
