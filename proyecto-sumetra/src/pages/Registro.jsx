import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Notice } from "../components/UI";

export default function Registro() {
  const { register, authenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmacion: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  if (authenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const nombre = form.nombre.trim();
    const email = form.email.trim().toLowerCase();
    if (nombre.length < 2) return setError("Escribe un nombre válido.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Escribe un correo válido.");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    if (form.password !== form.confirmacion) return setError("Las contraseñas no coinciden.");
    setSubmitting(true);
    try {
      await register({ nombre, email, password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return <main className="auth-page"><section className="auth-panel"><Link to="/" className="brand auth-brand"><span className="brand-mark">S</span><div><strong>SUMETRA</strong><small>Gestión empresarial</small></div></Link><div className="auth-copy"><span className="eyebrow">Nueva cuenta</span><h1>Empieza a organizar tu negocio</h1><p>El primer usuario se registra con permisos estándar. Un administrador puede gestionar roles después.</p></div><Notice type="error">{error}</Notice><form className="stack-form" onSubmit={submit} noValidate><label>Nombre completo<input name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} autoComplete="name" required autoFocus /></label><label>Correo electrónico<input type="email" name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required /></label><div className="form-grid"><label>Contraseña<input type="password" name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" minLength="8" required /></label><label>Confirmar contraseña<input type="password" name="confirmacion" value={form.confirmacion} onChange={(e) => setForm({ ...form, confirmacion: e.target.value })} autoComplete="new-password" minLength="8" required /></label></div><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Creando cuenta..." : "Crear cuenta"}</button></form><p className="auth-switch">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p></section><aside className="auth-visual auth-visual-register"><div><span className="visual-number">02</span><h2>Decisiones con información clara.</h2><p>Conserva la trazabilidad de cada operación y conoce el estado real del inventario.</p></div></aside></main>;
}

