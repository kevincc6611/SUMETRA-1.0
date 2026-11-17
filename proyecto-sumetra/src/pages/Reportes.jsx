import { useEffect, useState } from "react";
import { reportsApi } from "../services/api";
import { EmptyState, formatCurrency, formatDate, LoadingScreen, Notice, PageHeader } from "../components/UI";

export default function Reportes() {
  const [kind, setKind] = useState("movimientos");
  const [filters, setFilters] = useState({ desde: "", hasta: "", tipo: "" });
  const [applied, setApplied] = useState(filters);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true; setLoading(true); setMessage(null);
    const request = kind === "movimientos" ? reportsApi.movements(applied) : reportsApi.inventory();
    request.then((data) => active && setRows(data?.movimientos || data?.productos || data?.filas || data || [])).catch((err) => active && setMessage({ type: "error", text: err.message })).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [kind, applied]);

  const apply = (event) => { event.preventDefault(); if (filters.desde && filters.hasta && filters.desde > filters.hasta) return setMessage({ type: "error", text: "La fecha inicial no puede ser posterior a la final." }); setApplied({ ...filters }); };
  const download = async () => { setDownloading(true); setMessage(null); try { const blob = await reportsApi.download(kind, kind === "movimientos" ? applied : {}); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `sumetra-${kind}-${new Date().toISOString().slice(0, 10)}.csv`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); setMessage({ type: "success", text: "Reporte CSV descargado." }); } catch (err) { setMessage({ type: "error", text: err.message }); } finally { setDownloading(false); } };

  return <div className="page"><PageHeader eyebrow="Consulta y exportación" title="Reportes" description="Filtra datos reales del sistema y descarga archivos CSV compatibles con Excel y otras hojas de cálculo." actions={<button className="button button-primary" type="button" onClick={download} disabled={downloading}>{downloading ? "Preparando..." : "Descargar CSV"}</button>} /><Notice type={message?.type} onClose={() => setMessage(null)}>{message?.text}</Notice><div className="segmented"><button type="button" className={kind === "movimientos" ? "is-active" : ""} onClick={() => setKind("movimientos")}>Movimientos</button><button type="button" className={kind === "inventario" ? "is-active" : ""} onClick={() => setKind("inventario")}>Inventario</button></div><section className="panel">{kind === "movimientos" && <form className="filter-bar" onSubmit={apply}><label>Desde<input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} /></label><label>Hasta<input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} /></label><label>Tipo<select value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}><option value="">Todos</option><option value="INGRESO">Ingresos</option><option value="GASTO">Gastos</option></select></label><button className="button button-secondary">Aplicar</button></form>}{loading ? <LoadingScreen compact label="Generando reporte..." /> : rows.length ? <div className="table-wrap"><table>{kind === "movimientos" ? <><thead><tr><th>Fecha</th><th>Tipo</th><th>Descripción</th><th>Origen</th><th className="text-right">Monto</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{formatDate(row.fecha || row.createdAt)}</td><td>{row.tipo}</td><td>{row.descripcion}</td><td>{row.origen || row.tipoOrigen}</td><td className="text-right">{formatCurrency(row.monto)}</td></tr>)}</tbody></> : <><thead><tr><th>Producto</th><th>Precio</th><th>Existencias</th><th>Umbral</th><th>Valor estimado</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.nombre}</td><td>{formatCurrency(row.precio)}</td><td>{row.stock}</td><td>{row.umbralStock ?? "—"}</td><td>{formatCurrency(Number(row.precio) * Number(row.stock))}</td></tr>)}</tbody></>}</table></div> : <EmptyState title="El reporte no contiene registros" description="Cambia el periodo o registra información antes de exportar." />}</section></div>;
}

