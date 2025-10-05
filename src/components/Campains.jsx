// Campains.jsx
import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Campains.css';
import CampanaCard from './CampanaCard';
import CampanaModal from './CampanaModal';

function Campains() {
  const [campanas, setCampanas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const fetchCampanas = async () => {
    try {
      const res = await axios.get('/campanas');
      setCampanas(res.data);
    } catch (err) {
      console.error('Error al obtener campañas:', err);
    }
  };

  useEffect(() => {
    fetchCampanas();
  }, []);

  // Función corregida para formatear fechas sin problemas de zona horaria
  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'N/A';
    
    // Extraer solo la parte de la fecha (YYYY-MM-DD) sin la hora
    const fechaStr = fechaISO.split('T')[0];
    const [year, month, day] = fechaStr.split('-').map(Number);
    
    // Crear fecha local (no UTC) para evitar problemas de zona horaria
    const fechaLocal = new Date(year, month - 1, day);
    
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).format(fechaLocal);
  };

  const filteredCampanas = campanas.filter(c =>
    c.nombre_campana.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="campains-container">
      <h1 className='campains-title'>Campañas y Donaciones</h1>
      <div className="campains-header">
        <input
          type="text"
          placeholder="Buscar campaña..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="campains-search"
          list="campanas-sugerencias"
        />
        <button className="add-campain-btn" onClick={() => setShowModal(true)}>
          + Agregar Campaña
        </button>
      </div>

      <datalist id="campanas-sugerencias">
        {campanas.map((c) => (
          <option key={c.id_campana} value={c.nombre_campana} />
        ))}
      </datalist>

      <div className="camp-container">
        {filteredCampanas.map(campana => (
          <CampanaCard
            key={`campana-${campana.id_campana}`}
            campana={campana}
            formatearFecha={formatearFecha}
            onCampanaUpdated={fetchCampanas}
          />
        ))}
      </div>

      <CampanaModal
        show={showModal}
        onClose={() => setShowModal(false)}
        onCreated={fetchCampanas}
      />
    </div>
  );
}

export default Campains;