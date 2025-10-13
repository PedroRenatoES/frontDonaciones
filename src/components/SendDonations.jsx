import React, { useState, useEffect, useRef } from 'react';
import axios from '../axios';
import axiosPublic from '../axiosPublic';
import '../styles/PaqueteFormModal.css';

// Nuevas props: pedidoPreseleccionado, descripcionPedido
function PaqueteFormModal({
  show,
  onClose,
  onPaqueteCreado,
  articulosPedido = [],
  codigoPedido = '',
  idPedidoLocal = null,
  descripcionPedido = '',
  ciUsuario = '',
  idDonacion = null // <-- nuevo prop
}) {
  const [descripcion, setDescripcion] = useState('');
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [almacenes, setAlmacenes] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  // Estructura agrupada: { nombreArticulo: { id_almacen: { nombre_almacen, stock, cantidad_asignada, donaciones: [ { id_donacion_especie, cantidad_restante } ] } } }
  const [asignacion, setAsignacion] = useState({});
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState('');
  const [tipoConfirmacion, setTipoConfirmacion] = useState('success'); // 'success', 'error', 'warning'
  const [errorValidacion, setErrorValidacion] = useState('');
  const errorRef = useRef(null);

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [show, onClose]);

  // Scroll automático al error cuando aparece
  useEffect(() => {
    if (errorValidacion && errorRef.current) {
      setTimeout(() => {
        errorRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
      }, 100); // Pequeño delay para que la animación termine
    }
  }, [errorValidacion]);

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        try {
          const [donacionesRes, almacenesRes, catalogoRes] = await Promise.all([
            axios.get('/donaciones-en-especie'),
            axios.get('/almacenes'),
            axios.get('/catalogo')
          ]);
          setDonacionesEspecie(donacionesRes.data);
          setAlmacenes(almacenesRes.data);
          setCatalogo(catalogoRes.data);

          // Enriquecer donaciones con nombre_articulo usando el catálogo
          const catalogoMap = {};
          for (const item of catalogoRes.data) {
            catalogoMap[item.id_articulo] = item.nombre_articulo;
          }
          const donacionesConNombre = donacionesRes.data.map(d => ({
            ...d,
            nombre_articulo: catalogoMap[d.id_articulo] || ''
          }));
          setDonacionesEspecie(donacionesConNombre);

          // Agrupar donaciones por almacén para cada artículo
          const agrupado = {};
          for (const art of articulosPedido) {
            const donacionesArt = donacionesConNombre.filter(d => d.nombre_articulo === art.nombre && d.cantidad_restante > 0);
            const porAlmacen = {};
            for (const d of donacionesArt) {
              if (!porAlmacen[d.id_almacen]) {
                porAlmacen[d.id_almacen] = {
                  nombre_almacen: almacenesRes.data.find(a => a.id_almacen === d.id_almacen)?.nombre_almacen || d.id_almacen,
                  stock: 0,
                  cantidad_asignada: 0,
                  donaciones: []
                };
              }
              porAlmacen[d.id_almacen].stock += d.cantidad_restante;
              porAlmacen[d.id_almacen].donaciones.push({
                id_donacion_especie: d.id_donacion_especie,
                cantidad_restante: d.cantidad_restante
              });
            }
            agrupado[art.nombre] = porAlmacen;
          }
          setAsignacion(agrupado);
        } catch (error) {
          mostrarModalConfirmacion('No se pudieron cargar donaciones, almacenes o catálogo.', 'error');
        }
      };
      fetchData();
    } else {
      setDescripcion('');
      setAsignacion({});
    }
  }, [show]);

  if (!show) return null;

  // Handler para cambiar la cantidad asignada por almacén
  const handleAsignacionChange = (nombreArticulo, idAlmacen, value) => {
    setAsignacion(prev => {
      const nuevo = { ...prev };
      const porAlmacen = { ...nuevo[nombreArticulo] };
      porAlmacen[idAlmacen] = {
        ...porAlmacen[idAlmacen],
        cantidad_asignada: Math.max(0, Math.min(Number(value), porAlmacen[idAlmacen].stock))
      };
      nuevo[nombreArticulo] = porAlmacen;
      return nuevo;
    });
  };

  // Calcular suma asignada por artículo
  const sumaAsignada = (nombreArticulo) => {
    const porAlmacen = asignacion[nombreArticulo] || {};
    return Object.values(porAlmacen).reduce((acc, a) => acc + (Number(a.cantidad_asignada) || 0), 0);
  };

  // Validación y creación de paquetes agrupados por almacén
  const handleCrearPaquetes = async () => {
    // Limpiar errores previos
    setErrorValidacion('');
    
    // Validar que la suma asignada para cada artículo sea igual a lo solicitado
    const errores = [];
    for (const art of articulosPedido) {
      if (sumaAsignada(art.nombre) !== art.cantidad) {
        errores.push(`Debes asignar exactamente ${art.cantidad} unidades de ${art.nombre}`);
      }
    }
    
    // Si hay errores, mostrarlos todos y salir
    if (errores.length > 0) {
      setErrorValidacion(errores.join('. '));
      return;
    }

    // Repartir cantidades asignadas por almacén entre donaciones individuales
    // y agrupar por almacén para crear los paquetes
    const paquetesPorAlmacen = {};
    for (const art of articulosPedido) {
      const porAlmacen = asignacion[art.nombre] || {};
      for (const [idAlmacen, info] of Object.entries(porAlmacen)) {
        if (!info.cantidad_asignada || info.cantidad_asignada < 1) continue;
        // Repartir la cantidad entre las donaciones individuales de ese almacén
        let cantidadRestante = info.cantidad_asignada;
        for (const don of info.donaciones) {
          if (cantidadRestante <= 0) break;
          // Buscar la donación completa en donacionesEspecie para ver el estado
          const donacionCompleta = donacionesEspecie.find(x => x.id_donacion_especie === don.id_donacion_especie);
          const esSellado = donacionCompleta && typeof donacionCompleta.estado_articulo === 'string' && donacionCompleta.estado_articulo.toLowerCase() === 'sellado';
          if (esSellado) {
            // Solo se puede donar si hay suficiente para tomar todo el paquete
            if (cantidadRestante >= don.cantidad_restante) {
              if (!paquetesPorAlmacen[idAlmacen]) paquetesPorAlmacen[idAlmacen] = [];
              paquetesPorAlmacen[idAlmacen].push({
                id_donacion_especie: don.id_donacion_especie,
                cantidad_asignada: don.cantidad_restante
              });
              cantidadRestante -= don.cantidad_restante;
            }
            // Si no hay suficiente para donar todo el sellado, se salta
            continue;
          } else {
            // Donaciones normales: se puede tomar parcial
            const cantidadAsignar = Math.min(don.cantidad_restante, cantidadRestante);
            if (cantidadAsignar > 0) {
              if (!paquetesPorAlmacen[idAlmacen]) paquetesPorAlmacen[idAlmacen] = [];
              paquetesPorAlmacen[idAlmacen].push({
                id_donacion_especie: don.id_donacion_especie,
                cantidad_asignada: cantidadAsignar
              });
              cantidadRestante -= cantidadAsignar;
            }
          }
        }
      }
    }

    // Crear paquetes por almacén
    try {
      // Guardar los id_almacen involucrados para el segundo POST externo
      const almacenesInvolucrados = [];
      for (const [idAlmacen, donaciones] of Object.entries(paquetesPorAlmacen)) {
        const almacenObj = almacenes.find(a => a.id_almacen == idAlmacen);
        if (almacenObj) almacenesInvolucrados.push(almacenObj.nombre_almacen);
        // Guardar el ciUsuario y el id_almacen en la descripción para el filtro robusto
        const descripcionFinal = `CI:${ciUsuario || ''}|SOL#${codigoPedido}|IDALMACEN:${idAlmacen}|ALMACEN:${almacenObj?.nombre_almacen || idAlmacen}|${descripcion}`;
        // Usar el idPedidoLocal (número real) si está disponible
        let idPedidoNum = idPedidoLocal;
        if (!idPedidoNum && typeof codigoPedido === 'string' && /^\d+$/.test(codigoPedido)) {
          idPedidoNum = parseInt(codigoPedido, 10);
        }
        await axios.post('/paquetes', {
          nombre_paquete: codigoPedido,
          descripcion: descripcionFinal,
          id_pedido: idPedidoNum,
          donaciones
        });
      }

      // POST externo tras aceptar el pedido de ayuda (primer POST)
      if (ciUsuario && idDonacion) {
        try {
          const url = `http://localhost:3001/donaciones/armado/${idDonacion}`;
          console.log('[POST EXTERNO] Enviando a:', url);
          console.log('[POST EXTERNO] Payload:', { ciUsuario });
          console.log(`[DEBUG] Enviando POST externo a: ${url} con ciUsuario: ${ciUsuario}`);
          await axiosPublic.post(url, {
            ciUsuario: ciUsuario
          });
        } catch (err) {
          console.error('Error al enviar POST externo (aceptar pedido):', err);
          mostrarModalConfirmacion('No se pudo enviar el POST externo. Revisa la consola.', 'error');
        }
      } else {
        console.log(`[DEBUG] No se envió POST externo. ciUsuario: ${ciUsuario}, idDonacion: ${idDonacion}`);
      }

      mostrarModalConfirmacion('Paquetes creados correctamente', 'success');
      onPaqueteCreado && onPaqueteCreado();
    } catch (err) {
      mostrarModalConfirmacion('Error al crear paquetes', 'error');
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const mostrarModalConfirmacion = (mensaje, tipo = 'success') => {
    setMensajeConfirmacion(mensaje);
    setTipoConfirmacion(tipo);
    setMostrarConfirmacion(true);
  };

  const cerrarModalConfirmacion = () => {
    setMostrarConfirmacion(false);
    if (tipoConfirmacion === 'success') {
      onClose();
    }
  };

  return (
    <div className="paquete-modal-wrapper" onClick={handleBackdropClick}>
      <div className="paquete-modal-card">
        <button 
          className="paquete-modal-close-btn" 
          onClick={onClose}
          title="Cerrar modal"
        ></button>
        
        <h4 className="paquete-modal-title">Asignar Donaciones a Almacenes</h4>

        {/* Indicador de Error de Validación */}
        {errorValidacion && (
          <div ref={errorRef} className="error-validacion">
            <div className="error-icon">⚠</div>
            <div className="error-mensaje">
              {errorValidacion.includes('. ') ? (
                <div className="error-lista">
                  {errorValidacion.split('. ').map((error, index) => (
                    <div key={index} className="error-item">
                      • {error}
                    </div>
                  ))}
                </div>
              ) : (
                errorValidacion
              )}
            </div>
          </div>
        )}

        {descripcionPedido && (
          <div className="pedido-info">
            <div className="pedido-info-label">Pedido seleccionado:</div>
            <div className="pedido-info-content">
              <div className="pedido-info-value">{descripcionPedido}</div>
            </div>
          </div>
        )}

        <div className="formulario-section">
          <div className="form-group">
            <label className="form-label">Nombre del Paquete</label>
            <input 
              type="text" 
              className="form-control" 
              value={codigoPedido} 
              disabled 
            />
            <div className="form-text">El nombre del paquete es el código de la solicitud y no puede cambiarse.</div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Descripción</label>
            <textarea
              className="form-control"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              placeholder="Descripción del paquete..."
            />
          </div>
        </div>

        <div className="asignacion-section">
          <h5 className="asignacion-title">Asignar artículos desde donaciones disponibles</h5>
          
          {articulosPedido.map((art, idx) => {
            const porAlmacen = asignacion[art.nombre] || {};
            return (
              <div key={art.nombre + idx} className="articulo-card">
                <div className="articulo-header">
                  <div className="articulo-nombre">{art.nombre}</div>
                  <div className="articulo-requerido">Requerido: {art.cantidad}</div>
                </div>
                
                <table className="asignacion-table">
                  <thead>
                    <tr>
                      <th>Almacén</th>
                      <th>Stock disponible</th>
                      <th>Cantidad a asignar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(porAlmacen).map(([idAlmacen, info]) => (
                      <tr key={idAlmacen}>
                        <td>{info.nombre_almacen}</td>
                        <td>{info.stock}</td>
                        <td>
                          <input
                            type="text"
                            className="input-asignacion"
                            value={info.cantidad_asignada || ''}
                            onChange={e => handleAsignacionChange(art.nombre, idAlmacen, e.target.value)}
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div style={{ 
                  color: sumaAsignada(art.nombre) === art.cantidad ? '#28a745' : '#dc3545', 
                  fontWeight: 'bold',
                  textAlign: 'center',
                  marginTop: '16px',
                  padding: '8px',
                  backgroundColor: sumaAsignada(art.nombre) === art.cantidad ? 'rgba(40, 167, 69, 0.1)' : 'rgba(220, 53, 69, 0.1)',
                  borderRadius: '8px'
                }}>
                  Total asignado: {sumaAsignada(art.nombre)} / {art.cantidad}
                </div>
              </div>
            );
          })}
        </div>

        <div className="modal-footer">
          <button className="btn-modal btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-modal btn-primary" onClick={handleCrearPaquetes}>
            Confirmar Asignación
          </button>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {mostrarConfirmacion && (
        <div className="confirmacion-modal-wrapper" onClick={cerrarModalConfirmacion}>
          <div className="confirmacion-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className={`confirmacion-icon ${tipoConfirmacion}`}>
              {tipoConfirmacion === 'success' && '✓'}
              {tipoConfirmacion === 'error' && '✗'}
              {tipoConfirmacion === 'warning' && '⚠'}
            </div>
            <div className="confirmacion-mensaje">{mensajeConfirmacion}</div>
            <button 
              className={`confirmacion-btn ${tipoConfirmacion}`}
              onClick={cerrarModalConfirmacion}
            >
              {tipoConfirmacion === 'success' ? 'Continuar' : 'Entendido'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaqueteFormModal;