export function LoadingScreen({ label = "Cargando...", compact = false }) {
  return <div className={compact ? "loading-state is-compact" : "loading-state"} role="status"><span className="spinner" aria-hidden="true" /><span>{label}</span></div>;
}

export function Notice({ type = "info", children, onClose }) {
  if (!children) return null;
  return <div className={`notice notice-${type}`} role={type === "error" ? "alert" : "status"}><span>{children}</span>{onClose && <button type="button" className="icon-button" onClick={onClose} aria-label="Cerrar mensaje">×</button>}</div>;
}

export function EmptyState({ title, description, action }) {
  return <div className="empty-state"><span className="empty-mark" aria-hidden="true">S</span><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }) {
  return <header className="page-header"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value) || 0);
}

export function formatDate(value, withTime = false) {
  if (!value) return "—";
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(String(value)) ? `${value}T00:00:00` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-CO", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(date);
}

export function today() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function createIdempotencyKey(prefix = "op") {
  return globalThis.crypto?.randomUUID ? `${prefix}-${globalThis.crypto.randomUUID()}` : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
