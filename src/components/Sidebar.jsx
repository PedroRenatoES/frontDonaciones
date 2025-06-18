import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import Login from './Login';
import axios from '../App';
import '../styles/Sidebar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faChartBar, faBox, faPlus, faUser, faUsers, faTruck, faHistory, faBullhorn, faWarehouse, faHandsHelping, faTruckFast } from '@fortawesome/free-solid-svg-icons';


function Sidebar({ onLogout }) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const esAdmin = usuario?.rol === 1;
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const confirmarLogout = () => {
    setMostrarConfirmacion(false);
    onLogout(); // Llama a App.jsx para manejar el logout completo
  };

  return (
    <div className="sidebar">
      <div className="logo">
        <h2>ALAS CHIQUITANAS</h2>
      </div>
      <nav>
  <ul className="sidebar-options">
    <li className="card-option">
  <NavLink to="/welcome"><FontAwesomeIcon icon={faHome} /> Inicio</NavLink>
</li>
<li className="card-option">
  <NavLink to="/dashboard"><FontAwesomeIcon icon={faChartBar} /> Estadísticas</NavLink>
</li>
<li className="card-option">
  <NavLink to="/inventory"><FontAwesomeIcon icon={faBox} /> Inventario</NavLink>
</li>
<li className="card-option">
  <NavLink to="/add-donation"><FontAwesomeIcon icon={faPlus} /> Agregar</NavLink>
</li>
<li className="card-option">
  <NavLink to="/donors"><FontAwesomeIcon icon={faUser} /> Donantes</NavLink>
</li>
{esAdmin && (
  <li className="card-option">
    <NavLink to="/users"><FontAwesomeIcon icon={faUsers} /> Usuarios</NavLink>
  </li>
)}

<li className="card-option">
  <NavLink to="/history"><FontAwesomeIcon icon={faHistory} /> Historial</NavLink>
</li>
<li className="card-option">
  <NavLink to="/campains"><FontAwesomeIcon icon={faBullhorn} /> Campañas</NavLink>
</li>
<li className="card-option">
  <NavLink to="/almacenes"><FontAwesomeIcon icon={faWarehouse} /> Almacenes</NavLink>
</li>
<li className="card-option">
  <NavLink to="/help-request"><FontAwesomeIcon icon={faTruck} /> Solicitudes</NavLink>
</li>
<li className="card-option">
  <NavLink to="/salidas"><FontAwesomeIcon icon={faTruckFast} /> Salidas</NavLink>
</li>


  </ul>
</nav>


      <div className="logout-section">
              <button className="logout-button" onClick={() => setMostrarConfirmacion(true)}>
                Cerrar Sesión
              </button>
            </div>

            {mostrarConfirmacion && (
              <div className="logout-modal">
                <div className="logout-modal-content">
                  <p>¿Estás seguro de que deseas cerrar sesión?</p>
                  <div className="logout-modal-buttons">
                    <button onClick={confirmarLogout}>Sí</button>
                    <button onClick={() => setMostrarConfirmacion(false)}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            <div className="sidebar-footer">
              <span>Sistema de Donaciones v1.0</span>
            </div>
          </div>
        );
      }

export default Sidebar;
