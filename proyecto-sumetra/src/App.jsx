// Componentes de React Router para crear la navegación de la aplicación.
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

// Componentes y páginas disponibles en el sistema Sumetra.
import MenuPrincipal from "./componentes/MenuPrincipal";
import Inicio from "./pages/Inicio";
import Gastos from "./pages/Gastos";
import Ingresos from "./pages/Ingresos";
import Registro from "./pages/Registro";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Contacto from "./pages/Contacto";
import Balance from "./pages/Balance";

// Organiza el encabezado protegido y las rutas principales de la aplicación.
function AppLayout() {
  // Obtiene la ruta actual para decidir qué elementos de la interfaz mostrar.
  const location = useLocation();

  // Comprueba si existe una sesión iniciada en el navegador.
  const usuarioLogeado = localStorage.getItem("usuarioSumetra");

  // El encabezado no aparece en las pantallas públicas de inicio, login y registro.
  const ocultarHeader = ["/", "/login", "/registro"].includes(location.pathname);

  return (
    <div className="app-shell">
      {/* Encabezado y menú visibles únicamente para usuarios autenticados. */}
      {!ocultarHeader && usuarioLogeado && (
        <header className="topbar">
          <div className="brand-wrap">
            <span className="brand-mark">S</span>
            <div>
              <p className="brand-name">Sumetra</p>
              <span className="brand-subtitle">Gestión financiera</span>
            </div>
          </div>

          <div className="navigation-area">
            <span className="navigation-label">Módulos del sistema</span>
            <MenuPrincipal />
          </div>
        </header>
      )}

      <main className="page-content">
  {/* Cada ruta renderiza la página correspondiente sin recargar el navegador. */}
       <Routes>
  <Route path="/" element={<Inicio />} />
  <Route path="/registro" element={<Registro />} />
  <Route path="/login" element={<Login />} />
  <Route path="/gastos" element={<Gastos />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/productos" element={<Productos />} />
  <Route path="/inventario" element={<Productos />} />
  <Route path="/ingresos" element={<Ingresos />} />
  <Route path="/contacto" element={<Contacto />} />
  <Route path="/balance" element={<Balance />} /> 
</Routes>

      </main>
    </div>
  );
}

function App() {
  return (
    // BrowserRouter habilita la navegación basada en URLs dentro de React.
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
