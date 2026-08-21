// Hooks para controlar el formulario y el historial.
import { useState, useEffect } from "react";
// Funciones que consultan y guardan ingresos mediante la API.
import { leerIngresos, crearIngreso } from "../services/api"; 
import "../styles/ingresos.css";

// Pantalla para registrar y consultar ingresos.
function Ingresos() {
  // Valores actuales del formulario.
    // Mensaje que informa el resultado de la operación.
    // Ingresos recuperados y total acumulado.
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ingresos, setIngresos] = useState([]);
  const [totalIngresos, setTotalIngresos] = useState(0);

  // Carga los ingresos desde el backend al abrir la pantalla.
  useEffect(() => {
    leerIngresos().then(data => {
      setIngresos(data);
      const total = data.reduce((acc, ingreso) => acc + ingreso.monto, 0);
      setTotalIngresos(total);
    });
  }, []);

  // Valida y guarda un nuevo ingreso en MySQL.
  const guardarIngreso = async (e) => {
    e.preventDefault();

    if (!monto || isNaN(monto)) {
      setMensaje("Por favor ingresa un número válido.");
      return;
    }

    await crearIngreso({ monto: parseFloat(monto), fecha });
    setMensaje("Ingreso guardado correctamente ✅");

    const data = await leerIngresos();
    setIngresos(data);
    const total = data.reduce((acc, ingreso) => acc + ingreso.monto, 0);
    setTotalIngresos(total);

    setMonto("");
    setFecha("");
  };

  return (
    <main className="contenedor">
      <h2>Registrar Ingreso</h2>

      {/* Formulario */}
      <form onSubmit={guardarIngreso} className="form-ingreso">
        <label htmlFor="monto">Monto:</label>
        <input
          type="number"
          id="monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ejemplo: 50000"
        />
        <label htmlFor="fecha">Fecha:</label>
        <input
          type="date"
          id="fecha"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
        <button type="submit">Guardar</button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      {/* Tarjeta resumen */}
      <div className="resumen-ingresos">
        <h3>Total acumulado</h3>
        <p className="total">${totalIngresos.toLocaleString()}</p>
      </div>

      {/* Historial */}
      <section className="lista-ingresos">
        <h3>Historial de ingresos</h3>
        <ul>
          {ingresos.map((ingreso) => (
            <li key={ingreso.id}>
              <span className="monto">💰 {ingreso.monto}</span>
              <span className="fecha">📅 {ingreso.fecha}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Ingresos;


