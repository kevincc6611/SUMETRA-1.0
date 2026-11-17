import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from "chart.js";
import { Bar, Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#9db0bd" } } },
  scales: {
    x: { ticks: { color: "#8ca1af" }, grid: { color: "rgba(148,163,184,.08)" } },
    y: { beginAtZero: true, ticks: { color: "#8ca1af" }, grid: { color: "rgba(148,163,184,.08)" } },
  },
};

export function TotalsBar({ income = 0, expenses = 0 }) {
  return <Bar options={options} data={{ labels: ["Ingresos", "Gastos"], datasets: [{ label: "COP", data: [Number(income), Number(expenses)], backgroundColor: ["rgba(20,184,166,.8)", "rgba(244,114,94,.8)"] }] }} />;
}

export function BalanceLine({ series = [] }) {
  const labels = series.map((item) => item.periodo || item.fecha);
  return <Line options={options} data={{ labels, datasets: [{ label: "Ingresos", data: series.map((item) => Number(item.ingresos)), borderColor: "#2dd4bf", backgroundColor: "rgba(45,212,191,.12)", fill: true, tension: .3 }, { label: "Gastos", data: series.map((item) => Number(item.gastos)), borderColor: "#fb7185", backgroundColor: "rgba(251,113,133,.08)", fill: true, tension: .3 }] }} />;
}

