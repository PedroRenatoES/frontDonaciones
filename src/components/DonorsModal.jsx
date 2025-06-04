import React, { useEffect, useRef, useState } from 'react';
import axios from '../axios';
import '../styles/Inventory.css';

function DonorsModal({ articuloId, articuloNombre, isOpen, onClose }) {
  const [donantes, setDonantes] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchDonantes = async () => {
      if (!isOpen || !articuloId) return;

      try {
        const res = await axios.get(`/donaciones-en-especie/donantes-por-articulo/${articuloId}`);
        setDonantes(res.data);
      } catch (error) {
        console.error('Error al obtener los donantes:', error);
      }
    };

    fetchDonantes();
  }, [isOpen, articuloId]);

  // Cierra el modal si haces clic fuera del contenido
  useEffect(() => {
    const manejarClickFuera = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', manejarClickFuera);
    }

    return () => {
      document.removeEventListener('mousedown', manejarClickFuera);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="articulo-modal-content" ref={modalRef}>
        <h3 className='articulo-title'>Donantes del artículo: {articuloNombre}</h3>
        <table className="donors-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cantidad Donada</th>
              <th>Cantidad Restante</th>
            </tr>
          </thead>
          <tbody>
            {donantes.map((donante, idx) => (
              <tr key={idx}>
                <td>{`${donante.nombres} ${donante.apellido_paterno} ${donante.apellido_materno}`}</td>
                <td>{donante.cantidad}</td>
                <td>{donante.cantidad_restante}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DonorsModal;
