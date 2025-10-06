import React, { useState, useEffect } from 'react';
import axios from '../axios';
import axiosPublic from '../axiosPublic';

// Nuevas props: pedidoPreseleccionado, descripcionPedido
function PaqueteFormModal({
  show,
  onClose,
  onPaqueteCreado,
  pedidoPreseleccionado,
  descripcionPedido,
  idPedidoLocal, 
  fuenteExterna
}) {
  const [nombrePaquete, setNombrePaquete] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(pedidoPreseleccionado || '');
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [busquedaArticulo, setBusquedaArticulo] = useState('');
  const [unidadFiltro, setUnidadFiltro] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (show) {
      // Carga las donaciones solo cuando se abre el modal
      const fetchDonaciones = async () => {
        try {
          const [donacionesRes, almacenesRes] = await Promise.all([
            axios.get('/donaciones-en-especie'),
            axios.get('/almacenes')
          ]);
      
          const nombreAlmacenLS = localStorage.getItem('almacen');
          const almacenMatch = almacenesRes.data.find(
            (alm) => alm.nombre_almacen === nombreAlmacenLS
          );
      
          if (!almacenMatch) {
            console.warn('No se encontró el almacén del usuario.');
            setDonacionesEspecie([]);
            return;
          }
      
          const idAlmacen = almacenMatch.id_almacen;
          const donacionesFiltradas = donacionesRes.data.filter(
            (d) => d.id_almacen === idAlmacen
          );
      
          setDonacionesEspecie(donacionesFiltradas);
        } catch (error) {
          console.error('Error al cargar donaciones:', error);
          alert('No se pudieron cargar las donaciones.');
        }
      };
      
      fetchDonaciones();
    } else {
      // Resetear formulario cuando se cierra
      setNombrePaquete('');
      setDescripcion('');
      setPedidoSeleccionado(pedidoPreseleccionado || '');
      setSeleccionadas([]);
      setBusquedaArticulo('');
      setUnidadFiltro('');
    }
  }, [show, pedidoPreseleccionado]);

  const fetchUnidades = async () => {
    try {
      const res = await axios.get('/unidades');
      setUnidades(res.data);
    } catch (error) {
      console.error('Error al cargar las unidades:', error);
    }
  };

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchCatalogo = async () => {
    try {
      const res = await axios.get('/catalogo');
      setCatalogo(res.data);
    } catch (error) {
      console.error('Error al cargar el catálogo:', error);
    }
  };

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const getArticuloNombre = (id) => {
    const articulo = catalogo.find(item => item.id_articulo === id);
    return articulo ? articulo.nombre_articulo : 'Desconocido';
  };

  const toggleSeleccion = (don) => {
    const existe = seleccionadas.find(d => d.id_donacion_especie === don.id_donacion_especie);
    if (existe) {
      setSeleccionadas(seleccionadas.filter(d => d.id_donacion_especie !== don.id_donacion_especie));
    } else {
      setSeleccionadas([...seleccionadas, {
        id_donacion_especie: don.id_donacion_especie,
        cantidad_asignada: don.cantidad_restante
      }]);
    }
  };

  const handleCantidadChange = (id, cantidad) => {
    setSeleccionadas(prev =>
      prev.map(d =>
        d.id_donacion_especie === id ? { ...d, cantidad_asignada: cantidad } : d
      )
    );
  };

  const donacionesFiltradas = donacionesEspecie.filter(don => {
    const articuloNombre = getArticuloNombre(don.id_articulo).toLowerCase();
    const coincideUnidad = unidadFiltro ? don.id_unidad === Number(unidadFiltro) : true;
    const coincideBusqueda = articuloNombre.includes(busquedaArticulo.toLowerCase());
    return coincideUnidad && coincideBusqueda && don.cantidad_restante > 0;
  });

  // 🔥 FUNCIÓN PARA ADMIN - DISTRIBUCIÓN MÚLTIPLE
  const crearPaquetesDistribucionAdmin = async (solicitud, articulosPorAlmacen) => {
    const resultados = [];
    
    for (const [almacen, articulos] of Object.entries(articulosPorAlmacen)) {
      if (articulos.length > 0) {
        // ✅ NOMBRE normal (compatible)
        const nombrePaquete = `Paquete ${solicitud.codigo} - ${almacen}`;
        
        // ✅ DESCRIPCIÓN con metadatos
        const descripcionConMeta = `SOL#${solicitud.codigo}|ALMACEN:${almacen}|${solicitud.descripcion}`;
        
        const payload = {
          nombre_paquete: nombrePaquete,
          descripcion: descripcionConMeta,
          id_pedido: solicitud.id,
          donaciones: articulos
        };
        
        console.log(`📦 Creando paquete: ${nombrePaquete}`);
        const response = await axios.post('/paquetes', payload);
        resultados.push(response.data);
      }
    }
    
    return resultados;
  };

  const crearPaquete = async () => {
    const nombreNormalizado = nombrePaquete.trim().toLowerCase();

    if (!nombreNormalizado || seleccionadas.length === 0) {
      alert('Debe ingresar un nombre y al menos una donación.');
      return;
    }

    // ✅ MANTENER nombre_paquete igual para compatibilidad
    const nombreFinal = nombrePaquete;

    // ✅ AGREGAR METADATOS en descripción
    let descripcionFinal = descripcion;
    
    if (pedidoPreseleccionado) {
      const miAlmacen = localStorage.getItem('almacen');
      descripcionFinal = `SOL#${pedidoPreseleccionado}|ALMACEN:${miAlmacen}|${descripcion}`;
    }

    let idPedidoReal = idPedidoLocal || pedidoSeleccionado;
    if (typeof idPedidoReal === 'string') {
      const match = idPedidoReal.match(/(?:INTERNAL|EXT)-(\d+)/);
      if (match) {
        idPedidoReal = parseInt(match[1], 10);
      }
    }

    const payload = {
      nombre_paquete: nombreFinal, // ✅ COMPATIBLE con endpoint externo
      descripcion: descripcionFinal, // ✅ CON METADATOS para filtrado interno
      id_pedido: idPedidoReal,
      donaciones: seleccionadas
    };

    console.log('▶ Payload enviado:', payload);
    
    try {
      await axios.post('/paquetes', payload);
      console.log('✅ Paquete creado localmente con éxito');
      
      // Aquí iría el resto del código para envío a plataforma externa
      // que ya tenías implementado
      
      alert('✅ Paquete creado exitosamente');
      onPaqueteCreado();
      onClose();
      
    } catch (error) {
      console.error('❌ Error creando paquete en base de datos local:', error.response?.data || error.message);
      alert('❌ Error al crear el paquete localmente');
      return;
    }
  };

  if (!show) return null;

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog" style={{ maxWidth: '900px' }}>
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Crear Paquete de Donaciones</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          {descripcionPedido && (
            <div className="alert alert-info">
              <strong>Pedido seleccionado:</strong> {descripcionPedido}
            </div>
          )}

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Nombre del Paquete</label>
              <input
                type="text"
                className="form-control"
                value={nombrePaquete}
                onChange={(e) => setNombrePaquete(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <h5>Seleccionar Donaciones en Especie</h5>

            <div className="row mb-3">
              <div className="col-md-6">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Buscar artículo"
                  value={busquedaArticulo}
                  onChange={(e) => setBusquedaArticulo(e.target.value)}
                />
              </div>
              <div className="col-md-6">
                <select
                  className="form-select"
                  value={unidadFiltro}
                  onChange={(e) => setUnidadFiltro(e.target.value)}
                >
                  <option value="">Todas las unidades</option>
                  {unidades.map(unidad => (
                    <option key={unidad.id_unidad} value={unidad.id_unidad}>
                      {unidad.simbolo} — {unidad.nombre_unidad}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th></th>
                    <th>Artículo</th>
                    <th>Cantidad Disponible</th>
                    <th>Cantidad Asignada</th>
                    <th>Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {donacionesFiltradas.map(don => {
                    const seleccionada = seleccionadas.find(s => s.id_donacion_especie === don.id_donacion_especie);
                    return (
                      <tr key={don.id_donacion_especie}>
                        <td>
                          <input
                            type="checkbox"
                            checked={!!seleccionada}
                            disabled={don.cantidad_restante <= 0}
                            onChange={() => toggleSeleccion(don)}
                          />
                        </td>
                        <td>{getArticuloNombre(don.id_articulo)}</td>
                        <td>{don.cantidad_restante}</td>
                        <td>
                          {seleccionada ? (
                            <input
                              type="number"
                              min="1"
                              max={don.cantidad_restante}
                              value={seleccionada.cantidad_asignada}
                              onChange={e => handleCantidadChange(don.id_donacion_especie, Number(e.target.value))}
                            />
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          {unidades.find(u => u.id_unidad === don.id_unidad)?.simbolo || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 🔥 SECCIÓN ADMIN - DISTRIBUCIÓN */}
            {localStorage.getItem('rol') === '1' && pedidoPreseleccionado && (
              <div className="admin-distribucion mt-4 p-3 border rounded bg-light">
                <h6>🔧 Modo Administración - Distribución Rápida</h6>
                <p className="text-muted small">
                  Crea múltiples paquetes para esta solicitud asignados a diferentes almacenes.
                </p>
                
                <button 
                  className="btn btn-outline-info btn-sm me-2"
                  onClick={async () => {
                    // Ejemplo de distribución - puedes hacerlo más complejo
                    const distribucion = {
                      'NORTE': seleccionadas.slice(0, Math.ceil(seleccionadas.length / 2)),
                      'SUR': seleccionadas.slice(Math.ceil(seleccionadas.length / 2))
                    };
                    
                    await crearPaquetesDistribucionAdmin(
                      { 
                        codigo: pedidoPreseleccionado, 
                        descripcion: descripcionPedido,
                        id: pedidoPreseleccionado 
                      },
                      distribucion
                    );
                    
                    alert('✅ Paquetes distribuidos a almacenes');
                    onPaqueteCreado();
                    onClose();
                  }}
                >
                  🎯 Distribuir a Almacenes
                </button>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={crearPaquete}>Confirmar Paquete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaqueteFormModal;