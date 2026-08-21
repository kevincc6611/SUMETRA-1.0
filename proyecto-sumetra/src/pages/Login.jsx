import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { leerUsuarios } from "../services/api";
import "../styles/form.css";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      alert("Completa email y contraseña");
      return;
    }

    const usuarios = await leerUsuarios();
    const usuarioEncontrado = usuarios.find(
      (u) =>
        u.email.toLowerCase() === form.email.toLowerCase() &&
        u.password === form.password
    );

    if (usuarioEncontrado) {
      localStorage.setItem("usuarioSumetra", JSON.stringify(usuarioEncontrado));
      navigate("/dashboard");
    } else {
      alert("Credenciales incorrectas");
    }
  };

  return (
    <main className="page-container">
      <section className="form-card">
        <h2>Iniciar sesión</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" className="btn btn-primary">
            Entrar
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
