// Dirección base del servidor Express que se conecta con MySQL.
const API_URL = "http://localhost:3001";

// Convierte la respuesta HTTP en JSON y comunica errores del servidor.
async function leerRespuesta(response) {
  const contenido = await response.text();
  let datos;

  try {
    datos = JSON.parse(contenido);
  } catch {
    throw new Error("El servidor no devolvió una respuesta válida.");
  }

  if (!response.ok) {
    throw new Error(datos.error || "No se pudo completar la operación.");
  }

  return datos;
}

// Obtiene todos los usuarios registrados.
export async function leerUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`);
  return await response.json();
}

// Registra un nuevo usuario.
export async function crearUsuario(usuario) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(usuario)
  });
  return await response.json();
}

// Obtiene los ingresos guardados en la base de datos.
export async function leerIngresos() {
  const response = await fetch(`${API_URL}/ingresos`);
  return leerRespuesta(response);
}

// Guarda un nuevo ingreso en la base de datos.
export async function crearIngreso(ingreso) {
  const response = await fetch(`${API_URL}/ingresos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(ingreso)
  });
  return leerRespuesta(response);
}
// Obtiene los gastos guardados en la base de datos.
export async function leerGastos() {
  const response = await fetch(`${API_URL}/gastos`);
  return leerRespuesta(response);
}

// Guarda un nuevo gasto en la base de datos.
export async function crearGasto(gasto) {
  const response = await fetch(`${API_URL}/gastos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(gasto)
  });
  return leerRespuesta(response);
}

// Obtiene los productos registrados en el inventario.
export async function leerProductos() {
  const response = await fetch(`${API_URL}/productos`);
  return leerRespuesta(response);
}
