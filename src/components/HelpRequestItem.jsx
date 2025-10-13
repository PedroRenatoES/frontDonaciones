import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import PaqueteFormModal from './SendDonations.jsx';
import '../styles/HelpRequestItem.css';
import axios from '../axios';

const PedidoItem = ({ pedido, onPaquetesCreados }) => {
  const [expandido, setExpandido] = useState(false);
  const [idPedidoLocal, setIdPedidoLocal] = useState(null); // el id numérico real
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(false);

  // Extrae los artículos y el código del pedido externo
  const obtenerArticulos = (descripcion) => {
    if (!descripcion) return [];
    return descripcion.split(',').map(par => {
      const [nombre, cantidad] = par.split(':');
      return { nombre: nombre.trim(), cantidad: Number(cantidad) || 0 };
    });
  };
  const articulos = obtenerArticulos(pedido.descripcion);
  const codigoPedido = pedido.codigo || pedido.idDonacion;

  const crearPedidoExterno = async () => {
    if (pedidoCreado) {
      setMostrarModal(true);
      return;
    }
  
    try {
      const payload = {
        fecha_pedido: pedido.fecha_pedido || new Date().toISOString().slice(0, 10),
        descripcion: pedido.descripcion,
        ubicacion: pedido.ubicacion || 'Solicitud Externa',
        latitud_destino: pedido.latitud_destino || 0,
        longitud_destino: pedido.longitud_destino || 0,
        id_donacion: pedido.idDonacion?.toString(), // ✅ Forzamos a string
      };
      
  
      console.log('Payload que se envía al backend:', JSON.stringify(payload, null, 2)); // 🔍 LOG CLAVE
  
      const response = await axios.post('/pedidos-de-ayuda/', payload);
      const { id_pedido } = response.data.pedido;  
      console.log('✅ Pedido # ', id_pedido, ', creado');
      
      
      setIdPedidoLocal(id_pedido);
      setPedidoCreado(true);
      setMostrarModal(true);
  
    } catch (err) {
      console.error('❌ Error al crear pedido externo:', err.response?.data || err.message);
    }
  };
    return (
    <div className={`pedido-card ${expandido ? 'expandido' : ''}`}>
      {/* Indicador de estado */}
      <div className="pedido-status-indicator"></div>
      
      {/* Header de la tarjeta */}
      <div className="pedido-header" onClick={() => setExpandido(!expandido)}>
        <div className="pedido-header-title">Solicitud Externa</div>
        <div className="pedido-header-id">— {pedido.idDonacion}</div>
      </div>

      {/* Contenido expandible */}
      <div className="pedido-detalle">
        {/* Información de ubicación */}
        <div className="pedido-ubicacion">
          <div className="pedido-ubicacion-text">
            <div className="pedido-ubicacion-label">Ubicación</div>
            <div className="pedido-ubicacion-value">{pedido.ubicacion}</div>
          </div>
        </div>

        {/* Sección de artículos solicitados */}
        <div className="pedido-articulos">
          <div className="pedido-articulos-title">Artículos Solicitados</div>
          <div className="pedido-articulos-list">
            {articulos.map((item, idx) => (
              <div key={idx} className="pedido-articulo-item">
                <div className="pedido-articulo-nombre">{item.nombre}</div>
                <div className="pedido-articulo-cantidad">{item.cantidad}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón de acción */}
        <button onClick={crearPedidoExterno}>
          Empezar armado de paquete
        </button>

        {/* Modal renderizado fuera de la tarjeta usando portal */}
        {mostrarModal && ReactDOM.createPortal(
          <PaqueteFormModal
            show={mostrarModal}
            onClose={() => setMostrarModal(false)}
            onPaqueteCreado={() => {
              setMostrarModal(false);
              if (onPaquetesCreados) onPaquetesCreados();
            }}
            articulosPedido={articulos}
            codigoPedido={codigoPedido}
            idPedidoLocal={idPedidoLocal}
            descripcionPedido={`Externa: ${pedido.descripcion}`}
            ciUsuario={pedido.ciUsuario}
            idDonacion={pedido.idDonacion}
          />,
          document.body
        )}
      </div>
    </div>
  );
};

export default PedidoItem;
