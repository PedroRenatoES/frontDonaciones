import React, { useEffect, useState, useRef } from 'react';
import axios from '../axios';
import '../styles/Inventory.css'; // Puedes reutilizar el mismo CSS

function MoneyDonorsModal({ isOpen, onClose }) {
  const [donaciones, setDonaciones] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    const fetchDonaciones = async () => {
      if (!isOpen) return;
      try {
        const res = await axios.get('/donaciones-en-dinero');
        setDonaciones(res.data);
      } catch (error) {
        console.error('Error al obtener donaciones en dinero:', error);
      }
    };

    fetchDonaciones();
  }, [isOpen]);

  // Cierre al hacer clic fuera del contenido
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
        <h3 className="articulo-title">Donantes</h3>
        <table className="donors-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Monto Donado</th>
            </tr>
          </thead>
          <tbody>
            {donaciones.map((don, idx) => (
              <tr key={idx}>
                <td>{`${don.nombres} ${don.apellido_paterno} ${don.apellido_materno}`}</td>
                <td>{`${don.monto} ${don.divisa}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MoneyDonorsModal;
