import { Link } from "react-router-dom";
import "../styles/form.css";

function Inicio() {
  return (
    <main className="page-container">
      <section className="hero hero-finance">
        <div className="hero-topline">
          <span className="hero-badge">Sistema financiero</span>
          <span className="hero-status">Online</span>
        </div>

        <h1>Gestión contable y operativa de tu negocio</h1>

        <p>
          Centraliza ventas, clientes, inventario y reportes con una plataforma
          pensada para operar con precisión, seguridad y control financiero.
        </p>

        <div className="hero-actions">
          <Link to="/registro" className="btn btn-primary">
            Registrarse
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Iniciar sesión
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Inicio;