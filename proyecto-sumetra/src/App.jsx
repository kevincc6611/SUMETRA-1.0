import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Inicio from "./pages/Inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Compras from "./pages/Compras";
import Ventas from "./pages/Ventas";
import Movimientos from "./pages/Movimientos";
import Balance from "./pages/Balance";
import Alertas from "./pages/Alertas";
import Reportes from "./pages/Reportes";
import Comprobante from "./pages/Comprobante";
import Soporte from "./pages/Soporte";
import Usuarios from "./pages/Usuarios";
import ErrorPage from "./pages/ErrorPage";

export default function App() {
  return <BrowserRouter><AuthProvider><Routes>
    <Route path="/" element={<Inicio />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Registro />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventario" element={<Productos />} />
        <Route path="/productos" element={<Navigate to="/inventario" replace />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/movimientos" element={<Movimientos />} />
        <Route path="/ingresos" element={<Navigate to="/movimientos" replace />} />
        <Route path="/gastos" element={<Navigate to="/movimientos" replace />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/alertas" element={<Alertas />} />
        <Route path="/reportes" element={<Reportes />} />
        <Route path="/soporte" element={<Soporte />} />
        <Route path="/contacto" element={<Navigate to="/soporte" replace />} />
        <Route path="/comprobantes/:tipo/:id" element={<Comprobante />} />
        <Route path="/sin-permiso" element={<ErrorPage forbidden />} />
        <Route element={<ProtectedRoute adminOnly />}><Route path="/usuarios" element={<Usuarios />} /></Route>
      </Route>
    </Route>
    <Route path="*" element={<ErrorPage />} />
  </Routes></AuthProvider></BrowserRouter>;
}
