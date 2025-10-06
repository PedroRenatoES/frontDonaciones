import React, { useState, useEffect, useCallback } from "react";
import axios from "../axios";
import "../styles/Inventory.css";
import DonorsModal from "./DonorsModal";
import MoneyDonorsModal from "./MoneyDonorsModal";
import ModalCambioEspacio from "./ModalCambioEspacio"; // Importé el modal para mover ubicación
import Select from 'react-select'; // Importar react-select
import ConfirmModal from "./ConfirmModal";
import { useConfirmModal } from "../hooks/useConfirmModal";

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
  const { modalState, showConfirm, showAlert } = useConfirmModal();
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

  // Nuevos estados para los selects
  const [articulos, setArticulos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [campanas, setCampanas] = useState([]);

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

  // Función para cargar datos adicionales (artículos, espacios, donantes, campañas)
  const fetchExtras = async () => {
    try {
      const [articulosRes, espaciosRes, almacenesRes, donantesRes, campanasRes] = await Promise.all([
        axios.get('/catalogo'),
        axios.get('/espacios'),
        axios.get('/almacenes'),
        axios.get('/donantes'),
        axios.get('/campanas') // Asumiendo que tienes un endpoint para campañas
      ]);
      
      setArticulos(articulosRes.data);
      setEspacios(espaciosRes.data);
      setAlmacenes(almacenesRes.data);
      setDonantes(donantesRes.data);
      setCampanas(campanasRes.data);
    } catch (error) {
      console.error('Error al cargar datos adicionales:', error);
    }
  };

  // Cargar datos extras cuando el componente se monta
  useEffect(() => {
    fetchExtras();
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

  const handleEliminarDonacion = async (donacion) => {
    let mensajeConfirmacion = `¿Estás seguro de que quieres eliminar la donación de "${donacion.nombre_articulo}"?`;
    
    // Agregar información adicional al mensaje
    if (donacion.cantidad_restante !== donacion.cantidad) {
      mensajeConfirmacion += `\n\n⚠️  ATENCIÓN: Esta donación ya ha sido utilizada parcialmente (${donacion.cantidad_restante}/${donacion.cantidad} restantes).`;
      
      if (donacion.fecha_vencimiento) {
        const fechaVencimiento = new Date(donacion.fecha_vencimiento);
        const fechaActual = new Date();
        const yaVencido = fechaVencimiento < fechaActual;
        
        if (yaVencido) {
          mensajeConfirmacion += `\n✅ El artículo ya venció el ${fechaVencimiento.toLocaleDateString()} - Se puede eliminar.`;
        } else {
          mensajeConfirmacion += `\n❌ El artículo aún no vence (${fechaVencimiento.toLocaleDateString()}) - No se puede eliminar.`;
        }
      } else {
        mensajeConfirmacion += `\n❌ El artículo no tiene fecha de vencimiento - No se puede eliminar.`;
      }
    }

    const confirmed = await showConfirm({
      title: "Eliminar Donación",
      message: mensajeConfirmacion,
      type: "alert"
    });

    if (!confirmed) {
      return;
    }

    try {
      await axios.delete(`/donaciones/${donacion.id_donacion}`);
      
      await showAlert({
        title: "Éxito",
        message: "Donación eliminada con éxito",
        type: "success"
      });
      
      // Recargar datos
      if (vista === "porEstante") {
        fetchDonacionesPorEstante();
      }
    } catch (error) {
      console.error("Error al eliminar la donación:", error);
      
      if (error.response?.status === 400) {
        await showAlert({
          title: "Error",
          message: error.response.data.details,
          type: "error"
        });
      } else {
        await showAlert({
          title: "Error",
          message: "No se pudo eliminar la donación",
          type: "error"
        });
      }
    }
  };

  const marcarEspacioLleno = async (id_espacio) => {
    try {
      console.log(`🔄 Marcando espacio ${id_espacio} como lleno...`);
      const response = await axios.put(`/espacios/${id_espacio}/llenar`);
      console.log('✅ Respuesta del servidor:', response.data);
      
      await showAlert({
        title: "Éxito",
        message: "Espacio marcado como lleno",
        type: "success"
      });
      
      // Recargar los datos
      if (vista === "porEstante") {
        fetchDonacionesPorEstante();
      }
      
    } catch (error) {
      console.error("Error al marcar espacio como lleno:", error);
      console.error("Detalles del error:", error.response?.data);
      await showAlert({
        title: "Error",
        message: "No se pudo marcar el espacio como lleno",
        type: "error"
      });
    }
  };

  // Función para marcar espacio como con espacio disponible
  const marcarEspacioVacio = async (id_espacio) => {
    try {
      console.log(`🔄 Marcando espacio ${id_espacio} como disponible...`);
      const response = await axios.put(`/espacios/${id_espacio}/vaciar`);
      console.log('✅ Respuesta del servidor:', response.data);
      
      await showAlert({
        title: "Éxito",
        message: "Espacio marcado como con espacio disponible",
        type: "success"
      });
      
      // Recargar los datos
      if (vista === "porEstante") {
        fetchDonacionesPorEstante();
      }
      
    } catch (error) {
      console.error("Error al marcar espacio como vacío:", error);
      console.error("Detalles del error:", error.response?.data);
      await showAlert({
        title: "Error",
        message: "No se pudo marcar el espacio como con espacio disponible",
        type: "error"
      });
    }
  };

  const abrirModalEditar = (donacion) => {
    
    // Usar los datos que ya tenemos en la tabla
    const datosParaEditar = {
      id_donacion: donacion.id_donacion,
      id_donante: donacion.id_donante,
      id_campana: donacion.id_campana,
      id_articulo: donacion.id_articulo,
      cantidad: donacion.cantidad, // Usar cantidad_restante si cantidad no existe
      estado_articulo: donacion.estado_articulo,
      fecha_vencimiento: donacion.fecha_vencimiento,
      nombre_donante: donacion.nombre_donante,
      nombre_articulo: donacion.nombre_articulo
    };
    
    setDonacionEditando(datosParaEditar);
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setDonacionEditando(null);
    setModalEditarAbierto(false);
  };

  const handleGuardarEdicion = async () => {
    try {
      await axios.put(`/donaciones/${donacionEditando.id_donacion}`, {
        id_donante: donacionEditando.id_donante,
        id_campana: donacionEditando.id_campana,
        id_articulo: donacionEditando.id_articulo,
        cantidad: donacionEditando.cantidad,
        estado_articulo: donacionEditando.estado_articulo,
        fecha_vencimiento: donacionEditando.fecha_vencimiento,
      });

      alert("Donación actualizada con éxito");
      cerrarModalEditar();
      // Recargar datos si es necesario
      if (vista === "porEstante") {
        fetchDonacionesPorEstante();
      }
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
      {/*if (!almacenUsuario) {
        console.error(
          "No se encontró un almacén que coincida con el nombre almacenado."
        );
        return;
      }*/}

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

  // Preparar opciones para los selects
  const opcionesArticulos = articulos.map(art => ({ 
    value: art.id_articulo, 
    label: art.nombre_articulo 
  }));

  const opcionesDonantes = donantes.map(d => ({ 
    value: d.id_donante, 
    label: `${d.nombres} ${d.apellido_paterno || ''} ${d.apellido_materno || ''}`.trim()
  }));

  const opcionesCampanas = campanas.map(c => ({ 
    value: c.id_campana, 
    label: c.nombre_campana 
  }));

  // Función mejorada para encontrar valores en selects
  const encontrarValorSelect = (opciones, valor) => {
    if (!valor) return null;
    const valorNum = parseInt(valor);
    return opciones.find(opcion => opcion.value === valorNum) || null;
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

        {/* Edit Donation Modal - MODIFICADO CON SELECTS */}
        {/* Edit Donation Modal - SIMPLIFICADO */}
        <Modal
          open={modalEditarAbierto && !!donacionEditando}
          onClose={cerrarModalEditar}
          title="Editar Donación"
        >
          {donacionEditando && (
            <>
              <div className="edit-form" style={{ marginBottom: "1rem" }}>
                <div className="form-group">
                  <label>Donante:</label>
                  <Select
                    options={opcionesDonantes}
                    onChange={(selected) => {
                      setDonacionEditando({
                        ...donacionEditando,
                        id_donante: selected?.value || '',
                        nombre_donante: selected?.label || ''
                      });
                    }}
                    value={opcionesDonantes.find(d => d.value === donacionEditando.id_donante) || null}
                    placeholder="Seleccionar donante"
                    isClearable
                  />
                </div>

                <div className="form-group">
                  <label>Campaña:</label>
                  <Select
                    options={opcionesCampanas}
                    onChange={(selected) => {
                      setDonacionEditando({
                        ...donacionEditando,
                        id_campana: selected?.value || ''
                      });
                    }}
                    value={opcionesCampanas.find(c => c.value === donacionEditando.id_campana) || null}
                    placeholder="Seleccionar campaña"
                    isClearable
                  />
                </div>

                <div className="form-group">
                  <label>Artículo:</label>
                  <Select
                    options={opcionesArticulos}
                    onChange={(selected) => {
                      setDonacionEditando({
                        ...donacionEditando,
                        id_articulo: selected?.value || ''
                      });
                    }}
                    value={opcionesArticulos.find(a => a.value === donacionEditando.id_articulo) || null}
                    placeholder="Seleccionar artículo"
                    isClearable
                  />
                </div>

                <div className="form-group">
                  <label>Cantidad:</label>
                  <input
                    type="number"
                    value={donacionEditando.cantidad || ''}
                    onChange={(e) =>
                      setDonacionEditando({
                        ...donacionEditando,
                        cantidad: parseInt(e.target.value) || 0,
                      })
                    }
                    className="form-control"
                    min="1"
                  />
                </div>

                <div className="form-group">
                  <label>Estado del Artículo:</label>
                  <select
                    value={donacionEditando.estado_articulo || ''}
                    onChange={(e) =>
                      setDonacionEditando({
                        ...donacionEditando,
                        estado_articulo: e.target.value,
                      })
                    }
                    className="form-control"
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="Sellado">Sellado</option>
                    <option value="Abierto">Abierto</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Fecha de Vencimiento:</label>
                  <input
                    type="date"
                    value={donacionEditando.fecha_vencimiento || ''}
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
              <div key={estante.id_estante} style={{ marginBottom: "2rem", position: "relative" }}>
                <h5>{estante.nombre_estante}</h5>
                {estante.espacios.map(
                  (espacio) =>
                    espacio.donaciones.length > 0 && (
                      <div
                        key={espacio.id_espacio}
                        style={{ 
                          marginLeft: "1rem", 
                          marginBottom: "1.5rem",
                          border: "1px solid #e0e0e0",
                          borderRadius: "8px",
                          padding: "1rem",
                          backgroundColor: "#f9f9f9"
                        }}
                      >
                        {/* ✅ Encabezado del espacio con el botón a la derecha */}
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center", 
                          marginBottom: "1rem" 
                        }}>
                          <h6 style={{ margin: 0 }}>
                            {espacio.nombre_espacio}
                            {/* ✅ Usar el estado del espacio del backend */}
                            {espacio.lleno && (
                              <span style={{ 
                                marginLeft: "10px", 
                                color: "#dc3545", 
                                fontSize: "0.8rem",
                                fontWeight: "bold"
                              }}>
                                (LLENO)
                              </span>
                            )}
                          </h6>
                          
                          {/* ✅ Botón para marcar espacio como lleno/vacío - usar datos del backend */}
                          {!espacio.lleno ? (
                            <button
                              onClick={() => marcarEspacioLleno(espacio.id_espacio)}
                              style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "5px",
                                backgroundColor: "#ffc107",
                                color: "black",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                              title="Marcar espacio como lleno"
                            >
                              🚫 Marcar Lleno
                            </button>
                          ) : (
                            <button
                              onClick={() => marcarEspacioVacio(espacio.id_espacio)}
                              style={{
                                padding: "0.5rem 1rem",
                                borderRadius: "5px",
                                backgroundColor: "#28a745",
                                color: "white",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                fontWeight: "bold",
                                whiteSpace: "nowrap"
                              }}
                              title="Marcar espacio como con espacio disponible"
                            >
                              ✅ Espacio Disponible
                            </button>
                          )}
                        </div>

                        
                        {/* Tabla de donaciones */}
                        <table className="activity-table" style={{ width: "100%" }}>
                          <thead>
                            <tr>
                              <th>Artículo</th>
                              <th>Donante</th>
                              <th>Cantidad Donada</th>
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
                                <td>{donacion.cantidad}</td>
                                <td>{donacion.cantidad_restante}</td>
                                <td>
                                  {donacion.fecha_vencimiento
                                    ? new Date(donacion.fecha_vencimiento).toLocaleDateString()
                                    : "N/A"}
                                </td>
                                <td>
                                  {/* Botón Mover Ubicación - visible para todos */}
                                  <button
                                    onClick={() => abrirModalCambioEspacio(donacion)}
                                    style={{
                                      padding: "0.3rem 0.6rem",
                                      borderRadius: "5px",
                                      backgroundColor: "#007bff",
                                      color: "white",
                                      border: "none",
                                      cursor: "pointer",
                                      marginRight: "5px"
                                    }}
                                  >
                                    Mover Ubicación
                                  </button>

                                  {/* Botones de Editar y Eliminar - solo para admin */}
                                  {localStorage.getItem('rol') === '1' && (
                                    <>
                                      <button
                                        onClick={() => abrirModalEditar(donacion)}
                                        style={{
                                          padding: "0.3rem 0.6rem",
                                          borderRadius: "5px",
                                          backgroundColor: "#28a745",
                                          color: "white",
                                          border: "none",
                                          cursor: "pointer",
                                          marginRight: "5px"
                                        }}
                                      >
                                        Editar
                                      </button>

                                      <button
                                        onClick={() => handleEliminarDonacion(donacion)}
                                        style={{
                                          padding: "0.3rem 0.6rem",
                                          borderRadius: "5px",
                                          backgroundColor: "#dc3545",
                                          color: "white",
                                          border: "none",
                                          cursor: "pointer"
                                        }}
                                      >
                                        Eliminar
                                      </button>
                                    </>
                                  )}
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

            {/* Para estantes vacíos también actualizamos la estructura */}
            {mostrarEstantesVacios &&
              estantesVacios.map((estante) => (
                <div key={estante.id_estante} style={{ marginBottom: "1rem" }}>
                  <h5>
                    {estante.nombre_estante} (Vacío)
                    {estante.espacios.some(espacio => espacio.estado_espacio === 'lleno') && (
                      <span style={{ 
                        marginLeft: "10px", 
                        color: "#dc3545", 
                        fontSize: "0.8rem"
                      }}>
                        - Algunos espacios marcados como llenos
                      </span>
                    )}
                  </h5>
                  
                  {/* Mostrar botones para espacios vacíos también */}
                  {estante.espacios.map(espacio => (
                    <div key={espacio.id_espacio} style={{ 
                      marginLeft: "1rem", 
                      marginBottom: "0.5rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      border: "1px solid #e0e0e0",
                      borderRadius: "5px",
                      backgroundColor: "#f5f5f5"
                    }}>
                      <span>{espacio.nombre_espacio}</span>
                      {espacio.estado_espacio === 'disponible' ? (
                        <button
                          onClick={() => marcarEspacioLleno(espacio.id_espacio)}
                          style={{
                            padding: "0.3rem 0.8rem",
                            borderRadius: "5px",
                            backgroundColor: "#ffc107",
                            color: "black",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "bold"
                          }}
                        >
                          🚫 Marcar Lleno
                        </button>
                      ) : (
                        <button
                          onClick={() => marcarEspacioVacio(espacio.id_espacio)}
                          style={{
                            padding: "0.3rem 0.8rem",
                            borderRadius: "5px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: "bold"
                          }}
                        >
                          ✅ Disponible
                        </button>
                      )}
                    </div>
                  ))}
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

      <ConfirmModal
        show={modalState.show}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </div>
  );
}

export default Inventory;