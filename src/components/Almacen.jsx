import React, { useState, useEffect } from "react";
import axios from "../axios";
import "../styles/Almacen.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ModalCambioEspacio from "./ModalCambioEspacio";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { FaEdit, FaTrash } from "react-icons/fa"; // Importar íconos de edición y eliminación
import ConfirmModal from "./ConfirmModal";
import { useConfirmModal } from "../hooks/useConfirmModal";
import { useSimpleSecurity } from "../hooks/useSimpleSecurity";

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [almacenFiltro, setAlmacenFiltro] = useState("");
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const { modalState, showConfirm, showAlert } = useConfirmModal();
  const { isAdmin, userRole, logActivity } = useSimpleSecurity();

  // Verificar acceso de admin
  useEffect(() => {
    if (userRole !== null && !isAdmin) {
      logActivity('ACCESS_DENIED_INSUFFICIENT_ROLE', { 
        requiredRole: 'admin',
        currentRole: userRole
      });
      window.location.href = '/dashboard';
    }
  }, [isAdmin, userRole, logActivity]);
  const [estantes, setEstantes] = useState([]);
  const [estanteFiltro, setEstanteFiltro] = useState("");
  const [idAlmacenSeleccionado, setIdAlmacenSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoAlmacen, setNuevoAlmacen] = useState({
    nombre: "",
    ubicacion: "",
    latitud: null,
    longitud: null,
  });
  const [estantesAlmacen, setEstantesAlmacen] = useState([]);
  const [estanteSeleccionado, setEstanteSeleccionado] = useState(null);
  const [espaciosEstante, setEspaciosEstante] = useState([]);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [modalIdDonacion, setModalIdDonacion] = useState(null); // id_donacion_especie para mover
  const [modalMapaVisible, setModalMapaVisible] = useState(false); // Estado para el modal del mapa
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null); // Almacén seleccionado para ver en el mapa

  const [almacenEditando, setAlmacenEditando] = useState(null);
  const [nuevoEstante, setNuevoEstante] = useState({
    nombre: "",
    cantidad_filas: "",
    cantidad_columnas: "",
  });
  const [espacioFiltro, setEspacioFiltro] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [idArticuloSeleccionado, setIdArticuloSeleccionado] = useState(null);

  const abrirModal = (idArticulo) => {
    setIdArticuloSeleccionado(idArticulo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setIdArticuloSeleccionado(null);
  };

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const resAlmacenes = await axios.get("/almacenes");
        const resCategorias = await axios.get("/categorias");
        setAlmacenes(resAlmacenes.data);
        setCategorias(resCategorias.data);
        filterItems(resAlmacenes.data);
      } catch (error) {
        console.error("Error al obtener los almacenes o categorías:", error);
      }
    };

    const fetchEstantes = async () => {
      if (!idAlmacenSeleccionado) {
        setEstantes([]);
        setEstanteFiltro("");
        return;
      }

      try {
        const res = await axios.get(`/almacenes/${idAlmacenSeleccionado}`);
        setEstantes(res.data.estantes || []);
      } catch (error) {
        console.error("Error al obtener estantes del almacén:", error);
        setEstantes([]);
      }
    };

    fetchAlmacenes();
    fetchEstantes();
    filterItems(); // sigue aplicando el filtro general
  }, [idAlmacenSeleccionado]);

  const fetchEstantesDeAlmacen = async () => {
    if (!idAlmacenSeleccionado) return;
    try {
      const res = await axios.get(`/estantes/almacen/${idAlmacenSeleccionado}`);
      setEstantesAlmacen(res.data);
      setEstanteSeleccionado(null); // 👈 LIMPIAR SELECCIÓN
      setEspaciosEstante([]); // 👈 LIMPIAR ESPACIOS
    } catch (error) {
      console.error("Error al obtener estantes del almacén:", error);
    }
  };

  const fetchEspaciosDeEstante = async (id_estante) => {
    try {
      const res = await axios.get(`/espacios/estante/${id_estante}`);
      setEspaciosEstante(res.data);
    } catch (error) {
      console.error("Error al obtener espacios del estante:", error);
    }
  };

  const handleSeleccionarEstante = (estante) => {
    const mismoEstante = estanteSeleccionado?.id_estante === estante.id_estante;

    setEstanteSeleccionado(mismoEstante ? null : estante);
    setEstanteFiltro(mismoEstante ? "" : estante.nombre);
    setEspacioFiltro(""); // Limpia el espacio si se cambia el estante

    if (!mismoEstante) {
      fetchEspaciosDeEstante(estante.id_estante);
    } else {
      setEspaciosEstante([]);
    }
  };

  const handleEliminarEstante = async (id_estante) => {
    try {
      await axios.delete(`/estantes/${id_estante}`);
      fetchEstantesDeAlmacen();
      setEstanteSeleccionado(null);
      setEspaciosEstante([]);
    } catch (error) {
      console.error("Error al eliminar el estante:", error);
    }
  };

  const handleSeleccionarEspacio = (codigoEspacio) => {
    setEspacioFiltro((prev) => (prev === codigoEspacio ? "" : codigoEspacio));
  };

  const handleEliminarEspacio = async (id_espacio) => {
    try {
      await axios.delete(`/espacios/${id_espacio}`);
      fetchEspaciosDeEstante(estanteSeleccionado.id_estante);
    } catch (error) {
      console.error("Error al eliminar el espacio:", error);
    }
  };

  const filterItems = async () => {
    try {
      const res = await axios.get("/almacenes/con-contenido"); // nuevo endpoint
      const data = res.data;

      let articulos = [];

      data.forEach((almacen) => {
        // Filtro por almacén
        if (
          idAlmacenSeleccionado &&
          almacen.id_almacen !== idAlmacenSeleccionado
        )
          return;

        Object.values(almacen.estantes).forEach((estante) => {
          // Filtro por estante
          if (
            estanteSeleccionado &&
            estante.id_estante !== estanteSeleccionado.id_estante
          )
            return;

          Object.values(estante.espacios).forEach((espacio) => {
            // Filtro por espacio (opcional)
            if (espacioFiltro && espacio.codigo_espacio !== espacioFiltro)
              return;

            espacio.articulos.forEach((articulo) => {
              // Agregamos la ubicación a cada artículo
              articulos.push({
                ...articulo,
                ubicacion: {
                  espacio: espacio.codigo_espacio,
                  estante: estante.nombre_estante,
                  almacen: almacen.nombre_almacen,
                },
              });
            });
          });
        });
      });

      // Agrupamos por artículo
      const agrupados = {};

      articulos.forEach((a) => {
        const key = a.id_articulo;

        if (!agrupados[key]) {
          agrupados[key] = {
            id_articulo: a.id_articulo,
            nombre_articulo: a.nombre_articulo,
            nombre_categoria: a.nombre_categoria,
            nombre_unidad: a.nombre_unidad,
            cantidad_total: 0,
            ubicaciones: [],
          };
        }

        agrupados[key].cantidad_total += a.cantidad;
        agrupados[key].ubicaciones.push(a.ubicacion);
      });

      // Filtro por categoría (si aplica)
      let resultado = Object.values(agrupados);
      if (categoriaFiltro) {
        resultado = resultado.filter(
          (item) => item.nombre_categoria === categoriaFiltro
        );
      }

      setItemsFiltrados(resultado);
    } catch (error) {
      console.error("Error al obtener los artículos:", error);
    }
  };

  const handleCrearAlmacen = async () => {
    const { nombre, ubicacion, latitud, longitud } = nuevoAlmacen;

    if (!nombre || !ubicacion || latitud === null || longitud === null) {
      alert(
        "Todos los campos son obligatorios, incluyendo la selección de un punto en el mapa."
      );
      return;
    }

    try {
      await axios.post("/almacenes", {
        nombre_almacen: nombre,
        ubicacion,
        latitud,
        longitud,
      });

      // Limpiar campos y cerrar modal
      setNuevoAlmacen({
        nombre: "",
        ubicacion: "",
        latitud: null,
        longitud: null,
      });
      setModalVisible(false);

      // Refrescar lista de almacenes
      const res = await axios.get("/almacenes");
      setAlmacenes(res.data);
    } catch (error) {
      console.error("Error al crear el almacén:", error);
    }
  };

  const handleEditarAlmacen = (almacen) => {
    setAlmacenEditando(almacen); // Establece el almacén que se está editando
    setNuevoAlmacen({
      nombre: almacen.nombre_almacen,
      ubicacion: almacen.ubicacion,
      latitud: almacen.latitud,
      longitud: almacen.longitud,
    });
  };

  const handleGuardarEdicion = async () => {
    try {
      await axios.put(`/almacenes/${almacenEditando.id_almacen}`, {
        nombre_almacen: nuevoAlmacen.nombre,
        ubicacion: nuevoAlmacen.ubicacion,
        latitud: nuevoAlmacen.latitud,
        longitud: nuevoAlmacen.longitud,
      });

      // Actualizar la lista de almacenes
      const res = await axios.get("/almacenes");
      setAlmacenes(res.data);

      // Limpiar el estado de edición
      setAlmacenEditando(null);
      setNuevoAlmacen({
        nombre: "",
        ubicacion: "",
        latitud: null,
        longitud: null,
      });
    } catch (error) {
      console.error("Error al actualizar el almacén:", error);
    }
  };

  const handleEliminarAlmacen = async (id) => {
    const confirmed = await showConfirm({
      title: "Eliminar Almacén",
      message: "¿Estás seguro de que deseas eliminar este almacén?",
      type: "alert"
    });

    if (!confirmed) return;

    try {
      await axios.delete(`/almacenes/${id}`);

      await showAlert({
        title: "Éxito",
        message: "Almacén eliminado correctamente",
        type: "success"
      });

      // Actualizar la lista de almacenes
      const res = await axios.get("/almacenes");
      setAlmacenes(res.data);
    } catch (error) {
      console.error("Error al eliminar el almacén:", error);
      await showAlert({
        title: "Error",
        message: "No se pudo eliminar el almacén",
        type: "error"
      });
    }
  };

  const handleVerMapa = (almacen) => {
    setAlmacenSeleccionado(almacen);
    setModalMapaVisible(true);
  };

  const handleCerrarMapa = () => {
    setModalMapaVisible(false);
    setAlmacenSeleccionado(null);
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.latlng;
    setNuevoAlmacen((prev) => ({ ...prev, latitud: lat, longitud: lng }));
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: handleMapClick,
    });
    return null;
  };

  const handleAbrirModalCrearEstante = () => {
    setMostrarModalCrear(true);
  };

  const handleCerrarModalCrearEstante = () => {
    setMostrarModalCrear(false);
    setNuevoEstante({ nombre: "", cantidad_filas: "", cantidad_columnas: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoEstante((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearEstante = async () => {
    const { nombre, cantidad_filas, cantidad_columnas } = nuevoEstante;
    if (!nombre || !cantidad_filas || !cantidad_columnas) {
      alert("Todos los campos son obligatorios");
      return;
    }

    try {
      await axios.post("/estantes", {
        id_almacen: idAlmacenSeleccionado,
        nombre,
        cantidad_filas: parseInt(cantidad_filas, 10),
        cantidad_columnas: parseInt(cantidad_columnas, 10),
      });
      fetchEstantesDeAlmacen();
      handleCerrarModalCrearEstante();
    } catch (error) {
      console.error("Error al crear estante:", error);
      alert("No se pudo crear el estante");
    }
  };

  useEffect(() => {
    filterItems();
    if (idAlmacenSeleccionado) {
      fetchEstantesDeAlmacen();
    } else {
      setEstantesAlmacen([]);
      setEstanteSeleccionado(null);
      setEspaciosEstante([]);
    }
  }, [
    categoriaFiltro,
    almacenFiltro,
    estanteFiltro,
    espacioFiltro,
    idAlmacenSeleccionado,
  ]);

  // ✅ Esta función ahora está dentro del componente y puede acceder a itemsFiltrados
  const generarPDF = () => {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleString("es-MX"); // Fecha y hora en formato local

    doc.setFontSize(18);
    doc.text("Inventario de Almacén", 14, 22);

    doc.setFontSize(11);
    doc.text(`Generado el: ${fechaActual}`, 14, 30); // Línea nueva

    const rows = [];

    itemsFiltrados.forEach((item) => {
      const ubicacionesTexto = item.ubicaciones
        .map((u) => `${u.espacio} – ${u.estante} – ${u.almacen}`)
        .join(", ");

      rows.push([
        item.nombre_articulo,
        item.nombre_categoria,
        item.nombre_unidad,
        item.cantidad_total,
        ubicacionesTexto,
      ]);
    });

    autoTable(doc, {
      head: [["Artículo", "Categoría", "Unidad", "Cantidad", "Ubicaciones"]],
      body: rows,
      startY: 38,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("inventario_almacen.pdf");
  };

  // Update the handleSeleccionarAlmacen function to toggle selection and fix double-click issue
  const handleSeleccionarAlmacen = (almacen) => {
    if (idAlmacenSeleccionado === almacen.id_almacen) {
      setIdAlmacenSeleccionado(null); // Deselect the warehouse
      setEstantesAlmacen([]); // Clear shelves when deselected
    } else {
      setIdAlmacenSeleccionado(almacen.id_almacen);
      fetchEstantesDeAlmacen(almacen.id_almacen); // Fetch shelves for the selected warehouse
    }
  };

  return (
    <div className="almacen">
      <h1>Almacenes y Artículos</h1>

      <div className="row mb-3">
        {/* Filtros */}
        <div className="col-md-6 mb-2">
          <label htmlFor="categoriaFiltro" className="form-label">
            Filtrar por Categoría
          </label>
          <select
            id="categoriaFiltro"
            className="form-select"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria} value={cat.nombre_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        {/* Botón para abrir el modal */}
        {localStorage.getItem("rol") === "1" && (
          <div className="col-md-6 mb-2 d-flex align-items-end justify-content-end">
            <button
              className="btn btn-success"
              onClick={() => setModalVisible(true)}
            >
              Crear Nuevo Almacén
            </button>
          </div>
        )}
      </div>

      {/* Modal para crear un nuevo almacén */}
      {modalVisible && (
        <div className="almacen-modal-backdrop" style={{ background: "rgba(0, 0, 0, 0)" }}>
          <div className="almacen-modal-content" style={{ background: "white" }}>
            <h2>Crear Nuevo Almacén</h2>
            <div className="mb-3">
              <label htmlFor="nombreAlmacen" className="form-label">
                Nombre del Almacén
              </label>
              <input
                type="text"
                id="nombreAlmacen"
                className="form-control"
                value={nuevoAlmacen.nombre}
                onChange={(e) =>
                  setNuevoAlmacen({ ...nuevoAlmacen, nombre: e.target.value })
                }
              />
            </div>
            <div className="mb-3">
              <label htmlFor="ubicacion" className="form-label">
                Ubicación
              </label>
              <input
                type="text"
                id="ubicacion"
                className="form-control"
                value={nuevoAlmacen.ubicacion}
                onChange={(e) =>
                  setNuevoAlmacen({
                    ...nuevoAlmacen,
                    ubicacion: e.target.value,
                  })
                }
              />
            </div>
            <div className="mb-3">
              <label>Seleccionar ubicación en el mapa</label>
              <MapContainer
                center={[-17.7833, -63.1821]} // Coordenadas de Santa Cruz de la Sierra, Bolivia
                zoom={12} // Nivel de zoom inicial
                style={{ height: "400px", width: "100%" }} // Tamaño más grande del mapa
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
                {nuevoAlmacen.latitud && nuevoAlmacen.longitud && (
                  <Marker
                    position={[nuevoAlmacen.latitud, nuevoAlmacen.longitud]}
                  />
                )}
              </MapContainer>
              {nuevoAlmacen.latitud && nuevoAlmacen.longitud && (
                <p>
                  Latitud: {nuevoAlmacen.latitud}, Longitud:{" "}
                  {nuevoAlmacen.longitud}
                </p>
              )}
            </div>
            <div className="almacen-modal-footer">
              <button
                className="almacen-btn-secundary"
                onClick={() => setModalVisible(false)}
              >
                Cerrar
              </button>
              <button
                className="almacen-btn-confirmar"
                onClick={handleCrearAlmacen}
              >
                Crear Almacén
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-3">
        <h5>Seleccionar Almacén</h5>
        <div className="row">
          {almacenes.map((almacen) => (
            <div className="col-md-4 mb-3" key={almacen.id_almacen}>
              <div className="card h-100 position-relative">
                <div className="card-body">
                  <button
                    className={`btn btn-sm position-absolute top-0 end-0 ${
                      idAlmacenSeleccionado === almacen.id_almacen
                        ? "btn-primary text-white"
                        : "btn-outline-primary"
                    }`}
                    style={{
                      backgroundColor:
                        idAlmacenSeleccionado === almacen.id_almacen
                          ? "blue"
                          : "white",
                      borderRadius: "5px",
                    }}
                    onClick={() => handleSeleccionarAlmacen(almacen)}
                  >
                    Seleccionar
                  </button>
                  <h5 className="card-title">{almacen.nombre_almacen}</h5>
                  <p className="card-text">
                    {almacen.ubicacion || "Sin ubicación registrada"}
                  </p>
                  <div className="d-flex justify-content-between">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleVerMapa(almacen)}
                    >
                      Ver
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => handleEditarAlmacen(almacen)}
                    >
                      <FaEdit /> Editar
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleEliminarAlmacen(almacen.id_almacen)}
                    >
                      <FaTrash /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal para mostrar el mapa */}
        {modalMapaVisible && almacenSeleccionado && (
          <div className="almacen-modal-backdrop" style={{ background: "rgba(0, 0, 0, 0)" }}>
            <div className="almacen-modal-content" style={{ background: "white" }}>
              <h2>Ubicación del Almacén</h2>
              {almacenSeleccionado.latitud && almacenSeleccionado.longitud ? (
                <MapContainer
                  center={[
                    almacenSeleccionado.latitud,
                    almacenSeleccionado.longitud,
                  ]}
                  zoom={15}
                  style={{ height: "400px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker
                    position={[
                      almacenSeleccionado.latitud,
                      almacenSeleccionado.longitud,
                    ]}
                  />
                </MapContainer>
              ) : (
                <p className="text-center text-muted">
                  Este almacén no tiene una ubicación registrada para mostrar en
                  el mapa.
                </p>
              )}
              <div className="almacen-modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCerrarMapa}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {idAlmacenSeleccionado && (
          <div className="mt-4">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h4>Estantes del almacén seleccionado</h4>
              <div>
                <button
                  className="btn btn-success me-2"
                  onClick={handleAbrirModalCrearEstante}
                >
                  Crear Estante
                </button>
                {estanteSeleccionado && (
                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      handleEliminarEstante(estanteSeleccionado.id_estante)
                    }
                  >
                    Eliminar Estante Seleccionado
                  </button>
                )}
              </div>
            </div>
            {estantesAlmacen.length > 0 && (
              <div className="row">
                {estantesAlmacen.map((estante) => (
                  <div className="col-md-3 mb-3" key={estante.id_estante}>
                    <div
                      className={`card text-center ${
                        estanteSeleccionado?.id_estante === estante.id_estante
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() => handleSeleccionarEstante(estante)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="card-body d-flex flex-column align-items-center">
                        <i className="fas fa-table fa-3x mb-3 text-secondary"></i>{" "}
                        {/* ícono de estante */}
                        <h5 className="card-title">{estante.nombre}</h5>
                        <p className="card-text small text-muted mt-2">
                          {estante.cantidad_filas} filas x{" "}
                          {estante.cantidad_columnas} columnas
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {estanteSeleccionado && (
          <div className="mt-4">
            <h4>Espacios del estante seleccionado</h4>
            <div className="row">
              {espaciosEstante.map((espacio) => (
                <div className="col-md-2 mb-2" key={espacio.id_espacio}>
                  <div
                    className={`card text-center ${
                      espacioFiltro === espacio.codigo ? "border-primary" : ""
                    }`}
                    onClick={() =>
                      setEspacioFiltro((prev) =>
                        prev === espacio.codigo ? "" : espacio.codigo
                      )
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-body p-2">
                      <i className="fas fa-square fa-3x mb-3 text-secondary"></i>
                      <h6>{espacio.codigo}</h6>
                      <p
                        className={`mb-1 ${
                          espacio.lleno ? "text-success" : "text-muted"
                        }`}
                      >
                        {espacio.lleno ? "Lleno" : "Vacío"}
                      </p>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                          e.stopPropagation(); // evita seleccionar al hacer click en el botón
                          handleEliminarEspacio(espacio.id_espacio);
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabla */}
      <table className="almacenes-table">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th>Cantidad</th>
            <th>Ubicaciones</th>
            {/* Removed the "Acciones" column */}
          </tr>
        </thead>
        <tbody>
          {itemsFiltrados.length > 0 ? (
            itemsFiltrados.map((item) => (
              <tr key={item.id_articulo}>
                <td>{item.nombre_articulo}</td>
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
                        {ubicacion.espacio} – {ubicacion.estante} –{" "}
                        {ubicacion.almacen}
                      </li>
                    ))}
                  </ul>
                </td>
                {/* Removed the "Acciones" cell */}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center">
                No hay artículos disponibles para mostrar
              </td>{" "}
              {/* Updated colspan to 5 */}
            </tr>
          )}
        </tbody>
      </table>

      {modalAbierto && (
        <ModalCambioEspacio
          idDonacion={idArticuloSeleccionado}
          onClose={cerrarModal}
          onSuccess={() => {
            cerrarModal();
            filterItems(); // Para refrescar la tabla
          }}
        />
      )}

      <button className="btn btn-outline-primary mb-4" onClick={generarPDF}>
        Exportar a PDF
      </button>

      {mostrarModalCrear && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Crear Estante</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCerrarModalCrearEstante}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del estante</label>
                  <input
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={nuevoEstante.nombre}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cantidad de filas</label>
                  <input
                    type="number"
                    className="form-control"
                    name="cantidad_filas"
                    value={nuevoEstante.cantidad_filas}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Cantidad de columnas</label>
                  <input
                    type="number"
                    className="form-control"
                    name="cantidad_columnas"
                    value={nuevoEstante.cantidad_columnas}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={handleCerrarModalCrearEstante}
                >
                  Cancelar
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCrearEstante}
                >
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar el almacén */}
      {almacenEditando && (
        <div className="almacen-modal-backdrop" style={{ background: "rgba(0, 0, 0, 0)" }}>
          <div className="almacen-modal-content" style={{ maxWidth: "800px", background: "white" }}>
            {" "}
            {/* Aumentar el ancho del modal */}
            <h2>Editar Almacén</h2>
            <div className="mb-3">
              <label className="form-label">Nombre del Almacén</label>
              <input
                type="text"
                className="form-control"
                value={nuevoAlmacen.nombre}
                onChange={(e) =>
                  setNuevoAlmacen({ ...nuevoAlmacen, nombre: e.target.value })
                }
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Ubicación</label>
              <input
                type="text"
                className="form-control"
                value={nuevoAlmacen.ubicacion}
                onChange={(e) =>
                  setNuevoAlmacen({
                    ...nuevoAlmacen,
                    ubicacion: e.target.value,
                  })
                }
              />
            </div>
            <div className="mb-3">
              <label>Seleccionar ubicación en el mapa</label>
              <MapContainer
                center={[
                  nuevoAlmacen.latitud || -17.7833,
                  nuevoAlmacen.longitud || -63.1821,
                ]}
                zoom={12}
                style={{ height: "400px", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
                {nuevoAlmacen.latitud && nuevoAlmacen.longitud && (
                  <Marker
                    position={[nuevoAlmacen.latitud, nuevoAlmacen.longitud]}
                  />
                )}
              </MapContainer>
              {nuevoAlmacen.latitud && nuevoAlmacen.longitud && (
                <p>
                  Latitud: {nuevoAlmacen.latitud}, Longitud:{" "}
                  {nuevoAlmacen.longitud}
                </p>
              )}
            </div>
            <div className="d-flex justify-content-between">
              <button
                className="btn btn-success"
                onClick={handleGuardarEdicion}
              >
                Guardar
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setAlmacenEditando(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
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

export default Almacenes;
