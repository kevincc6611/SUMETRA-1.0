import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Notice } from "../components/UI";

export default function Login() {
  const { login, authenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (authenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const email = form.email.trim().toLowerCase();
    if (!email || !form.password) return setError("Completa el correo y la contraseña.");
    setSubmitting(true);
    try {
      await login({ email, password: form.password });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-page"><section className="auth-panel"><Link to="/" className="brand auth-brand"><span className="brand-mark">S</span><div><strong>SUMETRA</strong><small>Gestión empresarial</small></div></Link><div className="auth-copy"><span className="eyebrow">Acceso seguro</span><h1>Bienvenido de nuevo</h1><p>Ingresa para administrar inventario, operaciones y movimientos del negocio.</p></div><Notice type="error">{error}</Notice><form className="stack-form" onSubmit={submit} noValidate><label>Correo electrónico<input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" placeholder="nombre@correo.com" required autoFocus /></label><label>Contraseña<input type="password" name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" required /></label><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Ingresando..." : "Iniciar sesión"}</button></form><p className="auth-switch">¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link></p></section><aside className="auth-visual"><div><span className="visual-number">01</span><h2>Todo tu negocio en un solo lugar.</h2><p>Stock, compras, ventas y balance conectados con datos reales.</p></div></aside></main>;
}

