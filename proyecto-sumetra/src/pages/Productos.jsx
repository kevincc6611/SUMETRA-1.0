import { useCallback, useEffect, useMemo, useState } from "react";
import { productsApi } from "../services/api";
import { isAdmin, useAuth } from "../context/AuthContext";
import { EmptyState, formatCurrency, LoadingScreen, Notice, PageHeader } from "../components/UI";

const emptyForm = { nombre: "", descripcion: "", precio: "", stock: "", umbralStock: "5" };

export default function Productos() {
  const { user } = useAuth();
  const canEdit = isAdmin(user);
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setProducts(await productsApi.list()); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => products.filter((item) => `${item.nombre} ${item.descripcion || ""}`.toLowerCase().includes(query.toLowerCase())), [products, query]);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setMessage(null); setModal(true); };
  const openEdit = (item) => { setEditing(item.id); setForm({ nombre: item.nombre, descripcion: item.descripcion || "", precio: String(item.precio), stock: String(item.stock), umbralStock: String(item.umbralStock ?? 5) }); setMessage(null); setModal(true); };

  const submit = async (event) => {
    event.preventDefault(); setMessage(null);
    const product = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio: Number(form.precio), stock: Number(form.stock), umbralStock: Number(form.umbralStock) };
    if (product.nombre.length < 2) return setMessage({ type: "error", text: "El nombre debe tener al menos 2 caracteres." });
    if (!Number.isFinite(product.precio) || product.precio <= 0) return setMessage({ type: "error", text: "El precio debe ser un número mayor a cero." });
    if (!Number.isInteger(product.stock) || product.stock < 0 || !Number.isInteger(product.umbralStock) || product.umbralStock < 0) return setMessage({ type: "error", text: "Las existencias y el umbral deben ser enteros no negativos." });
    setSaving(true);
    try { if (editing) await productsApi.update(editing, product); else await productsApi.create(product); setModal(false); setMessage({ type: "success", text: editing ? "Producto actualizado correctamente." : "Producto creado correctamente." }); await load(); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`¿Eliminar “${item.nombre}”? Esta acción no se puede deshacer.`)) return;
    setMessage(null);
    try { await productsApi.remove(item.id); setMessage({ type: "success", text: "Producto eliminado correctamente." }); await load(); }
    catch (err) { setMessage({ type: "error", text: err.message }); }
  };

  return <div className="page"><PageHeader eyebrow="Inventario" title="Productos y existencias" description="Consulta el stock disponible. Las compras y ventas actualizan estas cantidades automáticamente." actions={canEdit && <button className="button button-primary" type="button" onClick={openCreate}>+ Nuevo producto</button>} /><Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice><section className="panel"><div className="toolbar"><label className="search-field"><span className="sr-only">Buscar producto</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre o descripción" /></label><span className="result-count">{visible.length} de {products.length} productos</span></div>{loading ? <LoadingScreen compact label="Cargando inventario..." /> : visible.length ? <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Precio</th><th>Existencias</th><th>Umbral</th><th>Estado</th>{canEdit && <th>Acciones</th>}</tr></thead><tbody>{visible.map((item) => { const stock = Number(item.stock); const threshold = Number(item.umbralStock ?? 5); const status = stock === 0 ? ["Sin stock", "badge-danger"] : stock <= threshold ? ["Stock bajo", "badge-warning"] : ["Disponible", "badge-success"]; return <tr key={item.id}><td><strong>{item.nombre}</strong>{item.descripcion && <small className="cell-detail">{item.descripcion}</small>}<small className="cell-detail">Código #{item.id}</small></td><td>{formatCurrency(item.precio)}</td><td><strong>{stock}</strong></td><td>{threshold}</td><td><span className={`badge ${status[1]}`}>{status[0]}</span></td>{canEdit && <td><div className="table-actions"><button className="button button-small button-ghost" onClick={() => openEdit(item)} type="button">Editar</button><button className="button button-small button-danger-ghost" onClick={() => remove(item)} type="button">Eliminar</button></div></td>}</tr>; })}</tbody></table></div> : <EmptyState title="No se encontraron productos" description={query ? "Prueba con otro término de búsqueda." : "Crea el primer producto para iniciar el inventario."} action={canEdit && !query ? <button className="button button-primary" onClick={openCreate}>Crear producto</button> : null} />}</section>{modal && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget && !saving) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="product-title"><div className="modal-heading"><div><span className="eyebrow">Inventario</span><h2 id="product-title">{editing ? "Editar producto" : "Nuevo producto"}</h2></div><button type="button" className="icon-button" onClick={() => setModal(false)} disabled={saving} aria-label="Cerrar">×</button></div><form className="stack-form" onSubmit={submit} noValidate><Notice type={message?.type}>{message?.text}</Notice><label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} maxLength="120" required autoFocus /></label><label>Descripción <span className="optional">(opcional)</span><textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} maxLength="500" rows="3" /></label><div className="form-grid form-grid-three"><label>Precio<input type="number" min="0" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} required /></label><label>Existencias<input type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></label><label>Umbral de alerta<input type="number" min="0" step="1" value={form.umbralStock} onChange={(e) => setForm({ ...form, umbralStock: e.target.value })} required /></label></div><div className="modal-actions"><button type="button" className="button button-ghost" onClick={() => setModal(false)} disabled={saving}>Cancelar</button><button type="submit" className="button button-primary" disabled={saving}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear producto"}</button></div></form></section></div>}</div>;
}
