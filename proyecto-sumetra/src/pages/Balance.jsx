import { useEffect, useState } from "react";
import { balanceApi } from "../services/api";
import { BalanceLine, TotalsBar } from "../components/FinanceChart";
import { formatCurrency, LoadingScreen, Notice, PageHeader } from "../components/UI";

export default function Balance() {
  const [filters, setFilters] = useState({ desde: "", hasta: "" });
  const [applied, setApplied] = useState(filters);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true); setError("");
    balanceApi.get(applied).then(setData).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [applied]);

  const submit = (event) => { event.preventDefault(); if (filters.desde && filters.hasta && filters.desde > filters.hasta) return setError("La fecha inicial no puede ser posterior a la final."); setApplied({ ...filters }); };
  const summary = data?.resumen || {};

  return <div className="page"><PageHeader eyebrow="Resultado operativo" title="Balance" description="Entradas menos salidas registradas. No equivale a estados financieros certificados." /><form className="filter-bar" onSubmit={submit}><label>Desde<input type="date" value={filters.desde} onChange={(e) => setFilters({ ...filters, desde: e.target.value })} /></label><label>Hasta<input type="date" value={filters.hasta} onChange={(e) => setFilters({ ...filters, hasta: e.target.value })} /></label><button className="button button-secondary" type="submit">Aplicar periodo</button><button className="button button-ghost" type="button" onClick={() => { setFilters({ desde: "", hasta: "" }); setApplied({ desde: "", hasta: "" }); }}>Limpiar</button></form><Notice type="error">{error}</Notice>{loading ? <LoadingScreen compact label="Calculando balance..." /> : data && <><section className="metric-grid metric-grid-three"><article className="metric-card metric-positive"><span>Total ingresos</span><strong>{formatCurrency(summary.ingresos)}</strong></article><article className="metric-card metric-negative"><span>Total gastos</span><strong>{formatCurrency(summary.gastos)}</strong></article><article className="metric-card"><span>Balance operativo</span><strong className={Number(summary.balance) < 0 ? "text-negative" : "text-positive"}>{formatCurrency(summary.balance)}</strong></article></section><div className="dashboard-grid"><section className="panel chart-panel"><div className="panel-heading"><h2>Evolución por periodo</h2></div><div className="chart-wrap"><BalanceLine series={data.serie || []} /></div></section><section className="panel chart-panel"><div className="panel-heading"><h2>Comparación total</h2></div><div className="chart-wrap"><TotalsBar income={summary.ingresos} expenses={summary.gastos} /></div></section></div></>}</div>;
}
