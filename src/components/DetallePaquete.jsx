import React, { useState, useMemo, useEffect } from 'react';
import axios from '../axios';
import axiosPublic from '../axiosPublic';
import ListaCajasPorPaquete from './ListaCajasPorPaquete';
import '../styles/DetallePaquete.css';

const DetallePaquete = ({ paquete, productos, volver }) => {
  console.log('🔍 DetallePaquete renderizando:', { paquete, productos });
  
  const [seleccionados, setSeleccionados] = useState([]);
  const [refreshCajas, setRefreshCajas] = useState(Date.now());
  const [cajas, setCajas] = useState([]); // Estado para cajas actuales
  const [creando, setCreando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState('');

  // Manejar tecla Escape para cerrar modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        volver();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [volver]);

  // Calculamos la cantidad asignada total por producto a partir de las cajas
  // Parsear la descripción de cada caja para restar correctamente por artículo
  const cantidadesAsignadas = useMemo(() => {
    const asignadas = {};
    productos.forEach(prod => {
      asignadas[prod.nombre_articulo] = 0;
    });
    cajas.forEach(caja => {
      if (typeof caja.descripcion === 'string') {
        // Ejemplo: "Agua:2,Arroz:2"
        caja.descripcion.split(',').forEach(par => {
          const [nombre, cantidad] = par.split(':');
          if (nombre && !isNaN(Number(cantidad))) {
            if (asignadas[nombre] !== undefined) {
              asignadas[nombre] += Number(cantidad);
            }
          }
        });
      }
    });
    return asignadas;
  }, [productos, cajas]);

  // Función para obtener cantidad disponible real (total - asignada)
  const cantidadDisponibleReal = (nombre_articulo) => {
    const prod = productos.find(p => p.nombre_articulo === nombre_articulo);
    if (!prod) return 0;
    // prod.cantidad ya es la suma asignada para ese artículo
    return prod.cantidad - (cantidadesAsignadas[nombre_articulo] || 0);
  };

  const toggleSeleccion = (nombre_articulo) => {
    const existe = seleccionados.find(p => p.nombre_articulo === nombre_articulo);
    if (existe) {
      setSeleccionados(prev => prev.filter(p => p.nombre_articulo !== nombre_articulo));
    } else {
      const prod = productos.find(p => p.nombre_articulo === nombre_articulo);
      setSeleccionados(prev => [...prev, { ...prod, cantidad_asignada: 1 }]);
    }
  };

  const cambiarCantidad = (nombre_articulo, valor) => {
    // Permitir cualquier entrada, incluyendo texto vacío
    setSeleccionados(prev =>
      prev.map(p =>
        p.nombre_articulo === nombre_articulo ? { ...p, cantidad_asignada: valor } : p
      )
    );
  };

  const crearCaja = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (creando) return;

    // Limpiar errores previos
    setErrorValidacion('');
    setCreando(true);

    if (seleccionados.length === 0) {
      setErrorValidacion('Debes seleccionar al menos un producto para crear la caja');
      setCreando(false);
      return;
    }

    // Validar cantidades asignadas respecto a disponible real
    for (const p of seleccionados) {
      const cantidad = Number(p.cantidad_asignada);
      const disponible = cantidadDisponibleReal(p.nombre_articulo);
      
      // Validar que sea un número válido
      if (isNaN(cantidad) || cantidad <= 0) {
        setErrorValidacion(`La cantidad para ${p.nombre_articulo} debe ser un número mayor a 0`);
        setCreando(false);
        return;
      }
      
      // Validar que no exceda lo disponible
      if (cantidad > disponible) {
        setErrorValidacion(`La cantidad asignada para ${p.nombre_articulo} excede la cantidad disponible (${disponible})`);
        setCreando(false);
        return;
      }
    }


    // Serializar artículos y cantidades en la descripción: "Agua:2,Arroz:2"
    const descripcion = seleccionados
      .map(p => `${p.nombre_articulo}:${p.cantidad_asignada}`)
      .join(',');

    const cantidadTotal = seleccionados.reduce((acc, cur) => acc + cur.cantidad_asignada, 0);
    const numeroCaja = Math.floor(Math.random() * 10000);
    const codigoCaja = `${paquete.nombre_paquete || paquete.id_paquete}-#${numeroCaja}`;

    try {
      const res = await axios.post('/cajas', {
        codigo_caja: codigoCaja,
        descripcion,
        id_paquete: paquete.id_paquete,
        cantidad_asignada: cantidadTotal
      });

      setRefreshCajas(Date.now());
      setSeleccionados([]);
    } catch (error) {
      console.error('Error creando caja:', error);
      setErrorValidacion('Hubo un error al crear la caja. Intenta nuevamente.');
    } finally {
      setCreando(false);
    }
  };

  const marcarComoEnviado = async () => {
    if (enviando) return;

    // Validar que para cada producto las cantidades asignadas coincidan con la cantidad total
    const errores = [];
    for (const prod of productos) {
      const asignado = cantidadesAsignadas[prod.nombre_articulo] || 0;
      if (asignado !== prod.cantidad) {
        errores.push(`El producto "${prod.nombre_articulo}" tiene ${asignado} asignados pero la cantidad total es ${prod.cantidad}`);
      }
    }
    
    if (errores.length > 0) {
      setErrorValidacion(errores.join('. '));
      return;
    }

    setEnviando(true);
    try {
      await axios.put('/paquetes/marcar-enviado', {
        id_paquete: paquete.id_paquete
      });

      // --- SEGUNDO POST EXTERNO: enviar SIEMPRE al marcar como enviado (verificación comentada) ---
      // Lógica de verificación de todosEnviados comentada temporalmente
      // Obtener ciUsuario de la descripción del paquete actual
      let ciUsuario = '';
      const match = paquete.descripcion.match(/CI:([^|]+)\|/);
      if (match) {
        ciUsuario = match[1];
      }
      // Obtener idDonacion externo consultando el pedido de ayuda
      let idDonacion = null;
      try {
  const resPedido = await axios.get(`/pedidos-de-ayuda/${paquete.id_pedido}`);
  idDonacion = resPedido.data.id_donacion;
      } catch (err) {
        console.error('No se pudo obtener el pedido de ayuda para el segundo POST externo:', err);
      }
      if (idDonacion && ciUsuario) {
        try {
          const url = `http://localhost:3001/donaciones/armado/${idDonacion}`;
          console.log('[POST EXTERNO 2] Enviando a:', url);
          console.log('[POST EXTERNO 2] Payload:', { ciUsuario });
          alert(`[DEBUG] Enviando segundo POST externo a: ${url} con ciUsuario: ${ciUsuario}`);
          await axiosPublic.post(url, { ciUsuario });
        } catch (err) {
          console.error('Error al enviar POST externo (armado completo):', err);
          alert('[ERROR] No se pudo enviar el segundo POST externo. Revisa la consola.');
        }
      } else {
        alert(`[DEBUG] No se envió segundo POST externo. ciUsuario: ${ciUsuario}, idDonacion: ${idDonacion}`);
      }

      alert('Paquete marcado como enviado');
      volver();
    } catch (error) {
      console.error('Error al marcar como enviado:', error);
      alert('No se pudo marcar como enviado');
    } finally {
      setEnviando(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      volver();
    }
  };

  return (
    <div className="detalle-paquete-wrapper" onClick={handleBackdropClick}>
      <div className="detalle-paquete-card">
        <button 
          className="modal-close-btn" 
          onClick={volver}
          title="Cerrar modal"
        ></button>
        
        <h4 className="detalle-paquete-title">Crear caja para: {paquete.nombre_paquete}</h4>

        {/* Indicador de Error de Validación */}
        {errorValidacion && (
          <div className="error-validacion">
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

        {/* Resumen de productos disponibles */}
        <div className="productos-resumen">
          <h5 className="productos-resumen-title">Productos Disponibles</h5>
          <div className="productos-resumen-list">
            {productos.map(prod => {
              const disponibleReal = cantidadDisponibleReal(prod.nombre_articulo);
              return (
                <div key={prod.nombre_articulo} className="producto-resumen-item">
                  {prod.nombre_articulo}: {disponibleReal} {prod.unidad}
                </div>
              );
            })}
          </div>
        </div>

        <table className="table table-moderna">
          <thead>
            <tr>
              <th style={{color: 'black' , textAlign: 'center'}}>Artículo</th>
              <th style={{color: 'black' , textAlign: 'center'}}>Unidad</th>
              <th style={{color: 'black' , textAlign: 'center'}}>Disponible</th>
              <th style={{color: 'black' , textAlign: 'center'}}>Asignar</th>
              <th style={{color: 'black' , textAlign: 'center'}}></th>
            </tr>
          </thead>
          <tbody>
            {productos.map(prod => {
              const seleccionado = seleccionados.find(p => p.nombre_articulo === prod.nombre_articulo);
              const disponibleReal = cantidadDisponibleReal(prod.nombre_articulo);

              return (
                <tr key={prod.nombre_articulo}>
                  <td style={{textAlign: 'center'}}>{prod.nombre_articulo}</td>
                  <td style={{textAlign: 'center'}}>{prod.unidad}</td>
                  <td style={{textAlign: 'center'}}>{disponibleReal}</td>
                  <td>
                    <input
                      type="text"
                      className="input-cantidad"
                      disabled={!seleccionado || disponibleReal === 0}
                      value={seleccionado?.cantidad_asignada || ''}
                      onChange={e => cambiarCantidad(prod.nombre_articulo, e.target.value)}
                      placeholder="Cantidad"
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      className="checkbox-moderno"
                      checked={!!seleccionado}
                      disabled={disponibleReal === 0}
                      onChange={() => toggleSeleccion(prod.nombre_articulo)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="botones-container">
          <button
            className="btn-moderno btn-crear"
            onClick={crearCaja}
            disabled={creando}
          >
            {creando ? 'Creando...' : 'Crear Caja'}
          </button>
        </div>

        <div className="lista-cajas-container">
          <h5 className="lista-cajas-title">Cajas Creadas</h5>
          <ListaCajasPorPaquete
            idPaquete={paquete.id_paquete}
            refrescarTrigger={refreshCajas}
            setCajas={setCajas}
          />
          {cajas.length === 0 && (
            <p className="mensaje-estado">No se han creado cajas aún.</p>
          )}
        </div>

        <hr className="separador-moderno" />
        
        <div style={{ textAlign: 'center' }}>
          <button
            className="btn-moderno btn-enviar"
            onClick={marcarComoEnviado}
            disabled={enviando}
          >
            {enviando ? 'Enviando...' : 'Marcar como Enviado'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetallePaquete;
