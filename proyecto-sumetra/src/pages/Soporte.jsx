import { useCallback, useEffect, useState } from "react";
import { supportApi } from "../services/api";
import { isAdmin, useAuth } from "../context/AuthContext";
import { EmptyState, formatDate, LoadingScreen, Notice, PageHeader } from "../components/UI";

const statusClass = (status) => status === "CERRADA" ? "badge-success" : status === "EN_PROCESO" ? "badge-info" : "badge-warning";
const statusLabel = (status) => ({ ABIERTA: "Abierta", EN_PROCESO: "En proceso", CERRADA: "Cerrada" }[status] || status);

export default function Soporte() {
  const { user } = useAuth();
  const admin = isAdmin(user);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ asunto: "", mensaje: "" });
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await supportApi.list()); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async (event) => {
    event.preventDefault(); setMessage(null);
    if (form.asunto.trim().length < 4 || form.mensaje.trim().length < 10) return setMessage({ type: "error", text: "Describe el asunto y el problema con más detalle." });
    setSaving(true);
    try {
      await supportApi.create({ asunto: form.asunto.trim(), mensaje: form.mensaje.trim() });
      setForm({ asunto: "", mensaje: "" });
      setMessage({ type: "success", text: "Solicitud enviada. Puedes consultar su estado aquí." });
      await load();
    } catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  const resolve = async (item, estado) => {
    const respuesta = responses[item.id]?.trim();
    if (estado === "CERRADA" && !respuesta) return setMessage({ type: "error", text: "Escribe una respuesta antes de cerrar la solicitud." });
    try {
      await supportApi.update(item.id, { estado, ...(respuesta ? { respuesta } : {}) });
      setMessage({ type: "success", text: "Solicitud actualizada." });
      await load();
    } catch (err) { setMessage({ type: "error", text: err.message }); }
  };

  return <div className="page">
    <PageHeader eyebrow="Ayuda y seguimiento" title="Soporte" description={admin ? "Consulta y responde las solicitudes enviadas por los usuarios." : "Describe un problema o una duda y conserva el seguimiento de la respuesta."} />
    <Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice>
    {!admin && <section className="panel compact-panel"><div className="panel-heading"><h2>Nueva solicitud</h2></div><form className="stack-form" onSubmit={submit} noValidate><label>Asunto<input value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} maxLength="120" /></label><label>Descripción<textarea rows="5" value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} maxLength="2000" /></label><div className="form-submit"><span /><button className="button button-primary" disabled={saving}>{saving ? "Enviando..." : "Enviar solicitud"}</button></div></form></section>}
    <section className="panel"><div className="panel-heading"><h2>{admin ? "Solicitudes recibidas" : "Mis solicitudes"}</h2></div>{loading ? <LoadingScreen compact /> : items.length ? <div className="ticket-list">
      {items.map((item) => <article className="ticket" key={item.id}><div className="ticket-heading"><div><span className={`badge ${statusClass(item.estado)}`}>{statusLabel(item.estado)}</span><h3>{item.asunto}</h3></div><small>#{item.id} · {formatDate(item.createdAt, true)}</small></div>{admin && item.usuario && <p className="ticket-user">Enviada por {item.usuario.nombre} ({item.usuario.email})</p>}<p>{item.mensaje}</p>{item.respuesta && <blockquote><strong>Respuesta:</strong> {item.respuesta}</blockquote>}{admin && item.estado !== "CERRADA" && <div className="ticket-response"><label>Respuesta<textarea rows="3" value={responses[item.id] || ""} onChange={(e) => setResponses({ ...responses, [item.id]: e.target.value })} /></label><div><button type="button" className="button button-ghost" onClick={() => resolve(item, "EN_PROCESO")}>Marcar en proceso</button><button type="button" className="button button-primary" onClick={() => resolve(item, "CERRADA")}>Responder y cerrar</button></div></div>}</article>)}
    </div> : <EmptyState title="No hay solicitudes" description={admin ? "Las solicitudes aparecerán aquí." : "Cuando envíes una solicitud podrás seguirla desde aquí."} />}</section>
  </div>;
}
