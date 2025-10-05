import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/WelcomePage.css';
import MetricasWebSocketListener from './MetricasWebSocketListener';

function WelcomePage({ onLogout }) {
  const [donantesCount, setDonantesCount] = useState(0);
  const [donacionesCount, setDonacionesCount] = useState(0);
  const [inventarioCount, setInventarioCount] = useState(0);
  const [usuario, setUsuario] = useState({});
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarModalCambio, setMostrarModalCambio] = useState(false);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [errorCambio, setErrorCambio] = useState('');
  const [cambiarPassword, setCambiarPassword] = useState(false);

  useEffect(() => {
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
    if (usuarioGuardado) {
      setUsuario(usuarioGuardado);
    }

    const cambiarPassFlag = localStorage.getItem('cambiarPassword');
    if (cambiarPassFlag === 'true') {
      setCambiarPassword(true);
      setMostrarModalCambio(true);
    }

    // Cargar métricas solo una vez
    axios.get('/donantes')
      .then(response => setDonantesCount(response.data.length))
      .catch(error => console.error('Error fetching donantes:', error));

    axios.get('/donaciones')
      .then(response => setDonacionesCount(response.data.length))
      .catch(error => console.error('Error fetching donaciones:', error));

    axios.get('/donaciones-en-especie')
      .then(response => setInventarioCount(response.data.length))
      .catch(error => console.error('Error fetching inventario:', error));
  }, []);

useEffect(() => {
  axios.get('http://localhost:5000/api/inventario/ubicaciones')
    .then(response => {
      const inventario = response.data;
      console.log('Datos de inventario:', inventario); // ✅ Verifica si la API devuelve datos

      // TEMPORAL: filtrar artículos con menos de 200 para pruebas
      const bajoStock = inventario.filter(item => item.cantidad_total < 20);
      console.log('Artículos bajo stock:', bajoStock); // ✅ Verifica si hay artículos bajo el umbral

      const notifs = bajoStock.map((item) => {
        const ubicacion = item.ubicaciones?.[0];
        const ubicacionTexto = ubicacion
          ? `Ubicación: ${ubicacion.almacen}, ${ubicacion.estante}, espacio ${ubicacion.espacio}`
          : 'Ubicación desconocida';

        console.log('Generando notificación para:', item); // ✅ Verifica el mapeo

        return {
          id: `stock-${item.id_articulo}`,
          titulo: 'Alerta de bajo stock',
          descripcion: `${item.nombre_articulo} tiene bajo stock (Total: ${item.cantidad_total}). ${ubicacionTexto}`,
          nivelSeveridad: 'Alta',
          fechaCreacion: new Date().toISOString(),
        };
      });

      setNotificaciones((prev) => {
        const idsExistentes = new Set(prev.map(n => n.id));
        const nuevas = notifs.filter(n => !idsExistentes.has(n.id));
        const actualizadas = [...nuevas, ...prev];
        console.log('Notificaciones actualizadas:', actualizadas); // ✅ Confirma el estado final
        return actualizadas;
      });
    })
    .catch(err => console.error('Error obteniendo inventario:', err));
}, []);
  // Para manejar notificaciones
  const manejarNuevaNotificacion = (mensaje) => {
    const timestamp = new Date().toISOString();
    const nuevaNotificacion = typeof mensaje === 'string'
      ? {
          id: Date.now(),
          titulo: 'Notificación',
          descripcion: mensaje,
          nivelSeveridad: 'Media',
          fechaCreacion: timestamp,
        }
      : {
          ...mensaje,
          id: mensaje.id || Date.now(),
          fechaCreacion: mensaje.fechaCreacion || timestamp,
        };
  
    setNotificaciones((prev) => [nuevaNotificacion, ...prev]);
  };

  // Cambiar contraseña
  const handleCambioPassword = async () => {
    setErrorCambio('');
    if (nuevaPassword.length < 6) {
      setErrorCambio('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      await axios.put(`/users/${usuario.id}/password`, { newPassword: nuevaPassword });
      
      alert('Contraseña cambiada correctamente, ya puedes continuar.');
      setMostrarModalCambio(false);
      setCambiarPassword(false);
      localStorage.setItem('cambiarPassword', 'false');
      setNuevaPassword('');
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      setErrorCambio('No se pudo cambiar la contraseña. Intente nuevamente.');
    }
  };

  // Volver a login (logout)
  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout(); // Si tienes callback para logout que te lleve al login
    else window.location.href = '/login'; // O redirige directamente
  };

  // Función para traducir número de rol a texto
  const getRolNombre = (rol) => {
    switch (rol) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      default: return 'Desconocido';
    }
  };
  console.log('Notificaciones en render:', notificaciones);


  return (
    <div className="welcome-container">
      <MetricasWebSocketListener onNuevaNotificacion={manejarNuevaNotificacion} />

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
            <h2 style={{fontSize: '30px', fontWeight: 'bold', marginBottom: '10px'}}>DONACIONES</h2>
            <div className="contador" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px'}}>
              <p>Total de donaciones recibidas:</p>
              <h2>{donacionesCount}</h2>
            </div>
          </div>
          <div className="welcome-card">
            <h2 style={{fontSize: '30px', fontWeight: 'bold', marginBottom: '10px'}}>INVENTARIO</h2>
            <div className="contador" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px'}}>
              <p>Artículos en inventario:</p>
              <h2>{inventarioCount}</h2>
            </div>
            
          </div>
          <div className="welcome-card">
            <h2 style={{fontSize: '30px', fontWeight: 'bold', marginBottom: '10px'}}>DONANTES</h2>
            <div className="contador" style={{display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px'}}>
              <p>Donantes registrados:</p>
              <h2>{donantesCount}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="notificaciones-container">
        <h3>Notificaciones recientes</h3>
        <div className="notificaciones-scroll">
          {notificaciones.length === 0 && (
            <div className="no-notifications">
              <p>No hay notificaciones</p>
            </div>
          )}
          {notificaciones.map((notif) => {
            const claseSeveridad = notif.nivelSeveridad
              ? `severidad-${notif.nivelSeveridad.toLowerCase()}`
              : '';
            return (
              <div
                key={notif.id || notif.hora}
                className={`notificacion-card ${claseSeveridad}`}
              >
                <div className="notificacion-content">
                  <h4>{notif.titulo || 'Notificación'}</h4>
                  <p>{notif.descripcion || notif.mensaje}</p>
                  <span className="notificacion-timestamp">
                    {notif.fechaCreacion
                      ? new Date(notif.fechaCreacion).toLocaleString()
                      : notif.hora}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para cambio obligatorio de contraseña */}
      {mostrarModalCambio && (
        <div className="modal-backdrop">
          <div className="modal-cambio-password">
            <h2>Cambio obligatorio de contraseña</h2>
            <p>Debes cambiar tu contraseña antes de continuar.</p>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaPassword}
              onChange={(e) => setNuevaPassword(e.target.value)}
            />
            {errorCambio && <p className="error">{errorCambio}</p>}
            <button onClick={handleCambioPassword}>Cambiar Contraseña</button>
            <button onClick={handleLogout} className="btn-secondary">Volver al Login</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomePage;
