import { Link } from "react-router-dom";

export default function ErrorPage({ forbidden = false }) {
  return <main className="error-page"><span className="error-code">{forbidden ? "403" : "404"}</span><h1>{forbidden ? "No tienes permiso para entrar aquí" : "Esta página no existe"}</h1><p>{forbidden ? "Tu cuenta no tiene el rol requerido para esta acción." : "La dirección puede estar incompleta o la página fue movida."}</p><Link className="button button-primary" to="/dashboard">Volver al resumen</Link></main>;
}
