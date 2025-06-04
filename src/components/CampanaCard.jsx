import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Campains.css';

function CampanaCard({ campana, formatearFecha }) {
  const [showDetails, setShowDetails] = useState(false);
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const defaultImage = 'banner.jpg';
  
  useEffect(() => {
    if (!showDetails) return;

    // Cargar donaciones en dinero
    axios.get(`https://backenddonaciones.onrender.com/api/donaciones-en-dinero/por-campana/${campana.id_campana}`)
      .then(res => setDonacionesDinero(res.data))
      .catch(err => console.error(err));

    // Cargar donaciones en especie
    axios.get(`https://backenddonaciones.onrender.com/api/donaciones-en-especie/por-campana/${campana.id_campana}`)
      .then(res => setDonacionesEspecie(res.data))
      .catch(err => console.error(err));
  }, [showDetails, campana.id_campana]);

  return (
<div className="camp-card">
<img
  src={campana.imagen_url || defaultImage}
  alt="Imagen de campaña"
  className="camp-card-img"
/>


  <div className="camp-card-content">
    <h2 className="camp-card-title">{campana.nombre_campana}</h2>
    <p><strong>Organizador:</strong> {campana.organizador}</p>
    <p>
      <strong>Fecha:</strong> {formatearFecha(campana.fecha_inicio)} - {formatearFecha(campana.fecha_fin)}
    </p>

    <button className="camp-card-btn" onClick={() => setShowDetails(!showDetails)}>
      {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
    </button>

    {showDetails && (
      <>
        <p>{campana.descripcion}</p>

        {donacionesDinero.length > 0 && (
          <div className="donaciones-section">
            <h3>Donaciones en Dinero</h3>
            <table className="campain-table">
              <thead>
                <tr>
                  <th>Monto</th>
                  <th>Divisa</th>
                  <th>Cuenta</th>
                  <th>Número</th>
                  <th>Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {donacionesDinero.map((d) => (
                  <tr key={d.id_donacion}>
                    <td>{d.monto}</td>
                    <td>{d.divisa}</td>
                    <td>{d.nombre_cuenta}</td>
                    <td>{d.numero_cuenta}</td>
                    <td><a href={d.comprobante_url} target="_blank" rel="noreferrer">Ver</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {donacionesEspecie.length > 0 && (
          <div className="donaciones-section">
            <h3>Donaciones en Especie</h3>
            <table className="campain-table">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th>Espacio</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Unidad</th>
                </tr>
              </thead>
              <tbody>
                {donacionesEspecie.map((d) => (
                  <tr key={d.id_donacion}>
                    <td>{d.nombre_articulo}</td>
                    <td>{d.id_espacio}</td>
                    <td>{d.cantidad}</td>
                    <td>{d.estado_articulo}</td>
                    <td>{d.simbolo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    )}
  </div>
</div>

  );
}

export default CampanaCard;
