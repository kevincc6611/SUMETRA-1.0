import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { productsApi } from "../services/api";
import { createIdempotencyKey, EmptyState, formatCurrency, formatDate, LoadingScreen, Notice, PageHeader, today } from "../components/UI";

const newLine = () => ({ productoId: "", cantidad: "1", precioUnitario: "" });

export default function Operacion({ type, api }) {
  const purchase = type === "compra";
  const title = purchase ? "Compras" : "Ventas";
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ tercero: "", fecha: today(), lineas: [newLine()] });
  const [key, setKey] = useState(() => createIdempotencyKey(type));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const [productData, operationData] = await Promise.all([productsApi.list(), api.list()]); setProducts(productData); setHistory(operationData); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setLoading(false); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const updateLine = (index, field, value) => setForm((current) => ({ ...current, lineas: current.lineas.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line) }));
  const total = useMemo(() => form.lineas.reduce((sum, line) => { const product = products.find((item) => String(item.id) === String(line.productoId)); const price = purchase ? Number(line.precioUnitario) : Number(product?.precio); return sum + (Number(line.cantidad) || 0) * (price || 0); }, 0), [form.lineas, products, purchase]);

  const submit = async (event) => {
    event.preventDefault(); setMessage(null); setCreated(null);
    if (!form.fecha) return setMessage({ type: "error", text: "Selecciona la fecha de la operación." });
    if (form.lineas.some((line) => !line.productoId)) return setMessage({ type: "error", text: "Selecciona un producto en cada línea." });
    if (new Set(form.lineas.map((line) => line.productoId)).size !== form.lineas.length) return setMessage({ type: "error", text: "No repitas un producto; ajusta su cantidad en una sola línea." });
    for (const line of form.lineas) {
      const amount = Number(line.cantidad);
      if (!Number.isInteger(amount) || amount <= 0) return setMessage({ type: "error", text: "Todas las cantidades deben ser enteros mayores a cero." });
      if (purchase && (!Number.isFinite(Number(line.precioUnitario)) || Number(line.precioUnitario) <= 0)) return setMessage({ type: "error", text: "Cada precio de compra debe ser mayor a cero." });
      if (!purchase) { const product = products.find((item) => String(item.id) === String(line.productoId)); if (amount > Number(product?.stock)) return setMessage({ type: "error", text: `${product?.nombre || "El producto"} no tiene existencias suficientes.` }); }
    }
    const body = { fecha: form.fecha, lineas: form.lineas.map((line) => ({ productoId: Number(line.productoId), cantidad: Number(line.cantidad), ...(purchase ? { precioUnitario: Number(line.precioUnitario) } : {}) })), ...(form.tercero.trim() ? { [purchase ? "proveedor" : "cliente"]: form.tercero.trim() } : {}) };
    setSaving(true);
    try { const response = await api.create(body, key); const operation = response?.[type] || response; setCreated(operation); setMessage({ type: "success", text: response?.reutilizada ? "La solicitud ya se había procesado; se recuperó la operación sin duplicarla." : `${purchase ? "Compra" : "Venta"} registrada. Inventario y movimiento actualizados.` }); setForm({ tercero: "", fecha: today(), lineas: [newLine()] }); setKey(createIdempotencyKey(type)); await load(); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  return <div className="page"><PageHeader eyebrow="Operación transaccional" title={title} description={purchase ? "Registra una compra con una o varias líneas. El stock y el gasto se actualizan juntos." : "Registra una venta con una o varias líneas. El servidor valida precios y existencias antes de descontar stock."} /><Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice>{created?.id && <div className="success-actions"><span>Operación #{created.id}</span><Link className="button button-secondary" to={`/comprobantes/${type}/${created.id}`}>Ver comprobante</Link></div>}<section className="panel operation-form"><div className="panel-heading"><div><span className="eyebrow">Nueva operación</span><h2>{purchase ? "Registrar compra" : "Registrar venta"}</h2></div><strong className="operation-total">{formatCurrency(total)}</strong></div><form onSubmit={submit} noValidate><div className="form-grid"><label>{purchase ? "Proveedor" : "Cliente"} <span className="optional">(opcional)</span><input value={form.tercero} onChange={(e) => setForm({ ...form, tercero: e.target.value })} maxLength="120" placeholder={purchase ? "Nombre del proveedor" : "Nombre del cliente"} /></label><label>Fecha<input type="date" value={form.fecha} max={today()} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></label></div><fieldset className="lines-fieldset"><legend>Detalle de productos</legend>{form.lineas.map((line, index) => { const product = products.find((item) => String(item.id) === String(line.productoId)); return <div className={`operation-line ${purchase ? "is-purchase" : ""}`} key={index}><label>Producto<select value={line.productoId} onChange={(e) => updateLine(index, "productoId", e.target.value)} required><option value="">Seleccionar producto</option>{products.map((item) => <option value={item.id} key={item.id}>{item.nombre} · stock {item.stock}</option>)}</select></label><label>Cantidad<input type="number" min="1" step="1" value={line.cantidad} onChange={(e) => updateLine(index, "cantidad", e.target.value)} required /></label>{purchase && <label>Precio unitario<input type="number" min="0.01" step="0.01" value={line.precioUnitario} onChange={(e) => updateLine(index, "precioUnitario", e.target.value)} required /></label>}<div className="line-subtotal"><span>Subtotal</span><strong>{formatCurrency((Number(line.cantidad) || 0) * (purchase ? Number(line.precioUnitario) || 0 : Number(product?.precio) || 0))}</strong></div><button className="icon-button danger" type="button" onClick={() => setForm({ ...form, lineas: form.lineas.filter((_, i) => i !== index) })} disabled={form.lineas.length === 1 || saving} aria-label={`Eliminar línea ${index + 1}`}>×</button></div>; })}<button className="button button-ghost" type="button" onClick={() => setForm({ ...form, lineas: [...form.lineas, newLine()] })} disabled={saving}>+ Agregar línea</button></fieldset><div className="form-submit"><small>La operación se procesa una sola vez aunque se reenvíe la misma solicitud.</small><button className="button button-primary" type="submit" disabled={saving || !products.length}>{saving ? "Procesando..." : `Registrar ${type}`}</button></div></form></section><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Historial</span><h2>{title} registradas</h2></div></div>{loading ? <LoadingScreen compact /> : history.length ? <div className="table-wrap"><table><thead><tr><th>Referencia</th><th>{purchase ? "Proveedor" : "Cliente"}</th><th>Fecha</th><th>Líneas</th><th>Total</th><th><span className="sr-only">Acción</span></th></tr></thead><tbody>{history.map((item) => <tr key={item.id}><td>#{item.id}</td><td>{item[purchase ? "proveedor" : "cliente"] || "No indicado"}</td><td>{formatDate(item.fecha || item.createdAt)}</td><td>{item.lineas?.length ?? item.cantidadLineas ?? "—"}</td><td>{formatCurrency(item.total)}</td><td><Link to={`/comprobantes/${type}/${item.id}`}>Comprobante</Link></td></tr>)}</tbody></table></div> : <EmptyState title={`No hay ${title.toLowerCase()} registradas`} description="La primera operación aparecerá aquí." />}</section></div>;
}

