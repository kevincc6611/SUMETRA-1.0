// Hooks para gestionar el formulario y los datos del historial.
import { useState, useEffect } from "react";
// Consultas que leen y guardan gastos en el backend.
import { leerGastos, crearGasto } from "../services/api";
import "../styles/gastos.css";

// Pantalla para registrar y consultar gastos.
function Gastos() {
  // Valores introducidos por el usuario en el formulario.
    // Mensaje de validación, éxito o error.
    // Gastos recuperados desde MySQL y total acumulado.
  const [tipo, setTipo] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [gastos, setGastos] = useState([]);
  const [totalGastos, setTotalGastos] = useState(0);

  // Consulta nuevamente los gastos y actualiza el resumen.
  const actualizarGastos = async () => {
    const data = await leerGastos();
    setGastos(data);
    setTotalGastos(data.reduce((acc, gasto) => acc + Number(gasto.monto), 0));
  };

  // Carga los gastos al entrar en la pantalla.
  useEffect(() => {
    actualizarGastos().catch((error) => setMensaje(error.message));
  }, []);

  // Valida y guarda el gasto enviado por el usuario.
  const guardarGasto = async (e) => {
    e.preventDefault();
    if (!tipo || !monto || isNaN(monto)) {
      setMensaje("Por favor completa todos los campos correctamente.");
      return;
    }

    try {
      await crearGasto({ tipo, monto: parseFloat(monto), fecha });
      await actualizarGastos();
      setMensaje("Gasto guardado correctamente");
      setTipo("");
      setMonto("");
      setFecha("");
    } catch (error) {
      setMensaje(`No se pudo guardar: ${error.message}`);
    }
  };

  return (
    <main className="contenedor">
      <h2>Registrar Gasto</h2>

      <form onSubmit={guardarGasto} className="form-gasto">
        <label htmlFor="tipo">Tipo de gasto:</label>
        <input
          type="text"
          id="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          placeholder="Ejemplo: Servicios, Alquiler, Insumos"
        />

        <label htmlFor="monto">Monto:</label>
        <input
          type="number"
          id="monto"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Ejemplo: 200000"
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

      <div className="resumen-gastos">
        <h3>Total de gastos</h3>
        <p className="total">${totalGastos.toLocaleString()}</p>
      </div>

      <section className="lista-gastos">
        <h3>Historial de gastos</h3>
        <ul>
          {gastos.map((gasto) => (
            <li key={gasto.id}>
              <span className="tipo">📌 {gasto.tipo}</span>
              <span className="monto">💸 {gasto.monto}</span>
              <span className="fecha">📅 {gasto.fecha}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default Gastos;

