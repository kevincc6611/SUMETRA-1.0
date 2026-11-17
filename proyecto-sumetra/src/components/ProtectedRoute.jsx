import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdmin, useAuth } from "../context/AuthContext";
import { LoadingScreen } from "./UI";

export default function ProtectedRoute({ adminOnly = false }) {
  const { authenticated, loading, user } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen label="Comprobando sesión..." />;
  if (!authenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (adminOnly && !isAdmin(user)) return <Navigate to="/sin-permiso" replace />;
  return <Outlet />;
}

