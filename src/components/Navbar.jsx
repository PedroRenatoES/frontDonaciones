import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Navbar.css';

function Navbar({ usuario, onLogout }) {
  const [mostrarMenuUsuario, setMostrarMenuUsuario] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);

  // Función para traducir número de rol a texto
  const getRolNombre = (rol) => {
    switch (rol) {
      case 1: return 'Administrador';
      case 2: return 'Voluntario';
      case 3: return 'Almacenista';
      default: return 'Desconocido';
    }
  };

  const toggleMenuUsuario = () => {
    setMostrarMenuUsuario(!mostrarMenuUsuario);
    // Cerrar notificaciones si está abierto
    if (mostrarNotificaciones) {
      setMostrarNotificaciones(false);
    }
  };

  const handleLogout = () => {
    setMostrarMenuUsuario(false);
    if (onLogout) {
      onLogout();
    }
  };

  const toggleNotificaciones = () => {
    setMostrarNotificaciones(!mostrarNotificaciones);
    // Cerrar menú de usuario si está abierto
    if (mostrarMenuUsuario) {
      setMostrarMenuUsuario(false);
    }
  };

  // Cargar notificaciones (misma lógica que WelcomePage)
  useEffect(() => {
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

        const response = await axios.get(`http://localhost:5000/api/inventario/ubicaciones?idAlmacen=${idAlmacen}`);
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
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Título */}
        <div className="navbar-brand">
          <h1>ALAS CHIQUITANAS</h1>
        </div>

        {/* Botón de Usuario */}
        <div className="navbar-user">
          {/* Botón de Notificaciones */}
          <button 
            className="notifications-button" 
            onClick={toggleNotificaciones}
            aria-label="Notificaciones"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6981 21.5547 10.4458 21.3031 10.27 21" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            {notificaciones.length > 0 && (
              <span className="notification-badge">{notificaciones.length}</span>
            )}
          </button>

          <button 
            className="user-button" 
            onClick={toggleMenuUsuario}
            aria-label="Menú de usuario"
          >
            <div className="user-avatar">
              <img src="user.png" alt="Usuario" />
            </div>
            <div className="user-info">
              <span className="user-name">{usuario?.nombres || 'Usuario'}</span>
              <span className="user-role">{getRolNombre(usuario?.rol)}</span>
            </div>
            <div className="dropdown-arrow">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path 
                  d="M1 1.5L6 6.5L11 1.5" 
                  stroke="currentColor" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>

          {/* Menú Desplegable */}
          {mostrarMenuUsuario && (
            <div className="user-dropdown">
              <div className="dropdown-content">
                <div className="user-section">
                  <div className="user-avatar">
                    <img src="user.png" alt="Usuario" />
                  </div>
                  <div className="user-info">
                    <h4>{usuario?.nombres || 'Usuario'}</h4>
                    <p>CI: {usuario?.ci}</p>
                    <p>Rol: {getRolNombre(usuario?.rol)}</p>
                  </div>
                </div>
                <div className="logout-section">
                  <button 
                    className="logout-button" 
                    onClick={handleLogout}
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Dropdown de Notificaciones */}
          {mostrarNotificaciones && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notificaciones</h4>
                <span className="notification-count">{notificaciones.length}</span>
              </div>
              <div className="notifications-content">
                {notificaciones.length === 0 ? (
                  <div className="no-notifications">
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  notificaciones.map((notif) => (
                    <div key={notif.id} className="notification-item">
                      <div className="notification-content">
                        <h5>{notif.titulo}</h5>
                        <p>{notif.descripcion}</p>
                        <span className="notification-time">
                          {new Date(notif.fechaCreacion).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay para cerrar los menús al hacer clic fuera */}
      {(mostrarMenuUsuario || mostrarNotificaciones) && (
        <div 
          className="dropdown-overlay" 
          onClick={() => {
            setMostrarMenuUsuario(false);
            setMostrarNotificaciones(false);
          }}
        />
      )}
    </nav>
  );
}

export default Navbar;
