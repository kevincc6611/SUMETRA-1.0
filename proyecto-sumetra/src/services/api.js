const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const TOKEN_KEY = "sumetraToken";

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function parseResponse(response) {
  if (response.status === 204) return null;
  const type = response.headers.get("content-type") || "";
  if (type.includes("application/json")) return response.json();
  const text = await response.text();
  return text ? { message: text } : null;
}

export async function apiRequest(path, options = {}) {
  const { body, headers: extraHeaders, ...requestOptions } = options;
  const token = getToken();
  const headers = new Headers(extraHeaders || {});
  if (body !== undefined && !(body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...requestOptions,
      headers,
      body: body instanceof FormData || typeof body === "string" ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError("No fue posible conectar con el servidor. Verifica que el backend esté iniciado.", 0);
  }

  const data = await parseResponse(response).catch(() => null);
  if (!response.ok) {
    const message = data?.error || data?.message || "No se pudo completar la operación.";
    if (response.status === 401 && token) window.dispatchEvent(new CustomEvent("sumetra:unauthorized"));
    throw new ApiError(message, response.status, data?.detalles || data?.details);
  }
  return data;
}

function queryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : "";
}

export const authApi = {
  login: (credentials) => apiRequest("/auth/login", { method: "POST", body: credentials }),
  register: (user) => apiRequest("/auth/register", { method: "POST", body: user }),
  me: () => apiRequest("/auth/me"),
};

export const productsApi = {
  list: (params) => apiRequest(`/productos${queryString(params)}`).then((data) => data?.productos || data || []),
  get: (id) => apiRequest(`/productos/${id}`).then((data) => data?.producto || data),
  create: (product) => apiRequest("/productos", { method: "POST", body: product }),
  update: (id, product) => apiRequest(`/productos/${id}`, { method: "PUT", body: product }),
  remove: (id) => apiRequest(`/productos/${id}`, { method: "DELETE" }),
};

export const purchasesApi = {
  list: (params) => apiRequest(`/compras${queryString(params)}`).then((data) => data?.compras || data || []),
  get: (id) => apiRequest(`/compras/${id}`).then((data) => data?.compra || data),
  receipt: (id) => apiRequest(`/compras/${id}/comprobante`).then((data) => data?.comprobante || data),
  create: (purchase, key) => apiRequest("/compras", { method: "POST", headers: { "Idempotency-Key": key }, body: purchase }),
};

export const salesApi = {
  list: (params) => apiRequest(`/ventas${queryString(params)}`).then((data) => data?.ventas || data || []),
  get: (id) => apiRequest(`/ventas/${id}`).then((data) => data?.venta || data),
  receipt: (id) => apiRequest(`/ventas/${id}/comprobante`).then((data) => data?.comprobante || data),
  create: (sale, key) => apiRequest("/ventas", { method: "POST", headers: { "Idempotency-Key": key }, body: sale }),
};

export const movementsApi = {
  list: (params) => apiRequest(`/movimientos${queryString(params)}`).then((data) => data?.movimientos || data || []),
  create: (movement, key) => apiRequest("/movimientos", { method: "POST", headers: { "Idempotency-Key": key }, body: movement }),
};

export const balanceApi = {
  get: (params) => apiRequest(`/balance${queryString(params)}`),
};

export const alertsApi = {
  list: (params) => apiRequest(`/alertas${queryString(params)}`).then((data) => data?.alertas || data || []),
  attend: (id) => apiRequest(`/alertas/${id}/atender`, { method: "PATCH" }),
};

export const reportsApi = {
  movements: (params) => apiRequest(`/reportes/movimientos${queryString({ ...params, formato: "json" })}`),
  inventory: () => apiRequest("/reportes/inventario?formato=json"),
  async download(kind, params = {}) {
    const token = getToken();
    let response;
    try {
      response = await fetch(`${API_URL}/reportes/${kind}${queryString({ ...params, formato: "csv" })}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      throw new ApiError("No fue posible descargar el reporte.", 0);
    }
    if (!response.ok) {
      const data = await parseResponse(response).catch(() => null);
      throw new ApiError(data?.error || "No fue posible descargar el reporte.", response.status);
    }
    return response.blob();
  },
};

export const supportApi = {
  list: () => apiRequest("/soporte").then((data) => data?.solicitudes || data || []),
  get: (id) => apiRequest(`/soporte/${id}`).then((data) => data?.solicitud || data),
  create: (request) => apiRequest("/soporte", { method: "POST", body: request }),
  update: (id, values) => apiRequest(`/soporte/${id}`, { method: "PATCH", body: values }),
};

export const usersApi = {
  list: () => apiRequest("/usuarios").then((data) => data?.usuarios || data || []),
  updateRole: (id, rol) => apiRequest(`/usuarios/${id}/rol`, { method: "PATCH", body: { rol } }),
};

