import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, getToken, setToken } from "../services/api";

const AuthContext = createContext(null);
const getUser = (data) => data?.usuario || data?.user || null;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const unauthorized = () => logout();
    window.addEventListener("sumetra:unauthorized", unauthorized);
    return () => window.removeEventListener("sumetra:unauthorized", unauthorized);
  }, [logout]);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi.me().then((data) => setUser(getUser(data))).catch(logout).finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(async (credentials) => {
    const data = await authApi.login(credentials);
    const token = data?.token || data?.accessToken;
    if (!token || !getUser(data)) throw new Error("El servidor no entregó una sesión válida.");
    setToken(token);
    setUser(getUser(data));
    return getUser(data);
  }, []);

  const register = useCallback(async (values) => {
    const data = await authApi.register(values);
    const token = data?.token || data?.accessToken;
    if (!token || !getUser(data)) throw new Error("La cuenta se creó, pero el servidor no entregó una sesión válida.");
    setToken(token);
    setUser(getUser(data));
    return getUser(data);
  }, []);
  const refreshUser = useCallback(async () => {
    const data = await authApi.me();
    setUser(getUser(data));
    return getUser(data);
  }, []);

  const value = useMemo(() => ({ user, loading, authenticated: Boolean(user), login, logout, register, refreshUser }), [user, loading, login, logout, register, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return value;
}

export function isAdmin(user) {
  return String(user?.rol || "").toLowerCase() === "administrador";
}

