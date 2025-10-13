import React, { useState } from 'react';
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
      
  
      console.log('📦 Payload que se envía al backend:', JSON.stringify(payload, null, 2)); // 🔍 LOG CLAVE
  
      const response = await axios.post('/pedidos-de-ayuda/', payload);
      const { id_pedido } = response.data.pedido;  
      console.log('✅ Pedido # ', id_pedido, ', creado');
      
      
      alert(`Pedido Externo creado con ID: ${id_pedido}`);
      setIdPedidoLocal(id_pedido);
      setPedidoCreado(true);
      setMostrarModal(true);
  
    } catch (err) {
      console.error('❌ Error al crear pedido externo:', err.response?.data || err.message);
      alert('No se pudo crear el pedido. Intenta nuevamente.');
    }
  };
    return (
    <div className="pedido-card">
      <div className="pedido-header" onClick={() => setExpandido(!expandido)}>
        <strong>Solicitud Externa</strong> — {pedido.idDonacion}
      </div>

      {expandido && (
        <div className="pedido-detalle">
          <p><strong>Ubicación:</strong> {pedido.ubicacion}</p>
          <p><strong>Artículos Solicitados:</strong></p>
          <ul>
            {articulos.map((item, idx) => (
              <li key={idx}>{item.nombre} — {item.cantidad}</li>
            ))}
          </ul>

          <button
            className="btn btn-outline-primary mt-3"
            onClick={crearPedidoExterno}
          >
            Empezar armado de paquete
          </button>

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
          />
        </div>
      )}
    </div>
  );
};

export default PedidoItem;
