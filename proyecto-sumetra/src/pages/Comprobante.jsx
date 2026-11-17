import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { purchasesApi, salesApi } from "../services/api";
import { formatCurrency, formatDate, LoadingScreen, Notice } from "../components/UI";

export default function Comprobante() {
  const { tipo, id } = useParams();
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState("");
  const valid = ["compra", "venta"].includes(tipo);
  useEffect(() => { if (!valid) { setError("Tipo de comprobante no válido."); return; } const api = tipo === "compra" ? purchasesApi : salesApi; api.receipt(id).then(setReceipt).catch((err) => setError(err.message)); }, [tipo, id, valid]);
  if (!receipt && !error) return <LoadingScreen label="Preparando comprobante..." />;
  const operation = receipt?.operacion || receipt?.compra || receipt?.venta || receipt;
  const lines = operation?.lineas || receipt?.lineas || [];
  return <div className="receipt-page"><div className="receipt-toolbar no-print"><Link className="button button-ghost" to={tipo === "compra" ? "/compras" : "/ventas"}>← Volver</Link>{receipt && <button className="button button-primary" type="button" onClick={() => window.print()}>Imprimir comprobante</button>}</div><Notice type="error">{error}</Notice>{receipt && <article className="receipt"><header><div className="brand"><span className="brand-mark">S</span><div><strong>SUMETRA</strong><small>Comprobante interno</small></div></div><div className="receipt-number"><span>{tipo === "compra" ? "COMPRA" : "VENTA"}</span><strong>{operation.numero || `#${operation.id || id}`}</strong></div></header><section className="receipt-meta"><div><span>Fecha</span><strong>{formatDate(operation.fecha || operation.createdAt, true)}</strong></div><div><span>{tipo === "compra" ? "Proveedor" : "Cliente"}</span><strong>{operation[tipo === "compra" ? "proveedor" : "cliente"] || "No indicado"}</strong></div><div><span>Registrado por</span><strong>{operation.createdBy?.nombre || "Usuario SUMETRA"}</strong></div></section><div className="table-wrap"><table><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th className="text-right">Subtotal</th></tr></thead><tbody>{lines.map((line, index) => { const price = line.precioUnitario ?? line.precio ?? line.producto?.precio; return <tr key={line.id || index}><td>{line.productoNombre || line.producto?.nombre || `Producto #${line.productoId}`}</td><td>{line.cantidad}</td><td>{formatCurrency(price)}</td><td className="text-right">{formatCurrency(line.subtotal ?? Number(price) * Number(line.cantidad))}</td></tr>; })}</tbody></table></div><div className="receipt-total"><span>Total</span><strong>{formatCurrency(operation.total ?? receipt.total)}</strong></div><footer><p>Este documento es un comprobante interno de SUMETRA. No es una factura electrónica ni un documento fiscal.</p><small>Generado el {formatDate(new Date().toISOString(), true)}</small></footer></article>}</div>;
}

