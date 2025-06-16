import React, { useState } from 'react';
import '../styles/HelpRequestItem.css';
import DetallePaquete from './DetallePaquete';

const PackageItem = ({ paquete, donacionesEspecie, catalogoArticulos, onCompletarPaquete }) => {
  const [expandido, setExpandido] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detallesPaquete, setDetallesPaquete] = useState(null);

  const toggleExpandido = () => {
    const nuevoEstado = !expandido;
    setExpandido(nuevoEstado);
    if (nuevoEstado && !detallesPaquete) {
      cargarDetallesPaquete();
    }
  };

  const cargarDetallesPaquete = async () => {
    try {
      const res = await fetch(`https://backenddonaciones.onrender.com/api/paquetes/${paquete.id_paquete}`);
      if (!res.ok) throw new Error('Error al obtener detalles del paquete');
      const data = await res.json();
      setDetallesPaquete(data);
    } catch (error) {
      console.error('Error cargando detalles del paquete:', error);
    }
  };

  const handleAbrirFormulario = () => {
    setMostrarFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    onCompletarPaquete(paquete.id_paquete); // Esto lo elimina de la lista
  };

  return (
    <div className="pedido-card">
      <div className="pedido-header" onClick={toggleExpandido}>
        <strong>{paquete.nombre_paquete}</strong> — {new Date(paquete.fecha_creacion).toLocaleDateString()}
      </div>

      {expandido && (
        <div className="pedido-detalle">
          <p><strong>Descripción:</strong> {paquete.descripcion}</p>

          <p><strong>Donaciones:</strong></p>
          <ul>
            {detallesPaquete?.items?.length > 0 ? (
              detallesPaquete.items.map((item, idx) => (
                <li key={idx}>
                  Artículo: {item.nombre_articulo} — Cantidad: {item.cantidad} {item.unidad}
                </li>
              ))
            ) : (
              <li>No hay artículos en este paquete.</li>
            )}
          </ul>

          {!mostrarFormulario ? (
            <button
              className="btn btn-outline-primary mt-3"
              onClick={handleAbrirFormulario}
            >
              Crear Cargamento
            </button>
          ) : (
          <DetallePaquete
            paquete={paquete}
            productos={detallesPaquete.items}
            volver={handleCerrarFormulario}
          />

          )}
        </div>
      )}
    </div>
  );
};

export default PackageItem;
