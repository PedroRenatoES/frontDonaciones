import React, { useState } from 'react';
import '../styles/HelpRequestItem.css';
import DetallePaquete from './DetallePaquete';

const PackageItem = ({ paquete, donacionesEspecie, catalogoArticulos, onCompletarPaquete, esTareaAlmacen = false }) => {
  const [expandido, setExpandido] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detallesPaquete, setDetallesPaquete] = useState(null);

  // 🔥 FUNCIÓN PARA EXTRAER METADATOS
  const extraerMetadatos = (descripcion) => {
    if (!descripcion) return null;
    const match = descripcion.match(/SOL#([^|]+)\|ALMACEN:([^|]+)\|(.+)/);
    return match ? {
      codigo: match[1],
      almacen: match[2],
      descripcionOriginal: match[3]
    } : null;
  };

  const metadatos = extraerMetadatos(paquete.descripcion);

  const toggleExpandido = () => {
    const nuevoEstado = !expandido;
    setExpandido(nuevoEstado);
    if (nuevoEstado && !detallesPaquete) {
      cargarDetallesPaquete();
    }
  };

  const cargarDetallesPaquete = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/paquetes/${paquete.id_paquete}`);
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
    if (onCompletarPaquete) onCompletarPaquete(paquete.id_paquete);
  };

  return (
    <div className={`pedido-card ${esTareaAlmacen ? 'tarea-almacen' : ''}`}>
      <div className="pedido-header" onClick={toggleExpandido}>
        <strong>{paquete.nombre_paquete}</strong> 
        <span>
          {metadatos && (
            <span className="badge bg-info ms-2">
              SOL#{metadatos.codigo} - {metadatos.almacen}
            </span>
          )}
          {esTareaAlmacen && (
            <span className="badge bg-warning ms-2">🎯 Mi Tarea</span>
          )}
          <span className="ms-2">
            {new Date(paquete.fecha_creacion).toLocaleDateString()}
          </span>
        </span>
      </div>

      {expandido && (
        <div className="pedido-detalle">
          <p><strong>Descripción:</strong> {metadatos?.descripcionOriginal || paquete.descripcion}</p>
          
          {metadatos && (
            <>
              <p><strong>Solicitud:</strong> {metadatos.codigo}</p>
              <p><strong>Almacén asignado:</strong> {metadatos.almacen}</p>
            </>
          )}

          <p><strong>Artículos asignados al paquete:</strong></p>
          <ul>
            {detallesPaquete?.items?.length > 0 ? (
              // Agrupar y sumar por artículo usando cantidad_asignada
              Object.values(
                detallesPaquete.items.reduce((acc, item) => {
                  const key = item.nombre_articulo + '|' + (item.unidad || '');
                  if (!acc[key]) {
                    acc[key] = {
                      nombre_articulo: item.nombre_articulo,
                      cantidad: 0,
                      unidad: item.unidad || ''
                    };
                  }
                  acc[key].cantidad += Number(item.cantidad_asignada);
                  return acc;
                }, {})
              ).map((art, idx) => (
                <li key={art.nombre_articulo + art.unidad}>
                  Artículo: {art.nombre_articulo} — Cantidad: {art.cantidad} {art.unidad}
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
              productos={
                // Agrupar productos por nombre_articulo y unidad, sumando cantidad_asignada
                Object.values(
                  detallesPaquete.items.reduce((acc, item) => {
                    const key = item.nombre_articulo + '|' + (item.unidad || '');
                    if (!acc[key]) {
                      acc[key] = {
                        nombre_articulo: item.nombre_articulo,
                        cantidad: 0,
                        unidad: item.unidad || ''
                      };
                    }
                    acc[key].cantidad += Number(item.cantidad_asignada);
                    return acc;
                  }, {})
                )
              }
              volver={handleCerrarFormulario}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default PackageItem;