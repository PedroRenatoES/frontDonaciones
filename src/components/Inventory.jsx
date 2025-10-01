import React, { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import "../styles/Inventory.css";
import DonorsModal from "./DonorsModal";
import MoneyDonorsModal from "./MoneyDonorsModal";
import ModalCambioEspacio from "./ModalCambioEspacio"; // Importé el modal para mover ubicación

/* ===== Modal reutilizable (en el mismo archivo) ===== */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    // Bloquear scroll del body
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ background: "rgba(0, 0, 0, 0)", position: "fixed", top: 0, left: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, animation: "modalFadeIn 0.3s ease-out" }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ background: "white", borderRadius: "16px" }}
      >
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
/* ==================================================== */

function Inventory() {
  const [inventario, setInventario] = useState([]);
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [almacenFiltro, setAlmacenFiltro] = useState("");
  const [montoAnimado, setMontoAnimado] = useState(0);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [modalDineroAbierto, setModalDineroAbierto] = useState(false);
  const [almacenes, setAlmacenes] = useState([]); // Estado para la lista de almacenes
  const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false); // Define the missing state for modal visibility
  const [tipoBusqueda, setTipoBusqueda] = useState("nombreArticulo"); // Default to article name search
  const [valorBusqueda, setValorBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]); // Restore the missing state for search results
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null); // Add state for selected donation details
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [donacionEditando, setDonacionEditando] = useState(null);
  const [vista, setVista] = useState("general"); // Estado para alternar vistas
  const [donacionesPorEstante, setDonacionesPorEstante] = useState([]); // Estado para datos de "Ver por Estante"
  const [mostrarEstantesVacios, setMostrarEstantesVacios] = useState(false); // Estado para controlar si se muestran estantes vacíos
  const [modalCambioEspacioAbierto, setModalCambioEspacioAbierto] =
    useState(false); // Estado para el modal de cambio de espacio
  const [donacionParaMover, setDonacionParaMover] = useState(null); // Estado para la donación seleccionada

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get("/almacenes"); // Obtener la lista de almacenes
        setAlmacenes(response.data);
      } catch (error) {
        console.error("Error al obtener la lista de almacenes:", error);
      }
    };

    fetchAlmacenes();
  }, []);

  useEffect(() => {
    const fetchInventario = async () => {
      try {
        // Obtener el nombre del almacén desde localStorage
        const nombreAlmacenLS = localStorage.getItem("almacen");

        if (!nombreAlmacenLS) {
          console.error(
            "No se encontró el nombre del almacén en localStorage."
          );
          return;
        }

        // Buscar el id del almacén correspondiente
        const almacenUsuario = almacenes.find(
          (alm) => alm.nombre_almacen === nombreAlmacenLS
        );

        if (!almacenUsuario) {
          console.error(
            "No se encontró un almacén que coincida con el nombre almacenado."
          );
          return;
        }

        // Llamar al endpoint con el id del almacén
        const [resInventario, resDinero] = await Promise.all([
          axios.get(
            `/inventario/ubicaciones?idAlmacen=${almacenUsuario.id_almacen}`
          ),
          axios.get("/donaciones-en-dinero"),
        ]);

        setInventario(resInventario.data);
        setDonacionesDinero(resDinero.data);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    if (almacenes.length > 0) {
      fetchInventario();
    }
  }, [almacenes]); // Dependencia para asegurarse de que almacenes esté disponible

  // ✅ Calcular monto total de donaciones en dinero
  const montoTotalDinero = donacionesDinero.reduce(
    (total, donacion) => total + donacion.monto,
    0
  );

  // ✅ Animación del contador
  useEffect(() => {
    const end = parseFloat(montoTotalDinero);
    if (isNaN(end)) return;

    const duration = 1500; // 1.5s
    const startTime = performance.now();

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentValue = progress * end;
      setMontoAnimado(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [montoTotalDinero]);

  // ✅ Filtros
  const categorias = [
    ...new Set(inventario.map((item) => item.nombre_categoria)),
  ];

  const inventarioFiltrado = inventario.filter((item) => {
    const coincideCategoria =
      !categoriaFiltro || item.nombre_categoria === categoriaFiltro;
    const coincideAlmacen =
      !almacenFiltro ||
      item.ubicaciones.some((u) => u.almacen === almacenFiltro);
    return coincideCategoria && coincideAlmacen;
  });

  const descargarExcel = async () => {
    try {
      const response = await axios.get("/reportes/stock/excel", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "stock_total.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al descargar el Excel:", error);
      alert("No se pudo descargar el archivo.");
    }
  };

  const abrirModal = (item) => {
    setArticuloSeleccionado(item);
    setModalAbierto(true);
  };

  const abrirModalBusqueda = () => setModalBusquedaAbierto(true);
  const cerrarModalBusqueda = () => {
    setModalBusquedaAbierto(false);
    setResultadosBusqueda([]);
  };

  // Función de búsqueda corregida
  const handleBuscar = async () => {
    if (!valorBusqueda.trim()) {
      alert("Por favor ingresa un término de búsqueda");
      return;
    }

    // Verificar si el token existe
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Error: Sesión expirada. Por favor inicia sesión nuevamente.");
      return;
    }

    try {
      // Obtener el nombre del almacén desde localStorage
      const nombreAlmacenLS = localStorage.getItem("almacen");
      
      if (!nombreAlmacenLS) {
        console.error("No se encontró el nombre del almacén en localStorage.");
        alert("Error: No se pudo identificar el almacén del usuario");
        return;
      }

      // Buscar el id del almacén correspondiente
      const almacenUsuario = almacenes.find(
        (alm) => alm.nombre_almacen === nombreAlmacenLS
      );

      if (!almacenUsuario) {
        console.error("No se encontró un almacén que coincida con el nombre almacenado.");
        alert("Error: Almacén no encontrado");
        return;
      }

      console.log(`Buscando en almacén ID: ${almacenUsuario.id_almacen} (${almacenUsuario.nombre_almacen})`);

      // Usar el endpoint correcto con el ID del almacén del usuario
      const response = await axios.get(
        `/inventario/donaciones/por-almacen?idAlmacen=${almacenUsuario.id_almacen}`
      );
      const data = response.data;

      console.log(`Datos recibidos:`, data);

      const resultados = data.filter((item) => {
        if (tipoBusqueda === "nombreArticulo") {
          return item.nombre_articulo
            .toLowerCase()
            .includes(valorBusqueda.toLowerCase());
        } else if (tipoBusqueda === "nombreDonante") {
          return item.nombre_donante
            .toLowerCase()
            .includes(valorBusqueda.toLowerCase());
        }
        return false;
      });

      console.log(`Resultados filtrados:`, resultados);
      setResultadosBusqueda(resultados);
    } catch (error) {
      console.error("Error al buscar donaciones:", error);
      
      if (error.response?.status === 401) {
        alert("Error: Sesión expirada. Por favor inicia sesión nuevamente.");
        // Opcional: redirigir al login
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        alert("Error: No tienes permisos para realizar esta búsqueda");
      } else if (error.response?.status === 404) {
        alert("Error: Endpoint no encontrado");
      } else if (error.response?.status === 500) {
        alert("Error del servidor. Por favor intenta de nuevo más tarde.");
      } else {
        alert(`Error al realizar la búsqueda: ${error.message}`);
      }
      
      setResultadosBusqueda([]);
    }
  };

  const handleVerDetalles = (donacion) => {
    setDonacionSeleccionada(donacion);
  };

  const abrirModalEditar = (donacion) => {
    setDonacionEditando(donacion);
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setDonacionEditando(null);
    setModalEditarAbierto(false);
  };

  const handleGuardarEdicion = async () => {
    try {
      // Update base donation
      await axios.put(`/donaciones/${donacionEditando.id_donacion}`, {
        cantidad: donacionEditando.cantidad,
        fecha_vencimiento: donacionEditando.fecha_vencimiento,
      });

      // Update specific donation type
      if (donacionEditando.tipo === "Dinero") {
        await axios.put(
          `/donaciones-en-dinero/${donacionEditando.id_donacion}`,
          {
            monto: donacionEditando.monto,
            divisa: donacionEditando.divisa,
          }
        );
      } else if (donacionEditando.tipo === "Especie") {
        await axios.put(
          `/donaciones-en-especie/${donacionEditando.id_donacion}`,
          {
            id_articulo: donacionEditando.id_articulo,
            id_espacio: donacionEditando.id_espacio,
          }
        );
      }

      alert("Donación actualizada con éxito");
      cerrarModalEditar();
    } catch (error) {
      console.error("Error al actualizar la donación:", error);
      alert("No se pudo actualizar la donación");
    }
  };

  const fetchDonacionesPorEstante = useCallback(async () => {
    try {
      const nombreAlmacenLS = localStorage.getItem("almacen");
      if (!nombreAlmacenLS) {
        console.error("No se encontró el nombre del almacén en localStorage.");
        return;
      }

      const almacenUsuario = almacenes.find(
        (alm) => alm.nombre_almacen === nombreAlmacenLS
      );
      if (!almacenUsuario) {
        console.error(
          "No se encontró un almacén que coincida con el nombre almacenado."
        );
        return;
      }

      const response = await axios.get(
        `inventario/donaciones-por-estante/${almacenUsuario.id_almacen}`
      );
      setDonacionesPorEstante(response.data);
    } catch (error) {
      console.error("Error al obtener las donaciones por estante:", error);
    }
  }, [almacenes]);

  useEffect(() => {
    if (vista === "porEstante") {
      fetchDonacionesPorEstante();
    }
  }, [vista, fetchDonacionesPorEstante]);

  // Filtrar estantes para mostrar solo aquellos que tienen contenido
  const estantesConContenido = donacionesPorEstante.filter((estante) =>
    estante.espacios.some((espacio) => espacio.donaciones.length > 0)
  );

  const estantesVacios = donacionesPorEstante.filter(
    (estante) =>
      !estante.espacios.some((espacio) => espacio.donaciones.length > 0)
  );

  const abrirModalCambioEspacio = (donacion) => {
    setDonacionParaMover(donacion);
    setModalCambioEspacioAbierto(true);
  };

  const cerrarModalCambioEspacio = () => {
    setDonacionParaMover(null);
    setModalCambioEspacioAbierto(false);
  };

  return (
    <div className="inventory">
      <h1 className="inventory-title">Inventario de Donaciones</h1>

      <div className="inventory-unified-container">
        <div className="inventory-actions">
          <div className="filters">
            <div className="filter-group">
              <label className="filter-label">Categoría</label>
              <div className="filter-select">
                <select
                  value={categoriaFiltro}
                  onChange={(e) => setCategoriaFiltro(e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((categoria, idx) => (
                    <option key={idx} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {localStorage.getItem("rol") === "1" && (
              <div className="filter-group">
                <label className="filter-label">Almacén</label>
                <div className="filter-select">
                  <select
                    value={almacenFiltro}
                    onChange={(e) => setAlmacenFiltro(e.target.value)}
                  >
                    <option value="">Todos los almacenes</option>
                    {almacenes.map((almacen, idx) => (
                      <option key={idx} value={almacen.nombre_almacen}>
                        {almacen.nombre_almacen}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="download-wrapper">
              <button className="btn-download" onClick={descargarExcel}>
                📥 Descargar Excel
              </button>
            </div>

            {/* Botones de vista integrados */}
            <div className="view-controls">
              <button
                onClick={() => setVista("general")}
                className={`view-toggle-btn ${
                  vista === "general" ? "active" : ""
                }`}
              >
                Ver General
              </button>
              <button
                onClick={() => setVista("porEstante")}
                className={`view-toggle-btn ${
                  vista === "porEstante" ? "active" : ""
                }`}
              >
                Ver por Estante
              </button>
            </div>
          </div>

          {/* Botón de búsqueda con icono en el tope derecho */}
          <div className="search-wrapper">
            <button
              className="btn-search-icon"
              onClick={abrirModalBusqueda}
              title="Buscar"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Modal de Búsqueda Rediseñado */}
        <Modal
          open={modalBusquedaAbierto}
          onClose={cerrarModalBusqueda}
          title="Búsqueda Avanzada"
        >
          <div className="search-filters">
            <div className="form-group">
              <label>Buscar por:</label>
              <select
                value={tipoBusqueda}
                onChange={(e) => setTipoBusqueda(e.target.value)}
                className="form-control"
              >
                <option value="nombreArticulo">Nombre del Artículo</option>
                <option value="nombreDonante">Nombre del Donante</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Valor de Búsqueda:</label>
              <input
                type="text"
                value={valorBusqueda}
                onChange={(e) => setValorBusqueda(e.target.value)}
                className="form-control"
                placeholder="Ingresa el término de búsqueda..."
                onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button className="btn-search" onClick={handleBuscar}>
              🔍 Buscar
            </button>
            
          </div>

          {resultadosBusqueda.length > 0 && (
            <div className="search-results">
              <h5>Resultados de la Búsqueda ({resultadosBusqueda.length})</h5>
              <ul>
                {resultadosBusqueda.map((resultado, idx) => (
                  <li key={idx}>
                    <div className="result-item">
                      <div className="result-info">
                        <strong>Artículo:</strong> {resultado.nombre_articulo}
                        <br />
                        <strong>Donante:</strong> {resultado.nombre_donante || "N/A"}
                      </div>
                      <button
                        className="btn-details"
                        onClick={() => handleVerDetalles(resultado)}
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {resultadosBusqueda.length === 0 && valorBusqueda && (
            <div className="no-results">
              <p>No se encontraron resultados para "{valorBusqueda}"</p>
            </div>
          )}
        </Modal>

        {/* Donation Details Modal */}
        <Modal
          open={!!donacionSeleccionada}
          onClose={() => setDonacionSeleccionada(null)}
          title="Detalles de la Donación"
        >
          {donacionSeleccionada && (
            <>
              <p>
                <strong>Artículo:</strong>{" "}
                {donacionSeleccionada.nombre_articulo}
              </p>
              <p>
                <strong>Donante:</strong> {donacionSeleccionada.nombre_donante}
              </p>
              <p>
                <strong>Cantidad:</strong> {donacionSeleccionada.cantidad}
              </p>
              <p>
                <strong>Espacio:</strong> {donacionSeleccionada.espacio}
              </p>
              <p>
                <strong>Estante:</strong> {donacionSeleccionada.estante}
              </p>
              <p>
                <strong>Almacén:</strong> {donacionSeleccionada.nombre_almacen}
              </p>
              <div style={{ textAlign: "right" }}>
                {/*<button
                  className="btn-edit"
                  onClick={() => abrirModalEditar(donacionSeleccionada)}
                  style={{ marginRight: 8 }}
                >
                  Editar
                </button>*/}
                <button
                  className="btn-close"
                  onClick={() => setDonacionSeleccionada(null)}
                >
                  Cerrar
                </button>
              </div>
            </>
          )}
        </Modal>

        {/* Edit Donation Modal */}
        <Modal
          open={modalEditarAbierto && !!donacionEditando}
          onClose={cerrarModalEditar}
          title="Editar Donación"
        >
          {donacionEditando && (
            <>
              <div className="edit-form" style={{ marginBottom: "1rem" }}>
                <div>
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    value={donacionEditando.cantidad}
                    onChange={(e) =>
                      setDonacionEditando({
                        ...donacionEditando,
                        cantidad: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </div>
                <div style={{ marginTop: 10 }}>
                  <label>Fecha de Vencimiento:</label>
                  <input
                    type="date"
                    value={donacionEditando.fecha_vencimiento || ""}
                    onChange={(e) =>
                      setDonacionEditando({
                        ...donacionEditando,
                        fecha_vencimiento: e.target.value,
                      })
                    }
                    className="form-control"
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <button
                  className="btn-save"
                  onClick={handleGuardarEdicion}
                  style={{ marginRight: 8 }}
                >
                  Guardar
                </button>
                <button className="btn-close" onClick={cerrarModalEditar}>
                  Cancelar
                </button>
              </div>
            </>
          )}
        </Modal>

        {vista === "general" && (
          <section className="table-section">
            <h4>Donaciones en Especie</h4>
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Categoría</th>
                  <th>Unidad</th>
                  <th>Cantidad Total</th>
                  <th>Ubicaciones</th>
                </tr>
              </thead>
              <tbody>
                {inventarioFiltrado.map((item) => (
                  <tr key={item.id_articulo}>
                    <td
                      onClick={() => abrirModal(item)}
                      style={{ cursor: "pointer", color: "blue" }}
                    >
                      {item.nombre_articulo}
                    </td>
                    <td>{item.nombre_categoria}</td>
                    <td>{item.nombre_unidad}</td>
                    <td>{item.cantidad_total}</td>
                    <td>
                      <ul>
                        {[
                          ...new Map(
                            item.ubicaciones.map((u) => {
                              const key = `${u.espacio}-${u.estante}-${u.almacen}`;
                              return [key, u];
                            })
                          ).values(),
                        ].map((ubicacion, idx) => (
                          <li key={idx}>
                            {ubicacion.espacio} – {ubicacion.estante}
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {vista === "porEstante" && (
          <section className="table-section">
            <h4>Donaciones por Estante</h4>
            {estantesConContenido.map((estante) => (
              <div key={estante.id_estante} style={{ marginBottom: "1rem" }}>
                <h5>{estante.nombre_estante}</h5>
                {estante.espacios.map(
                  (espacio) =>
                    espacio.donaciones.length > 0 && (
                      <div
                        key={espacio.id_espacio}
                        style={{ marginLeft: "1rem" }}
                      >
                        <h6>{espacio.nombre_espacio}</h6>
                        <table className="activity-table">
                          <thead>
                            <tr>
                              <th>Artículo</th>
                              <th>Donante</th>
                              <th>Cantidad Restante</th>
                              <th>Fecha de Vencimiento</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {espacio.donaciones.map((donacion) => (
                              <tr key={donacion.id_donacion}>
                                <td>{donacion.nombre_articulo}</td>
                                <td>{donacion.nombre_donante}</td>
                                <td>{donacion.cantidad_restante}</td>
                                <td>
                                  {donacion.fecha_vencimiento
                                    ? new Date(
                                        donacion.fecha_vencimiento
                                      ).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td>
                                  <button
                                    onClick={() =>
                                      abrirModalCambioEspacio(donacion)
                                    }
                                    style={{
                                      padding: "0.3rem 0.6rem",
                                      borderRadius: "5px",
                                      backgroundColor: "#007bff",
                                      color: "white",
                                      border: "none",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Mover Ubicación
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                )}
              </div>
            ))}

            {mostrarEstantesVacios &&
              estantesVacios.map((estante) => (
                <div key={estante.id_estante} style={{ marginBottom: "1rem" }}>
                  <h5>{estante.nombre_estante} (Vacío)</h5>
                </div>
              ))}

            {!mostrarEstantesVacios && estantesVacios.length > 0 && (
              <button
                onClick={() => setMostrarEstantesVacios(true)}
                style={{
                  marginTop: "1rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "5px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                }}
              >
                Mostrar Estantes Vacíos
              </button>
            )}
          </section>
        )}

        <section className="table-section">
          <h4>Donaciones en Dinero (Cuenta)</h4>
          <table className="activity-table">
            <thead>
              <tr>
                <th>Monto Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{montoAnimado.toFixed(2)} Bs</td>
              </tr>
            </tbody>
          </table>
          <button
            className="btn-donors"
            onClick={() => setModalDineroAbierto(true)}
          >
            Ver Detalle
          </button>
        </section>
      </div>
      <DonorsModal
        isOpen={modalAbierto}
        articuloId={articuloSeleccionado?.id_articulo}
        articuloNombre={articuloSeleccionado?.nombre_articulo}
        onClose={() => setModalAbierto(false)}
      />

      <MoneyDonorsModal
        isOpen={modalDineroAbierto}
        onClose={() => setModalDineroAbierto(false)}
      />

      {modalCambioEspacioAbierto && (
        <ModalCambioEspacio
          idDonacion={donacionParaMover?.id_donacion}
          onClose={cerrarModalCambioEspacio}
          onSuccess={() => {
            cerrarModalCambioEspacio();
            // Aquí puedes agregar lógica para refrescar los datos si es necesario
          }}
        />
      )}
    </div>
  );
}

export default Inventory;
