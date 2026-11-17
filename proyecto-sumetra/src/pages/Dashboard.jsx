import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { alertsApi, balanceApi, productsApi, purchasesApi, salesApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { EmptyState, formatCurrency, formatDate, LoadingScreen, Notice, PageHeader } from "../components/UI";
import { TotalsBar } from "../components/FinanceChart";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([productsApi.list(), purchasesApi.list(), salesApi.list(), alertsApi.list({ estado: "pendiente" }), balanceApi.get({})])
      .then(([productos, compras, ventas, alertas, balance]) => active && setData({ productos, compras, ventas, alertas, balance }))
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, []);

  if (!data && !error) return <LoadingScreen label="Preparando el resumen..." />;
  const summary = data?.balance?.resumen || {};
  const products = data?.productos || [];
  const latest = [...(data?.compras || []).map((item) => ({ ...item, clase: "Compra", ruta: `/comprobantes/compra/${item.id}` })), ...(data?.ventas || []).map((item) => ({ ...item, clase: "Venta", ruta: `/comprobantes/venta/${item.id}` }))]
    .sort((a, b) => new Date(b.fecha || b.createdAt) - new Date(a.fecha || a.createdAt)).slice(0, 5);

  return <div className="page"><PageHeader eyebrow="Panel general" title={`Hola, ${user?.nombre?.split(" ")[0] || "Usuario"}`} description="Este es el estado actual de la operación, calculado con los datos registrados." actions={<Link className="button button-primary" to="/ventas">Nueva venta</Link>} /><Notice type="error">{error}</Notice>{data && <><section className="metric-grid"><article className="metric-card metric-positive"><span>Ingresos</span><strong>{formatCurrency(summary.ingresos)}</strong><small>Movimientos del periodo</small></article><article className="metric-card metric-negative"><span>Gastos</span><strong>{formatCurrency(summary.gastos)}</strong><small>Movimientos del periodo</small></article><article className="metric-card"><span>Balance operativo</span><strong>{formatCurrency(summary.balance)}</strong><small>Ingresos menos gastos</small></article><article className="metric-card"><span>Alertas activas</span><strong>{data.alertas.length}</strong><small><Link to="/alertas">Revisar existencias →</Link></small></article></section><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">Movimientos</span><h2>Ingresos y gastos</h2></div><Link to="/balance">Ver balance</Link></div><div className="chart-wrap"><TotalsBar income={summary.ingresos} expenses={summary.gastos} /></div></section><section className="panel inventory-summary"><div className="panel-heading"><div><span className="eyebrow">Inventario</span><h2>Existencias</h2></div><Link to="/inventario">Ver todo</Link></div><div className="inventory-number"><strong>{products.reduce((sum, item) => sum + Number(item.stock || 0), 0)}</strong><span>unidades en {products.length} productos</span></div><dl><div><dt>Sin stock</dt><dd>{products.filter((item) => Number(item.stock) === 0).length}</dd></div><div><dt>Stock bajo</dt><dd>{products.filter((item) => Number(item.stock) > 0 && Number(item.stock) <= Number(item.umbralStock ?? 5)).length}</dd></div></dl></section></div><section className="panel"><div className="panel-heading"><div><span className="eyebrow">Actividad</span><h2>Operaciones recientes</h2></div></div>{latest.length ? <div className="table-wrap"><table><thead><tr><th>Tipo</th><th>Referencia</th><th>Fecha</th><th>Total</th><th><span className="sr-only">Acción</span></th></tr></thead><tbody>{latest.map((item) => <tr key={`${item.clase}-${item.id}`}><td><span className={`badge ${item.clase === "Venta" ? "badge-success" : "badge-info"}`}>{item.clase}</span></td><td>#{item.id}</td><td>{formatDate(item.fecha || item.createdAt)}</td><td>{formatCurrency(item.total)}</td><td><Link to={item.ruta}>Ver comprobante</Link></td></tr>)}</tbody></table></div> : <EmptyState title="Aún no hay operaciones" description="Registra una compra o una venta para verla aquí." />}</section></>}</div>;
}

