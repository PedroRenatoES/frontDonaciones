import React, { useState } from 'react';
import PaqueteFormModal from './SendDonations.jsx';
import '../styles/HelpRequestItem.css';
import axios from '../axios'; // Asegurate de tener esto configurado

const InternalRequestItem = ({ recurso, catalogo, unidades }) => {
  const [expandido, setExpandido] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(false);
  const [almacenes, setAlmacenes] = useState([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState(null);
  const [idPedidoLocal, setIdPedidoLocal] = useState(null);

  

  if (!recurso || typeof recurso !== 'object' || !recurso.descripcion || !recurso.codigo) {
    return null; // Protege contra datos mal formateados
  }

  const obtenerArticulos = (descripcion) => {
    if (!descripcion) return [];
    return descripcion.split(',').map(par => {
      const [nombre, cantidad] = par.split(':');
      return { nombre: nombre?.trim() || 'Desconocido', cantidad: Number(cantidad) || 0 };
    });
  };

  const fetchAlmacenes = async () => {
    try {
      const resAlmacenes = await axios.get('/almacenes');
      setAlmacenes(resAlmacenes.data);
      filterItems(resAlmacenes.data);
    } catch (error) {
      console.error('Error al obtener los almacenes o categorías:', error);
    }
  };

  const toggleExpandido = () => {
    if (!expandido && almacenes.length === 0) {
      fetchAlmacenes();
    }
    setExpandido(!expandido);
  };
  

  const articulos = obtenerArticulos(recurso.descripcion);


  const crearPedidoInterno = async () => {
    if (pedidoCreado) {
      setMostrarModal(true);
      return;
    }
  
    try {
      const payload = {
        fecha_pedido: new Date().toISOString().slice(0, 10),
        descripcion: recurso.descripcion,
        ubicacion: almacenSeleccionado?.ubicacion || 'Solicitud Interna',
        latitud_destino: almacenSeleccionado?.latitud || 0,
        longitud_destino: almacenSeleccionado?.longitud || 0,
        id_donacion: `INTERNAL-${recurso.id}`
      };
  
      const response = await axios.post('/pedidos-de-ayuda/', payload);
      const { id_pedido } = response.data.pedido;
      setIdPedidoLocal(id_pedido); // guardás el ID real
        
      console.log('Pedido creado con ID:', id_pedido);
  
      // Mostrar alerta al crear el pedido
      alert(`Pedido # ${id_pedido}, creado`);
  
      setPedidoCreado(true);
      setMostrarModal(true);
      
      // Pasar el id_pedido al modal
      setMostrarModal(true);
  
    } catch (err) {
      console.error('Error al crear pedido interno:', err.response?.data || err.message);
      alert('No se pudo crear el pedido. Intenta nuevamente.');
    }
  };
    
  return (
    <div className="pedido-card">
      <div className="pedido-header" onClick={toggleExpandido}>
          <strong>Solicitud Interna</strong> — Código: {recurso.codigo}
          {expandido && (
            <select
            value={almacenSeleccionado}
            onChange={(e) => {
              const seleccionado = almacenes.find(a => a.id_almacen === Number(e.target.value));
              setAlmacenSeleccionado(seleccionado);
            }}
                        onClick={(e) => e.stopPropagation()} // ⛔️ Detiene que el clic cierre el panel
            style={{ marginLeft: '1rem' }}
          >
            <option value="">Seleccionar punto de entrega</option>
            {almacenes.map((almacen) => (
              <option key={almacen.id_almacen} value={almacen.nombre_almacen}>
                {almacen.nombre_almacen}
              </option>
            ))}
          </select>
          
          )}
      </div>

      {expandido && (
        <div className="pedido-detalle">
          <p><strong>Artículos Solicitados:</strong></p>
          <ul>
            {articulos.map((item, idx) => (
              <li key={idx}>{item.nombre} — {item.cantidad}</li>
            ))}
          </ul>

          <button
            className="btn btn-outline-primary mt-3"
            onClick={crearPedidoInterno}
          >
            Empezar armado de paquete
          </button>

          <PaqueteFormModal
            show={mostrarModal}
            onClose={() => setMostrarModal(false)}
            onPaqueteCreado={() => setMostrarModal(false)}
            pedidos={[{
              id_pedido: `INTERNAL-${recurso.id}`,
              descripcion: recurso.descripcion,
              articulos: articulos
            }]}
            unidades={unidades}
            catalogo={catalogo}
            pedidoPreseleccionado={`INTERNAL-${recurso.id}`}
            idPedidoLocal={idPedidoLocal}
            descripcionPedido={`Interna: ${recurso.codigo}`}
            fuenteExterna="graphql"
          />
        </div>
      )}
    </div>
  );
};

export default InternalRequestItem;
