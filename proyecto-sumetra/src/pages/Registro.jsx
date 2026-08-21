import { useState } from "react";
import { crearUsuario, leerUsuarios } from "../services/api";
import "../styles/form.css";

function Registro() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "usuario"
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre || !form.email || !form.password) {
      alert("Completa todos los campos");
      return;
    }

    const usuarios = await leerUsuarios();
    const existe = usuarios.some(
      (u) => u.email.toLowerCase() === form.email.toLowerCase()
    );

    if (existe) {
      alert("Ese correo ya está registrado");
      return;
    }

    await crearUsuario(form);
    alert("Usuario registrado correctamente");
    setForm({ nombre: "", email: "", password: "", rol: "usuario" });
  };

  return (
    <main className="page-container">
      <section className="form-card">
        <h2>Registrarse</h2>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
            />
          </label>

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
            Crear cuenta
          </button>
        </form>
      </section>
    </main>
  );
}

export default Registro;