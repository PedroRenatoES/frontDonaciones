import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import '../styles/HelpRequestItem.css';
import DetallePaquete from './DetallePaquete';

const PackageItem = ({ paquete, donacionesEspecie, catalogoArticulos, onCompletarPaquete, esTareaAlmacen = false }) => {
  const [expandido, setExpandido] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [detallesPaquete, setDetallesPaquete] = useState(null);

  // 🔥 FUNCIÓN MEJORADA PARA EXTRAER METADATOS
  const extraerMetadatos = (descripcion) => {
    if (!descripcion) return null;
    
    // Patrón para extraer todos los campos: CI, SOL#, IDALMACEN, ALMACEN
    const match = descripcion.match(/CI:([^|]+)\|SOL#([^|]+)\|IDALMACEN:([^|]+)\|ALMACEN:([^|]+)\|?(.*)/);
    
    if (match) {
      return {
        ci: match[1],
        codigo: match[2],
        idAlmacen: match[3],
        almacen: match[4],
        descripcionOriginal: match[5] || ''
      };
    }
    
    // Fallback para el formato anterior
    const fallbackMatch = descripcion.match(/SOL#([^|]+)\|ALMACEN:([^|]+)\|(.+)/);
    return fallbackMatch ? {
      codigo: fallbackMatch[1],
      almacen: fallbackMatch[2],
      descripcionOriginal: fallbackMatch[3]
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
      console.log('📦 Datos del paquete recibidos:', data);
      console.log('📦 Items del paquete:', data.items);
      setDetallesPaquete(data);
    } catch (error) {
      console.error('Error cargando detalles del paquete:', error);
    }
  };

  const handleAbrirFormulario = () => {
    console.log('🚀 Abriendo formulario, mostrarFormulario:', mostrarFormulario);
    setMostrarFormulario(true);
    console.log('✅ Estado actualizado a true');
  };

  const handleCerrarFormulario = () => {
    setMostrarFormulario(false);
    if (onCompletarPaquete) onCompletarPaquete(paquete.id_paquete);
  };

  return (
    <>
      {console.log('🔍 PackageItem renderizando, mostrarFormulario:', mostrarFormulario)}
      <div className={`pedido-card ${esTareaAlmacen ? 'tarea-almacen' : ''} ${expandido ? 'expandido' : ''}`}>
      {/* Indicador de estado */}
      <div className="pedido-status-indicator"></div>
      
      {/* Header de la tarjeta */}
      <div className="pedido-header" onClick={toggleExpandido}>
        <div className="pedido-header-title">{paquete.nombre_paquete}</div>
        <div className="pedido-header-id">
          {metadatos && `SOL#${metadatos.codigo}`}
          {esTareaAlmacen && ' • Mi Tarea'}
          {` • ${new Date(paquete.fecha_creacion).toLocaleDateString()}`}
        </div>
      </div>

      <div className="pedido-detalle">
        {/* Información de descripción */}
        {/* <div className="pedido-ubicacion">
          <div className="pedido-ubicacion-text">
            <div className="pedido-ubicacion-label">Descripción</div>
            <div className="pedido-ubicacion-value">{metadatos?.descripcionOriginal || paquete.descripcion}</div>
          </div>
        </div> */}

        {/* Información de metadatos */}
        {metadatos && (
          <div className="pedido-articulos">
            <div className="pedido-articulos-title">Información de Solicitud</div>
            <div className="pedido-articulos-list">
              {metadatos.ci && (
                <div className="pedido-articulo-item">
                  <div className="pedido-articulo-nombre">CI del Solicitante</div>
                  <div className="pedido-articulo-cantidad">{metadatos.ci}</div>
                </div>
              )}
              <div className="pedido-articulo-item">
                <div className="pedido-articulo-nombre">Código de Solicitud</div>
                <div className="pedido-articulo-cantidad">{metadatos.codigo}</div>
              </div>
              {metadatos.idAlmacen && (
                <div className="pedido-articulo-item">
                  <div className="pedido-articulo-nombre">ID Almacén</div>
                  <div className="pedido-articulo-cantidad">{metadatos.idAlmacen}</div>
                </div>
              )}
              <div className="pedido-articulo-item">
                <div className="pedido-articulo-nombre">Almacén Asignado</div>
                <div className="pedido-articulo-cantidad">{metadatos.almacen}</div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de artículos del paquete */}
        <div className="pedido-articulos">
          <div className="pedido-articulos-title">Artículos del Paquete</div>
          <div className="pedido-articulos-list">
            {detallesPaquete?.items?.length > 0 ? (
              // Agrupar y sumar por artículo usando cantidad_asignada
              Object.values(
                detallesPaquete.items.reduce((acc, item) => {
                  console.log('🔍 Procesando item:', item);
                  const key = item.nombre_articulo + '|' + (item.unidad || '');
                  if (!acc[key]) {
                    acc[key] = {
                      nombre_articulo: item.nombre_articulo,
                      cantidad: 0,
                      unidad: item.unidad || ''
                    };
                  }
                  // Intentar diferentes campos de cantidad
                  let cantidad = 0;
                  if (item.cantidad_asignada !== null && item.cantidad_asignada !== undefined) {
                    cantidad = Number(item.cantidad_asignada);
                  } else if (item.cantidad !== null && item.cantidad !== undefined) {
                    cantidad = Number(item.cantidad);
                  } else if (item.cantidad_solicitada !== null && item.cantidad_solicitada !== undefined) {
                    cantidad = Number(item.cantidad_solicitada);
                  }
                  
                  acc[key].cantidad += isNaN(cantidad) ? 0 : cantidad;
                  console.log(`📊 Artículo: ${item.nombre_articulo}, Cantidad procesada: ${cantidad}, Total: ${acc[key].cantidad}`);
                  return acc;
                }, {})
              ).map((art, idx) => (
                <div key={art.nombre_articulo + art.unidad} className="pedido-articulo-item">
                  <div className="pedido-articulo-nombre">{art.nombre_articulo}</div>
                  <div className="pedido-articulo-cantidad">{art.cantidad} {art.unidad}</div>
                </div>
              ))
            ) : (
              <div className="pedido-articulo-item">
                <div className="pedido-articulo-nombre">No hay artículos asignados</div>
                <div className="pedido-articulo-cantidad">0</div>
              </div>
            )}
          </div>
        </div>

        {/* Botón de acción */}
        {!mostrarFormulario && (
          <button onClick={handleAbrirFormulario}>
            Crear Cargamento
          </button>
        )}
      </div>
    </div>

    {/* Formulario renderizado fuera de la tarjeta usando portal */}
    {mostrarFormulario && (
      console.log('🚀 Creando portal para modal, mostrarFormulario:', mostrarFormulario),
      ReactDOM.createPortal(
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
                // Intentar diferentes campos de cantidad
                let cantidad = 0;
                if (item.cantidad_asignada !== null && item.cantidad_asignada !== undefined) {
                  cantidad = Number(item.cantidad_asignada);
                } else if (item.cantidad !== null && item.cantidad !== undefined) {
                  cantidad = Number(item.cantidad);
                } else if (item.cantidad_solicitada !== null && item.cantidad_solicitada !== undefined) {
                  cantidad = Number(item.cantidad_solicitada);
                }
                
                acc[key].cantidad += isNaN(cantidad) ? 0 : cantidad;
                return acc;
              }, {})
            )
          }
          volver={handleCerrarFormulario}
        />,
        document.body
      )
    )}
    </>
  );
};

export default PackageItem;