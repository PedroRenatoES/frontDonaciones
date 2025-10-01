import React, { useEffect, useState } from "react";
import axios from "../axios";
import "../styles/Dashboard.css";
import "../styles/WelcomePage.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";

const Dashboard = () => {
  const [totalDonaciones, setTotalDonaciones] = useState(0);
  const [donantesActivos, setDonantesActivos] = useState(0);
  const [donacionesPorMes, setDonacionesPorMes] = useState([]);
  const [tipoDonaciones, setTipoDonaciones] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [donantes, setDonantes] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [donacionSeleccionada, setDonacionSeleccionada] = useState(null);
  const [donacionesPorPunto, setDonacionesPorPunto] = useState([]);
  const [donacionesDineroPorPunto, setDonacionesDineroPorPunto] = useState([]);
  const [donacionesEspeciePorPunto, setDonacionesEspeciePorPunto] = useState(
    []
  );

  // Estados para las estadísticas de bienvenida
  const [donantesCount, setDonantesCount] = useState(0);
  const [donacionesCount, setDonacionesCount] = useState(0);
  const [inventarioCount, setInventarioCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);

  // Estado para el filtro de actividad
  const [filtroActividad, setFiltroActividad] = useState("todas");

  const colores = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

  useEffect(() => {
    // Cargar estadísticas principales del dashboard
    axios
      .get("dashboard/total-donaciones")
      .then((res) => setTotalDonaciones(res.data.total));

    axios
      .get("dashboard/donantes-activos")
      .then((res) => setDonantesActivos(res.data.activos));

    axios
      .get("dashboard/donaciones-por-mes/2025") // Cambia el año si es necesario
      .then((res) => setDonacionesPorMes(res.data));

    axios
      .get("dashboard/tipo-donaciones")
      .then((res) => setTipoDonaciones(res.data));

    axios
      .get("dashboard/actividad-reciente")
      .then((res) => setActividadReciente(res.data));

    axios
      .get("dashboard/donaciones/por-punto")
      .then((res) => setDonacionesPorPunto(res.data));

    axios
      .get("dashboard/donaciones/por-punto-dinero")
      .then((res) => setDonacionesDineroPorPunto(res.data));

    axios
      .get("dashboard/donaciones/por-punto-especie")
      .then((res) => setDonacionesEspeciePorPunto(res.data));

    // Cargar estadísticas de bienvenida
    axios
      .get("/donantes")
      .then((response) => setDonantesCount(response.data.length))
      .catch((error) => console.error("Error fetching donantes:", error));

    axios
      .get("/donaciones")
      .then((response) => setDonacionesCount(response.data.length))
      .catch((error) => console.error("Error fetching donaciones:", error));

    axios
      .get("/donaciones-en-especie")
      .then((response) => setInventarioCount(response.data.length))
      .catch((error) => console.error("Error fetching inventario:", error));

    // Cargar notificaciones
    const fetchNotificaciones = async () => {
      try {
        const nombreAlmacenLS = localStorage.getItem('almacen');

        if (!nombreAlmacenLS) {
          console.error('No se encontró el nombre del almacén en localStorage.');
          return;
        }

        const almacenUsuario = await axios.get(`/almacenes?nombre=${nombreAlmacenLS}`);

        if (!almacenUsuario.data || almacenUsuario.data.length === 0) {
          console.error('No se encontró un almacén que coincida con el nombre almacenado.');
          return;
        }

        const idAlmacen = almacenUsuario.data[0].id_almacen;

        const response = await axios.get(`https://donacionesbackendpsiii.onrender.com/api/inventario/ubicaciones?idAlmacen=${idAlmacen}`);
        const inventario = response.data;
        const bajoStock = inventario.filter(item => item.cantidad_total < 20);

        const notifs = bajoStock.map((item) => {
          const ubicacion = item.ubicaciones?.[0];
          const ubicacionTexto = ubicacion
            ? `Ubicación: ${ubicacion.almacen}, ${ubicacion.estante}, espacio ${ubicacion.espacio}`
            : 'Ubicación desconocida';

          return {
            id: `stock-${item.id_articulo}`,
            titulo: 'Alerta de bajo stock',
            descripcion: `${item.nombre_articulo} tiene bajo stock (Total: ${item.cantidad_total}). ${ubicacionTexto}`,
            nivelSeveridad: 'Alta',
            fechaCreacion: new Date().toISOString(),
          };
        });

        setNotificaciones(notifs);
      } catch (err) {
        console.error('Error obteniendo inventario:', err);
      }
    };

    fetchNotificaciones();

    const fetchData = async () => {
      try {
        const [actividad, donantesRes, campanasRes] = await Promise.all([
          axios.get("/dashboard/actividad-reciente"),
          axios.get("/donantes"),
          axios.get("/campanas"),
        ]);

        setActividadReciente(actividad.data);
        setDonantes(donantesRes.data);
        setCampanas(campanasRes.data);
      } catch (error) {
        console.error("Error al cargar la actividad reciente:", error);
      }
    };

    fetchData();
  }, []);

  const getNombreDonante = (id) => {
    const donante = donantes.find((d) => d.id_donante === id);
    return donante ? donante.nombres : "Desconocido";
  };

  const getNombreCampana = (id) => {
    const campana = campanas.find((c) => c.id_campana === id);
    return campana ? campana.nombre_campana : "Desconocido";
  };

  const abrirModal = (donacion) => {
    console.log("Donación seleccionada:", donacion);
    setDonacionSeleccionada(donacion);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setDonacionSeleccionada(null);
  };

  // Función para filtrar la actividad reciente
  const actividadFiltrada = actividadReciente.filter((donacion) => {
    if (filtroActividad === "todas") return true;
    return donacion.tipo_donacion.toLowerCase() === filtroActividad;
  });

  return (
    <div className="dashboard-container">
      {/* Welcome Message */}
      <div className="welcome-header-section">
        <div className="welcome-header-card">
          <div className="welcome-info">
            <h1>¡Bienvenido!</h1>
            <p>Gestiona las donaciones y el inventario de manera eficiente</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards Section */}
      <div className="welcome-stats-section">
        <div className="welcome-cards">
          <div className="welcome-card">
            <h2
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              DONACIONES
            </h2>
            <div
              className="contador"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <p>Total de donaciones recibidas:</p>
              <h2>{donacionesCount}</h2>
            </div>
          </div>
          <div className="welcome-card">
            <h2
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              INVENTARIO
            </h2>
            <div
              className="contador"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <p>Artículos en inventario:</p>
              <h2>{inventarioCount}</h2>
            </div>
          </div>
          <div className="welcome-card">
            <h2
              style={{
                fontSize: "30px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              DONANTES
            </h2>
            <div
              className="contador"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "20px",
              }}
            >
              <p>Donantes registrados:</p>
              <h2>{donantesCount}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="summary-cards">
        <div className="summary-card">
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            TOTAL DONACIONES
          </h2>
          <div
            className="contador"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <p>Total de donaciones registradas:</p>
            <h2>{totalDonaciones}</h2>
          </div>
        </div>
        <div className="summary-card">
          <h2
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            DONANTES ACTIVOS
          </h2>
          <div
            className="contador"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
            }}
          >
            <p>Donantes activos en el sistema:</p>
            <h2>{donantesActivos}</h2>
          </div>
        </div>
      </div>

      {/* Sección de Gráficos */}
      <div className="dashboard-section">
        <h2 className="section-title">Análisis de Donaciones</h2>

        {/* Donaciones por mes y tipo */}
        <div className="graph-section">
          <div className="graph-box" style={{ flex: 2 }}>
            <h4>Donaciones por Mes (2025)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={donacionesPorMes.map((d) => ({
                  mes: `Mes ${d.mes}`,
                  cantidad: d.cantidad,
                }))}
              >
                <XAxis dataKey="mes" tick={{ fill: "#555", fontSize: 12 }} />
                <YAxis tick={{ fill: "#555", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                  labelStyle={{ color: "#333", fontWeight: "bold" }}
                />
                <Bar
                  dataKey="cantidad"
                  fill="#6366F1"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                >
                  <LabelList
                    dataKey="cantidad"
                    position="top"
                    fill="#333"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="graph-box" style={{ flex: 1 }}>
            <h4>Tipos de Donaciones</h4>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tipoDonaciones}
                  dataKey="cantidad"
                  nameKey="tipo_donacion"
                  outerRadius={90}
                  innerRadius={40}
                  paddingAngle={5}
                  label={({ name, percent }) =>
                    `${name} (${(percent * 100).toFixed(0)}%)`
                  }
                >
                  {tipoDonaciones.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colores[index % colores.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        

        {/* Dinero vs especie */}
        <div className="graph-section">
          <div className="graph-box" style={{ flex: 1 }}>
            <h4>Donaciones en Dinero por Punto de Recolección</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donacionesDineroPorPunto}>
                <XAxis
                  dataKey="nombre_punto"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                  labelStyle={{ color: "#333", fontWeight: "bold" }}
                />
                <Bar
                  dataKey="cantidad_donaciones_dinero"
                  fill="#6366F1"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                >
                  <LabelList
                    dataKey="cantidad_donaciones_dinero"
                    position="top"
                    fill="#333"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="graph-box" style={{ flex: 1 }}>
            <h4>Donaciones en Especie por Punto de Recolección</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={donacionesEspeciePorPunto}>
                <XAxis
                  dataKey="nombre_punto"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#6b7280", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #ccc",
                    fontSize: "14px",
                  }}
                  labelStyle={{ color: "#333", fontWeight: "bold" }}
                />
                <Bar
                  dataKey="cantidad_donaciones_especie"
                  fill="#6366F1"
                  radius={[8, 8, 0, 0]}
                  barSize={40}
                >
                  <LabelList
                    dataKey="cantidad_donaciones_especie"
                    position="top"
                    fill="#333"
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sección de Actividad */}
      <div className="dashboard-section">
        <h2 className="section-title">Actividad Reciente</h2>

        {/* Filtro de Actividad */}

        <div className="table-section">
          <div className="activity-filter">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${
                  filtroActividad === "todas" ? "active" : ""
                }`}
                onClick={() => setFiltroActividad("todas")}
              >
                Todas
              </button>
              <button
                className={`filter-btn ${
                  filtroActividad === "dinero" ? "active" : ""
                }`}
                onClick={() => setFiltroActividad("dinero")}
              >
                Dinero
              </button>
              <button
                className={`filter-btn ${
                  filtroActividad === "especie" ? "active" : ""
                }`}
                onClick={() => setFiltroActividad("especie")}
              >
                Especie
              </button>
            </div>
            <div className="filter-info">
              <span>
                Mostrando {actividadFiltrada.length} de{" "}
                {actividadReciente.length} donaciones
              </span>
            </div>
          </div>

          <table className="activity-table" style={{ borderRadius: "0 0 16px 16px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "center" }}>Tipo</th>
                <th style={{ textAlign: "center" }}>Fecha</th>
                <th style={{ textAlign: "center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {actividadFiltrada.map((donacion) => (
                <tr
                  key={donacion.id_donacion}
                  onClick={() => abrirModal(donacion)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{donacion.tipo_donacion}</td>
                  <td>
                    {new Date(donacion.fecha_donacion).toLocaleDateString()}
                  </td>
                  <td>
                    <span
                      className={`estado-badge ${0}`}
                    >
                      Validado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {modalOpen && donacionSeleccionada && (
        <div className="custom-modal-backdrop" onClick={cerrarModal}>
          <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Detalles de la Donación #{donacionSeleccionada.id_donacion}</h3>
            <p>
              <strong>Tipo:</strong> {donacionSeleccionada.tipo_donacion}
            </p>
            <p>
              <strong>Fecha:</strong>{" "}
              {new Date(
                donacionSeleccionada.fecha_donacion
              ).toLocaleDateString()}
            </p>
            <p>
              <strong>Estado:</strong> {donacionSeleccionada.estado_validacion}
            </p>
            <p>
              <strong>Donante:</strong>{" "}
              {getNombreDonante(donacionSeleccionada.id_donante)}
            </p>
            <p>
              <strong>Campaña:</strong>{" "}
              {getNombreCampana(donacionSeleccionada.id_campana)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
