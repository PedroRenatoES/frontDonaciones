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
  idPedidoLocal, fuenteExterna
}) {
  const [nombrePaquete, setNombrePaquete] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(pedidoPreseleccionado || ''); // Asignamos la prop a estado
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
          const res = await axios.get('/donaciones-en-especie');
          setDonacionesEspecie(res.data);
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
      setPedidoSeleccionado(pedidoPreseleccionado || ''); // Restablecer el estado con la nueva prop
      setSeleccionadas([]);
      setBusquedaArticulo('');
      setUnidadFiltro('');
    }
  }, [show, pedidoPreseleccionado]); // Asegurarse de que el modal se actualice si la prop cambia

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

  const crearPaquete = async () => {
    const nombreNormalizado = nombrePaquete.trim().toLowerCase();
  
    if (!nombreNormalizado || seleccionadas.length === 0) {
      alert('Debe ingresar un nombre y al menos una donación.');
      return;
    }
  
    let idPedidoReal = idPedidoLocal || pedidoSeleccionado;
    if (typeof idPedidoReal === 'string') {
      const match = idPedidoReal.match(/(?:INTERNAL|EXT)-(\d+)/);
      if (match) {
        idPedidoReal = parseInt(match[1], 10);
      }
    }
  
    const payload = {
      nombre_paquete: nombrePaquete,
      descripcion,
      id_pedido: idPedidoReal,
      donaciones: seleccionadas
    };
  
    console.log('▶ Payload enviado:', payload);
    try {
      await axios.post('/paquetes', payload);
      console.log('✅ Paquete creado localmente con éxito');
    } catch (error) {
      console.error('❌ Error creando paquete en base de datos local:', error.response?.data || error.message);
      alert('❌ Error al crear el paquete localmente');
      return;
    }
  
    const ciUsuario = localStorage.getItem('ci');
    if (!ciUsuario) {
      alert('No se encontró el CI del usuario en el sistema.');
      return;
    }
  
    try {
      if (fuenteExterna === 'api_v1') {
        console.log('▶ Enviando a API v1...');
        console.log('📦 ID del pedido externo (pedidoSeleccionado):', pedidoSeleccionado);
        console.log('📨 Body enviado:', { ciUsuario });
  
        await axiosPublic.post(`/api_v1/donaciones/armado/${pedidoSeleccionado}`, {
          ciUsuario
        });
  
        console.log('✅ Pedido enviado a API v1');
  
      } else if (fuenteExterna === 'graphql') {
        console.log('▶ Enviando a GraphQL...');
  
        await axiosPublic.post(
          'http://34.28.246.100:4000/',
          {
            query: `
              mutation Mutation($editarRecursoId: ID!, $input: inputEditarRecurso) {
                editarRecurso(id: $editarRecursoId, input: $input) {
                  lat
                  lng
                  estado_del_pedido
                }
              }
            `,
            variables: {
              editarRecursoId: pedidoSeleccionado,
              input: {
                estado_del_pedido: true,
                lat: -17.74850213,
                lng: -63.16328965
              }
            }
          },
          {
            headers: {

            }
          }
        );
        
  
        console.log('✅ Pedido enviado a GraphQL');
  
      } else {
        console.warn('⚠ Fuente externa no reconocida:', fuenteExterna);
      }
  
      alert('Paquete creado con éxito y enviado a plataforma externa');
      onPaqueteCreado();
      onClose();
    } catch (error) {
      console.error('❌ Error al enviar a fuente externa:', error.response?.data || error.message);
      alert('⚠ Paquete creado localmente, pero falló el envío a la plataforma externa');
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
                            {
                              unidades.find(u => u.id_unidad === don.id_unidad)?.simbolo || '—'
                            }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
