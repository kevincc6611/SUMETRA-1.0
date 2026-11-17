import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { isAdmin, useAuth } from "../context/AuthContext";

const links = [
  ["Resumen", "/dashboard", "⌂"],
  ["Inventario", "/inventario", "□"],
  ["Compras", "/compras", "+"],
  ["Ventas", "/ventas", "−"],
  ["Movimientos", "/movimientos", "↕"],
  ["Balance", "/balance", "◫"],
  ["Alertas", "/alertas", "!"],
  ["Reportes", "/reportes", "⇩"],
  ["Soporte", "/soporte", "?"],
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <aside id="sidebar" className={`sidebar ${open ? "is-open" : ""}`} aria-label="Navegación principal">
        <div className="brand"><span className="brand-mark">S</span><div><strong>SUMETRA</strong><small>Gestión empresarial</small></div></div>
        <nav className="sidebar-nav">
          {links.map(([label, path, icon]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}>
              <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
            </NavLink>
          ))}
          {isAdmin(user) && <NavLink to="/usuarios" onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "is-active" : ""}`}><span className="nav-icon" aria-hidden="true">⚙</span><span>Usuarios</span></NavLink>}
        </nav>
        <div className="sidebar-user"><span className="user-avatar">{user?.nombre?.slice(0, 1)?.toUpperCase() || "U"}</span><div><strong>{user?.nombre}</strong><small>{isAdmin(user) ? "Administrador" : "Usuario"}</small></div><button type="button" onClick={signOut} className="icon-button" aria-label="Cerrar sesión" title="Cerrar sesión">↪</button></div>
      </aside>
      {open && <button className="sidebar-backdrop" type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
      <div className="app-main">
        <header className="mobile-header"><button type="button" className="menu-button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="sidebar">☰<span className="sr-only">Abrir menú</span></button><strong>SUMETRA</strong><span className="route-label">{links.find(([, path]) => location.pathname.startsWith(path))?.[0] || ""}</span></header>
        <main id="contenido" className="content" tabIndex="-1"><Outlet /></main>
      </div>
    </div>
  );
}
