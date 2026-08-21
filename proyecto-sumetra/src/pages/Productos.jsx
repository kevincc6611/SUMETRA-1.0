// Hook para cargar productos y controlar el estado visual de la pantalla.
import { useEffect, useState } from "react";
// Función que consulta los productos en el backend.
import { leerProductos } from "../services/api";
// Estilos de la tabla de inventario.
import "../styles/productos.css";

// Muestra los productos existentes en la base de datos.
function Productos() {
  // Lista de productos recibida desde MySQL.
  const [productos, setProductos] = useState([]);
  // Indica si la consulta todavía está en proceso.
  const [cargando, setCargando] = useState(true);
  // Guarda el mensaje que se presenta cuando ocurre un error.
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    // Carga los productos una vez al entrar en la pantalla.
    leerProductos()
      .then(setProductos)
      .catch((error) => setMensaje(`No se pudieron cargar los productos: ${error.message}`))
      .finally(() => setCargando(false));
  }, []);

  return (
    <main className="productos-page">
      {/* Encabezado con el nombre y la cantidad de productos encontrados. */}
      <div className="productos-heading">
        <div>
          <span className="productos-eyebrow">Inventario</span>
          <h1>Productos</h1>
          <p>Consulta las existencias y precios registrados en tu base de datos.</p>
        </div>
        <strong className="productos-count">{productos.length} productos</strong>
      </div>

      {mensaje && <p className="productos-message productos-message-error">{mensaje}</p>}

      {!cargando && !mensaje && productos.length === 0 && (
        <p className="productos-message">No hay productos registrados.</p>
      )}

      {/* Muestra un estado de carga mientras responde el backend. */}
      {cargando ? (
        <p className="productos-message">Cargando productos...</p>
      ) : (
        <div className="productos-table-wrap">
          <table className="productos-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id}>
                  <td>
                    <strong>{producto.nombre}</strong>
                    <small>SKU #{producto.id}</small>
                  </td>
                  <td>${Number(producto.precio).toLocaleString()}</td>
                  <td>{producto.stock}</td>
                  <td>
                    <span className={`stock-status ${Number(producto.stock) > 0 ? "in-stock" : "out-stock"}`}>
                      {Number(producto.stock) > 0 ? "Disponible" : "Sin stock"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default Productos;
