import React, { useEffect, useState } from 'react';
import axios from '../axios';
import '../styles/Dashboard.css';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, LabelList } from 'recharts';

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
  const [donacionesEspeciePorPunto, setDonacionesEspeciePorPunto] = useState([]);

  const colores = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];


  useEffect(() => {
    axios.get('dashboard/total-donaciones')
      .then(res => setTotalDonaciones(res.data.total));

    axios.get('dashboard/donantes-activos')
      .then(res => setDonantesActivos(res.data.activos));

    axios.get('dashboard/donaciones-por-mes/2025') // Cambia el año si es necesario
      .then(res => setDonacionesPorMes(res.data));

    axios.get('dashboard/tipo-donaciones')
      .then(res => setTipoDonaciones(res.data));

    axios.get('dashboard/actividad-reciente')
      .then(res => setActividadReciente(res.data));

    axios.get('dashboard/donaciones/por-punto')
      .then(res => setDonacionesPorPunto(res.data));

    axios.get('dashboard/donaciones/por-punto-dinero')
      .then(res => setDonacionesDineroPorPunto(res.data));

    axios.get('dashboard/donaciones/por-punto-especie')
      .then(res => setDonacionesEspeciePorPunto(res.data));


 const fetchData = async () => {
      try {
        const [actividad, donantesRes, campanasRes] = await Promise.all([
          axios.get('/dashboard/actividad-reciente'),
          axios.get('/donantes'),
          axios.get('/campanas'),
        ]);

        setActividadReciente(actividad.data);
        setDonantes(donantesRes.data);
        setCampanas(campanasRes.data);
      } catch (error) {
        console.error('Error al cargar la actividad reciente:', error);
      }
    };

    fetchData();
  }, []);

  const getNombreDonante = (id) => {
    const donante = donantes.find((d) => d.id_donante === id);
    return donante ? donante.nombres : 'Desconocido';
  };

  const getNombreCampana = (id) => {
    const campana = campanas.find((c) => c.id_campana === id);
    return campana ? campana.nombre_campana : 'Desconocido';
  };

  const abrirModal = (donacion) => {
    console.log('Donación seleccionada:', donacion);
    setDonacionSeleccionada(donacion);
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setDonacionSeleccionada(null);
  };

return (
  <div className="dashboard-container">
    <h2 className="dashboard-title">Estadísticas de Donaciones</h2>

    {/* Resumen */}
    <div className="summary-cards">
      <div className="card">
        <h4>Total de Donaciones</h4>
        <p>{totalDonaciones}</p>
      </div>
      <div className="card">
        <h4>Donantes Activos</h4>
        <p>{donantesActivos}</p>
      </div>
    </div>

    {/* Donaciones por mes y tipo */}
    <div className="graph-section">
      <div className="graph-box" style={{ flex: 2 }}>
        <h4>Donaciones por Mes (2025)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={donacionesPorMes.map(d => ({ mes: `Mes ${d.mes}`, cantidad: d.cantidad }))}>
            <XAxis dataKey="mes" tick={{ fill: '#555', fontSize: 12 }} />
            <YAxis tick={{ fill: '#555', fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '14px' }}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}
            />
            <Bar dataKey="cantidad" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
              <LabelList dataKey="cantidad" position="top" fill="#333" fontSize={12} />
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
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            >
              {tipoDonaciones.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', fontSize: '14px' }}
            />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Donaciones por punto */}
    <div className="graph-section">
      <div className="graph-box" style={{ flex: 1 }}>
        <h4>Donaciones por Punto de Recolección</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={donacionesPorPunto}>
            <XAxis type="number" tick={{ fontSize: 12 }} />
            <YAxis dataKey="nombre_punto" type="category" tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="cantidad_donaciones" fill="#10B981" barSize={20} radius={[0, 8, 8, 0]}>
              <LabelList dataKey="cantidad_donaciones" position="right" fill="#333" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

      </div>
    </div>

    {/* Dinero vs especie */}
    <div className="graph-section">
      <div className="graph-box" style={{ flex: 1 }}>
        <h4>Donaciones en Dinero por Punto de Recolección</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={donacionesDineroPorPunto}>
            <XAxis dataKey="nombre_punto" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis  tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '14px' }}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}/>
            <Bar dataKey="cantidad_donaciones_dinero" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
              <LabelList dataKey="cantidad_donaciones_dinero" position="top" fill="#333" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-box" style={{ flex: 1 }}>
        <h4>Donaciones en Especie por Punto de Recolección</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={donacionesEspeciePorPunto}>
            <XAxis dataKey="nombre_punto" tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip               
              contentStyle={{ backgroundColor: '#f9f9f9', border: '1px solid #ccc', fontSize: '14px' }}
              labelStyle={{ color: '#333', fontWeight: 'bold' }}/>
            <Bar dataKey="cantidad_donaciones_especie" fill="#6366F1" radius={[8, 8, 0, 0]} barSize={40}>
              <LabelList dataKey="cantidad_donaciones_especie" position="top" fill="#333" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Tabla de actividad */}
    <div className="table-section">
      <h4>Actividad Reciente</h4>
      <table className="activity-table">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {actividadReciente.map((donacion) => (
            <tr key={donacion.id_donacion} onClick={() => abrirModal(donacion)} style={{ cursor: 'pointer' }}>
              <td>{donacion.tipo_donacion}</td>
              <td>{new Date(donacion.fecha_donacion).toLocaleDateString()}</td>
              <td>
                <span className={`estado-badge ${donacion.estado_validacion}`}>
                  {donacion.estado_validacion}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Modal de detalles */}
    {modalOpen && donacionSeleccionada && (
  <div className="custom-modal-backdrop" onClick={cerrarModal}>
    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
      <h3>Detalles de la Donación #{donacionSeleccionada.id_donacion}</h3>
      <p><strong>Tipo:</strong> {donacionSeleccionada.tipo_donacion}</p>
      <p><strong>Fecha:</strong> {new Date(donacionSeleccionada.fecha_donacion).toLocaleDateString()}</p>
      <p><strong>Estado:</strong> {donacionSeleccionada.estado_validacion}</p>
      <p><strong>Donante:</strong> {getNombreDonante(donacionSeleccionada.id_donante)}</p>
      <p><strong>Campaña:</strong> {getNombreCampana(donacionSeleccionada.id_campana)}</p>
    </div>
  </div>
 )}

  </div>

  
);

}

export default Dashboard;