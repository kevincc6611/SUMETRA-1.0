import { useCallback, useEffect, useState } from "react";
import { alertsApi } from "../services/api";
import { EmptyState, formatDate, LoadingScreen, Notice, PageHeader } from "../components/UI";

export default function Alertas() {
  const [filter, setFilter] = useState("pendiente");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(null);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAlerts(await alertsApi.list(filter === "todas" ? {} : { estado: filter }));
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const attend = async (id) => {
    setWorking(id); setMessage(null);
    try {
      await alertsApi.attend(id);
      setMessage({ type: "success", text: "Alerta marcada como atendida. Si el stock sigue bajo tras otro cambio, se generará una nueva." });
      await load();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setWorking(null);
    }
  };

  return <div className="page">
    <PageHeader eyebrow="Inventario preventivo" title="Alertas de existencias" description="Las alertas se conservan y se renuevan cuando el inventario vuelve a requerir atención." />
    <Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice>
    <div className="segmented" role="group" aria-label="Estado de alertas">
      <button type="button" className={filter === "pendiente" ? "is-active" : ""} onClick={() => setFilter("pendiente")}>Pendientes</button>
      <button type="button" className={filter === "atendida" ? "is-active" : ""} onClick={() => setFilter("atendida")}>Atendidas</button>
      <button type="button" className={filter === "todas" ? "is-active" : ""} onClick={() => setFilter("todas")}>Todas</button>
    </div>
    {loading ? <LoadingScreen compact label="Cargando alertas..." /> : alerts.length ? <div className="alert-grid">
      {alerts.map((alert) => {
        const stock = alert.stockObservado;
        const threshold = alert.umbralObservado;
        const attended = String(alert.estado).toUpperCase() === "ATENDIDA";
        return <article className={`alert-card ${Number(stock) === 0 ? "is-critical" : ""}`} key={alert.id}>
          <div className="alert-card-top"><span className={`badge ${Number(stock) === 0 ? "badge-danger" : "badge-warning"}`}>{Number(stock) === 0 ? "Agotado" : "Stock bajo"}</span><small>{formatDate(alert.createdAt, true)}</small></div>
          <h2>{alert.producto?.nombre || `Producto #${alert.producto?.id}`}</h2>
          <p>{alert.mensaje || <>Existencias: <strong>{stock}</strong>. Umbral: <strong>{threshold}</strong>.</>}</p>
          <p>Stock observado: <strong>{stock}</strong> · Umbral: <strong>{threshold}</strong></p>
          {attended ? <span className="attended-label">✓ Atendida {formatDate(alert.atendidaAt, true)}</span> : <button type="button" className="button button-secondary" disabled={working === alert.id} onClick={() => attend(alert.id)}>{working === alert.id ? "Guardando..." : "Marcar como atendida"}</button>}
        </article>;
      })}
    </div> : <EmptyState title={filter === "pendiente" ? "No hay alertas pendientes" : "No hay alertas en este estado"} description="El sistema las creará cuando un producto alcance su umbral." />}
  </div>;
}

