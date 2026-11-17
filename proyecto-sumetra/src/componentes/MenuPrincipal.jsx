import { NavLink, useNavigate } from "react-router-dom";
import "../styles/menu.css";

const enlaces = [
  ["Inicio", "/"],
  ["Dashboard", "/dashboard"],
  ["Ingresos", "/ingresos"],
  ["Gastos", "/gastos"],
  ["Productos", "/productos"],
  ["Balance", "/balance"],
  ["Alertas", "/alertas"],
];

function MenuPrincipal() {
  const navigate = useNavigate();

  function cerrarSesion() {
    localStorage.removeItem("usuarioSumetra");
    navigate("/login");
  }

  return (
    <nav className="nav-principal" aria-label="Navegacion principal">
      <div className="nav-links">
        {enlaces.map(([texto, ruta]) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ruta === "/"}
            className={({ isActive }) => `nav-btn${isActive ? " is-active" : ""}`}
          >
            {texto}
          </NavLink>
        ))}
      </div>
      <div className="nav-actions">
        <button type="button" className="nav-btn nav-btn-logout" onClick={cerrarSesion}>
          Cerrar sesion
        </button>
      </div>
    </nav>
  );
}

export default MenuPrincipal;
