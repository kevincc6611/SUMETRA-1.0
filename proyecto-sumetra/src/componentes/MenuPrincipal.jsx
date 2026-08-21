// Herramientas de React Router para crear enlaces y detectar la ruta activa.
import { Link, useLocation } from "react-router-dom";
// Estilos visuales del menú principal.
import "../styles/menu.css";

// Menú de navegación disponible para usuarios autenticados.
function MenuPrincipal() {
  // Permite resaltar el módulo que se está visualizando.
  const location = useLocation();
  // Recupera la sesión guardada para proteger la navegación.
  const usuario = JSON.parse(localStorage.getItem("usuarioSumetra") || "null");

  // No muestra el menú cuando no existe una sesión activa.
  if (!usuario) return null;

  // Elimina la sesión y devuelve al usuario a la pantalla de acceso.
  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSumetra");
    window.location.href = "/login";
  };

  // Texto y ruta de cada módulo del sistema.
  const enlaces = [
    ["Inicio", "/dashboard"],
    ["Inventario", "/inventario"],
    ["Ingresos", "/ingresos"],
    ["Balance", "/balance"],
    ["Gastos", "/gastos"],
    ["Alertas", "/alertas"],
    ["Soporte", "/contacto"],
  ];

  return (
    // Contenedor de los enlaces y la acción de cerrar sesión.
    <nav className="nav-principal">
      {enlaces.map(([nombre, ruta]) => (
        <Link
          className={`nav-btn ${location.pathname === ruta ? "is-active" : ""}`}
          to={ruta}
          key={ruta}
        >
          {nombre}
        </Link>
      ))}
      <button className="nav-btn nav-btn-logout" type="button" onClick={cerrarSesion}>
        Cerrar sesión
      </button>
    </nav>
  );
}

export default MenuPrincipal;