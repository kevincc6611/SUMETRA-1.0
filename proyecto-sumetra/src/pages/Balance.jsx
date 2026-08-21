// Hooks para consultar datos y actualizar la pantalla.
import { useEffect, useState } from "react";
// Consultas de ingresos y gastos almacenados en MySQL.
import { leerGastos, leerIngresos } from "../services/api";
import "../styles/balance.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

// Registrar los componentes necesarios de Chart.js
// Registra los componentes de Chart.js utilizados por los gráficos.
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Calcula y presenta la situación financiera del negocio.
function Balance() {
  // Datos obtenidos desde las tablas de ingresos y gastos.
  const [ingresos, setIngresos] = useState([]);
  const [gastos, setGastos] = useState([]);
  // Mensaje mostrado si falla alguna consulta.
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    // Solicita ambas tablas al mismo tiempo al abrir la pantalla.
    Promise.all([leerIngresos(), leerGastos()])
      .then(([ingresosData, gastosData]) => {
        setIngresos(ingresosData);
        setGastos(gastosData);
      })
      .catch((error) => setMensaje(`No se pudo cargar el balance: ${error.message}`));
  }, []);

  // Convierte los montos de MySQL y calcula los totales financieros.
  const totalIngresos = ingresos.reduce((acc, ingreso) => acc + Number(ingreso.monto), 0);
  const totalGastos = gastos.reduce((acc, gasto) => acc + Number(gasto.monto), 0);
  const balanceFinal = totalIngresos - totalGastos;

  // Datos que alimentan el gráfico comparativo de barras.
  const dataBar = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        label: "Totales",
        data: [totalIngresos, totalGastos],
        backgroundColor: ["#00c896", "#ff6b6b"],
      },
    ],
  };

  // Datos que alimentan el gráfico de distribución circular.
  const dataPie = {
    labels: ["Ingresos", "Gastos"],
    datasets: [
      {
        data: [totalIngresos, totalGastos],
        backgroundColor: ["#00c896", "#ff6b6b"],
      },
    ],
  };

  return (
    <main className="contenedor">
      <h2>Balance General</h2>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      <div className="tarjeta resumen">
        <h3>Total Ingresos</h3>
        <p className="ingresos">${totalIngresos.toLocaleString()}</p>
      </div>

      <div className="tarjeta resumen">
        <h3>Total Gastos</h3>
        <p className="gastos">${totalGastos.toLocaleString()}</p>
      </div>

      <div className="tarjeta balance">
        <h3>Resultado Neto</h3>
        <p className={balanceFinal >= 0 ? "positivo" : "negativo"}>
          {balanceFinal >= 0 ? "✅ Superávit" : "⚠️ Déficit"}: ${balanceFinal.toLocaleString()}
        </p>
      </div>

      {/* Gráfico de barras */}
      <div className="grafico">
        <h3>Comparación Ingresos vs Gastos</h3>
        <Bar data={dataBar} />
      </div>

      {/* Gráfico de pastel */}
      <div className="grafico">
        <h3>Distribución</h3>
        <Pie data={dataPie} />
      </div>
    </main>
  );
}

export default Balance;

