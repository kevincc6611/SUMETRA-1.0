import "../styles/dashboard.css";
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
import { useNavigate, Link } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Dashboard() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem("usuarioSumetra") || "{}");

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSumetra");
    navigate("/login");
  };

  // Recuperar ingresos y gastos
  const ingresos = JSON.parse(localStorage.getItem("ingresosSumetra")) || [];
  const gastos = JSON.parse(localStorage.getItem("gastosSumetra")) || [];

  const totalIngresos = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const balanceFinal = totalIngresos - totalGastos;

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
      {/* Bienvenida del usuario */}
      <section className="bienvenida">
        <h2>Bienvenido</h2>
        <p>
          Hola, <strong>{usuario.nombre || "Usuario"}</strong>
        </p>
        <p>
          Email: <strong>{usuario.email || "No disponible"}</strong>
        </p>
        <button className="btn btn-primary" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </section>

      {/* Tarjetas resumen */}
      <div className="tarjetas">
        <div className="tarjeta">
          <h3>Ingresos</h3>
          <p className="ingresos">${totalIngresos.toLocaleString()}</p>
          <Link to="/ingresos" className="btn">Registrar ingreso</Link>
        </div>

        <div className="tarjeta">
          <h3>Gastos</h3>
          <p className="gastos">${totalGastos.toLocaleString()}</p>
          <Link to="/gastos" className="btn">Registrar gasto</Link>
        </div>

        <div className="tarjeta">
          <h3>Balance</h3>
          <p className={balanceFinal >= 0 ? "positivo" : "negativo"}>
            {balanceFinal >= 0 ? "✅ Superávit" : "⚠️ Déficit"}: ${balanceFinal.toLocaleString()}
          </p>
          <Link to="/balance" className="btn">Ver detalle</Link>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grafico">
        <h3>Comparación Ingresos vs Gastos</h3>
        <Bar data={dataBar} />
      </div>

      <div className="grafico">
        <h3>Distribución</h3>
        <Pie data={dataPie} />
      </div>
    </main>
  );
}

export default Dashboard;
