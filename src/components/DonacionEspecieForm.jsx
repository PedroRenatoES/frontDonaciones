import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Select from 'react-select';
import axios from '../axios';

function DonacionEspecieForm({ data, setData, articulos, almacenes, fieldErrors = {}, setFieldErrors }) {
  const [espaciosFiltrados, setEspaciosFiltrados] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [modalArticuloAbierto, setModalArticuloAbierto] = useState(false); // Estado para el modal
  const [categorias, setCategorias] = useState([]); // Estado para las categorías
  const [catalogo, setCatalogo] = useState([]); // Lista del catálogo para el modal
  const [modalError, setModalError] = useState('');
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [estantes, setEstantes] = useState([]); // Estado para los estantes
  const [nuevoArticulo, setNuevoArticulo] = useState({
    nombre_articulo: '',
    descripcion: '',
    id_categoria: ''
  });
  const nombreAlmacenLS = localStorage.getItem('almacen'); // Restauré el uso de esta variable

  const almacenUsuario = almacenes.find(alm => alm.nombre_almacen === nombreAlmacenLS); // Definí correctamente `almacenUsuario`

  const esRopa = useCallback(() => {
    const articulo = articulos.find(a => a.id_articulo === data.id_articulo);
    return articulo?.id_categoria === 1;
  }, [articulos, data.id_articulo]); // Envolví `esRopa` en un useCallback para evitar problemas de dependencias

  const opcionesArticulos = articulos.map(art => ({
    value: art.id_articulo,
    label: art.nombre_articulo
  })); // Restauré la definición de `opcionesArticulos`

  // Obtener estantes del almacén actual
  useEffect(() => {
    const fetchEstantes = async () => {
      if (almacenUsuario?.id_almacen) {
        try {
          const res = await axios.get(`/estantes/almacen/${almacenUsuario.id_almacen}`);
          setEstantes(res.data);
        } catch (error) {
          console.error('Error al obtener estantes del almacén:', error);
          setEstantes([]);
        }
      } else {
        setEstantes([]);
      }
    };

    fetchEstantes();
  }, [almacenUsuario]);

  // Obtener espacios por estante seleccionado
  useEffect(() => {
    const fetchEspacios = async () => {
      if (data.id_estante) {
        try {
          const res = await axios.get(`/espacios/estante/${data.id_estante}`);
          setEspaciosFiltrados(res.data);
        } catch (error) {
          console.error('Error al obtener espacios del estante:', error);
          setEspaciosFiltrados([]);
        }
      } else {
        setEspaciosFiltrados([]);
      }
    };

    fetchEspacios();
  }, [data.id_estante]);

  useEffect(() => {
    const fetchUnidades = async () => {
      try {
        const res = await axios.get('/unidades');
        setUnidades(res.data);
      } catch (err) {
        console.error('Error cargando unidades:', err);
      }
    };
  
    fetchUnidades();
  }, []);
  

  useEffect(() => {
    if (esRopa()) {
      const fetchRopaInfo = async () => {
        try {
          const [genRes, tallasRes] = await Promise.all([
            axios.get('/donacionesRopa/generos'),
            axios.get('/donacionesRopa/tallas'),
          ]);
          setGeneros(genRes.data);
          setTallas(tallasRes.data);
        } catch (err) {
          console.error('Error cargando géneros o tallas:', err);
        }
      };

      fetchRopaInfo();
    }
  }, [data.id_articulo, esRopa]); // Agregué 'esRopa' como dependencia para resolver el error de lint

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const response = await axios.get('/categorias');
        setCategorias(response.data);
      } catch (error) {
        console.error('Error al obtener las categorías:', error);
      }
    };

    fetchCategorias();
  }, []);

  const handleCrearArticulo = async () => {
    try {
      await axios.post('/catalogo', nuevoArticulo);
      setNuevoArticulo({ nombre_articulo: '', descripcion: '', id_categoria: '' });
      // refrescar catálogo para mostrar el nuevo artículo inmediatamente
      await fetchCatalogo();
      showToast('Artículo creado con éxito', 'success');
    } catch (error) {
      console.error('Error al crear el artículo:', error);
      showToast('No se pudo crear el artículo', 'error');
    }
  };

  // Fetch catálogo helper so we can call it from multiple places
  const fetchCatalogo = async () => {
    try {
      const res = await axios.get('/catalogo');
      setCatalogo(res.data || []);
    } catch (err) {
      console.error('Error cargando catálogo:', err);
      setCatalogo([]);
    }
  };

  // Cargar catálogo cuando se abre el modal
  useEffect(() => {
    if (modalArticuloAbierto) fetchCatalogo();
  }, [modalArticuloAbierto]);

  const handleEliminarArticulo = async (id) => {
    setModalError('');
    try {
      await axios.delete(`/catalogo/${id}`);
      // refrescar lista
      await fetchCatalogo();
      showToast('Artículo eliminado', 'success');
    } catch (err) {
      console.error('Error eliminando artículo:', err);
      // Mostrar mensaje específico cuando el servidor indique que existen donaciones
      const msg = err?.response?.data?.message || '';
      const userMsg = (msg.toLowerCase().includes('donacion') || msg.toLowerCase().includes('donaciones') || err?.response?.status === 409)
        ? 'No se pudo eliminar ya que este articulo contiene donaciones registradas.'
        : 'No se pudo eliminar el artículo.';
      setModalError(userMsg);
      showToast(userMsg, 'error');
    } finally {
      setPendingDeleteId(null);
    }
  };

  const confirmDelete = (id) => {
    setPendingDeleteId(id);
    // clear any modal error when user opens confirmation
    setModalError('');
  };

  const cancelDelete = () => setPendingDeleteId(null);

  // Simple toast helper
  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type }), 3500);
  }

  const opcionesAlmacenes = almacenes.map(alm => ({
    value: alm.id_almacen,
    label: alm.nombre_almacen
  })); // Eliminé el comentario de que no se usa, ya que es necesario

  useEffect(() => {
    if (almacenUsuario) {
      setData(prev => ({ ...prev, id_almacen: almacenUsuario.id_almacen }));
    }
  }, [almacenUsuario, setData]); // Mantuve `almacenUsuario` como dependencia válida

  return (
    <div className="add-donation">
      <h2 style={{ textAlign: 'center' }}>Donación en Especie</h2>
      <div className="donation-form">
        {/* 1. Artículo y Almacén */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Artículo</strong></label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Select
                options={opcionesArticulos}
                placeholder="Seleccione un artículo"
                onChange={(selected) => {
                  setData(prev => ({
                    ...prev,
                    id_articulo: selected?.value || '',
                    id_genero: '',
                    id_talla: ''
                  }));
                  
                  // Limpiar error del artículo cuando el usuario interactúa
                  if (fieldErrors.id_articulo && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      id_articulo: ''
                    }));
                  }
                }}
                value={opcionesArticulos.find(opt => opt.value === data.id_articulo) || null}
                isClearable
                styles={{ 
                  container: (base) => ({ 
                    ...base, 
                    flex: 1,
                    ...(fieldErrors.id_articulo && {
                      '& .react-select__control': {
                        borderColor: '#dc2626',
                        boxShadow: '0 0 0 2px rgba(220, 38, 38, 0.1)'
                      }
                    })
                  }) 
                }}
                className={fieldErrors.id_articulo ? 'field-error' : ''}
              />
              <button
                onClick={() => setModalArticuloAbierto(true)}
                style={{
                  marginLeft: '0.5rem',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '5px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
            {fieldErrors.id_articulo && (
              <div className="field-error-message">{fieldErrors.id_articulo}</div>
            )}
          </div>

          <div className="mb-3">
            <label><strong>Almacén asignado</strong></label>
            {almacenUsuario ? (
              <div className="almacenes-grid">
                <div className="almacen-card selected">
                  <div className="almacen-icon">🏬</div>
                  <div className="almacen-nombre">{almacenUsuario.nombre_almacen}</div>
                </div>
              </div>
            ) : (
              <div className="text-muted">No se encontró el almacén asignado.</div>
            )}
          </div>

          {/* Nuevo campo para estantes en cuadros */}
          <div className="mb-3">
            <label><strong>Seleccione un estante</strong></label>
            {estantes.length === 0 ? (
              <div className="text-muted">No hay estantes disponibles en este almacén.</div>
            ) : (
              <div className="almacenes-grid">
                {estantes.map(est => (
                  <div
                    key={est.id_estante}
                    className={`almacen-card ${data.id_estante === est.id_estante ? 'selected' : ''}`}
                    onClick={() => {
                      setData(prev => ({
                        ...prev,
                        id_estante: est.id_estante,
                        id_espacio: '' // Limpiar espacio seleccionado al cambiar estante
                      }));
                    }}
                  >
                    <div className="almacen-icon">🗄️</div>
                    <div className="almacen-nombre">{est.nombre}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 2. Espacio en el almacén */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Seleccione un espacio en el almacén</strong></label>
            {!data.id_estante ? (
              <div className="text-muted">Seleccione un estante para ver sus espacios disponibles.</div>
            ) : espaciosFiltrados.length === 0 ? (
              <div className="text-muted">No hay espacios disponibles en este estante.</div>
            ) : (
              <div className="espacios-grid">
                {espaciosFiltrados.map(esp => (
                  <div
                    key={esp.id_espacio}
                    className={`espacio-card ${data.id_espacio === esp.id_espacio ? 'selected' : ''} ${esp.lleno ? 'lleno' : ''}`}
                    onClick={() => {
                      if (!esp.lleno) {
                        setData({ ...data, id_espacio: esp.id_espacio });
                      }
                    }}
                  >
                    <div className="espacio-icon">📦</div>
                    <div className="espacio-codigo">{esp.codigo}</div>
                    {esp.lleno && <div className="espacio-status">Lleno</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
          {fieldErrors.id_espacio && (
            <div className="field-error-message">{fieldErrors.id_espacio}</div>
          )}
        </div>

        {/* 3. Detalles del artículo */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Cantidad</strong></label>
            <input
              type="number"
              className={`form-control ${fieldErrors.cantidad ? 'field-error' : ''}`}
              placeholder="Cantidad"
              min="1"
              value={data.cantidad}
              onChange={e => {
                const valor = e.target.value;
                if (parseFloat(valor) >= 0 || valor === '') {
                  setData({ ...data, cantidad: valor });
                  
                  // Limpiar error de la cantidad cuando el usuario interactúa
                  if (fieldErrors.cantidad && setFieldErrors) {
                    setFieldErrors(prev => ({
                      ...prev,
                      cantidad: ''
                    }));
                  }
                }
              }}
            />
            {fieldErrors.cantidad && (
              <div className="field-error-message">{fieldErrors.cantidad}</div>
            )}
          </div>

          
          <div className="mb-3">
            <label><strong>Unidad de medida</strong></label>
            <select
              className={`form-select ${fieldErrors.id_unidad ? 'field-error' : ''}`}
              value={data.id_unidad}
              onChange={e => {
                setData({ ...data, id_unidad: parseInt(e.target.value) });
                
                // Limpiar error de la unidad cuando el usuario interactúa
                if (fieldErrors.id_unidad && setFieldErrors) {
                  setFieldErrors(prev => ({
                    ...prev,
                    id_unidad: ''
                  }));
                }
              }}
            >
              <option value="">Seleccione unidad</option>
              {unidades.map(u => (
                <option key={u.id_unidad} value={u.id_unidad}>
                  {u.nombre_unidad} ({u.simbolo})
                </option>
              ))}
            </select>
            {fieldErrors.id_unidad && (
              <div className="field-error-message">{fieldErrors.id_unidad}</div>
            )}
          </div>

          <div className="mb-3">
            <label><strong>Estado del artículo</strong></label>
            <select
              className={`form-select ${fieldErrors.estado_articulo ? 'field-error' : ''}`}
              value={data.estado_articulo}
              onChange={e => {
                setData({ ...data, estado_articulo: e.target.value });
                
                // Limpiar error del estado cuando el usuario interactúa
                if (fieldErrors.estado_articulo && setFieldErrors) {
                  setFieldErrors(prev => ({
                    ...prev,
                    estado_articulo: ''
                  }));
                }
              }}
            >
              <option value="">Seleccione estado</option>
              {esRopa() ? (
                <>
                  <option value="Nuevo">Nuevo</option>
                  <option value="Usado">Usado</option>
                  <option value="NA">NA</option>
                </>
              ) : (
                <>
                  <option value="sellado">Sellado</option>
                  <option value="abierto">Abierto</option>
                </>
              )}
            </select>
            {fieldErrors.estado_articulo && (
              <div className="field-error-message">{fieldErrors.estado_articulo}</div>
            )}
          </div>

          <div className="mb-3">
            <label><strong>Fecha de vencimiento (opcional)</strong></label>
            <input
              type="date"
              className="form-control"
              value={data.fecha_vencimiento || ''}
              onChange={e => setData({ ...data, fecha_vencimiento: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

        </div>

        {/* 4. Solo para ropa */}
        {esRopa() && (
          <div className="form-section">
            <div className="mb-3">
              <label><strong>Género</strong></label>
              <select
                className="form-select"
                value={data.id_genero}
                onChange={e => setData({ ...data, id_genero: parseInt(e.target.value) })}
              >
                <option value="">Seleccione género</option>
                {generos.map(g => (
                  <option key={g.id_genero} value={g.id_genero}>
                    {g.nombre_genero}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label><strong>Talla</strong></label>
              <select
                className="form-select"
                value={data.id_talla}
                onChange={e => setData({ ...data, id_talla: parseInt(e.target.value) })}
              >
                <option value="">Seleccione talla</option>
                {tallas.map(t => (
                  <option key={t.id_talla} value={t.id_talla}>
                    {t.valor_talla}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {modalArticuloAbierto && (
        <div>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1050 }} onClick={() => setModalArticuloAbierto(false)} />

          {/* Modal centered */}
              {createPortal(
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1060 }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={() => setModalArticuloAbierto(false)} />

                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 'min(1100px, 96%)', maxHeight: '85vh', overflow: 'auto', padding: '1rem' }} role="dialog" aria-modal="true">
                    <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 12px 32px rgba(0,0,0,0.25)', display: 'flex', gap: '1rem', padding: '1rem', maxHeight: '80vh', overflow: 'hidden' }}>
                      {/* Left: Crear artículo (form) */}
                      <div style={{ flex: '1 1 420px', minWidth: '300px', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0 }}>Crear Nuevo Artículo</h4>
                          <button onClick={() => setModalArticuloAbierto(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}>×</button>
                        </div>

                        <div style={{ marginTop: '0.75rem' }}>
                          <div className="form-group">
                            <label>Nombre del Artículo</label>
                            <input
                              type="text"
                              value={nuevoArticulo.nombre_articulo}
                              onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, nombre_articulo: e.target.value })}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Descripción</label>
                            <textarea
                              value={nuevoArticulo.descripcion}
                              onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, descripcion: e.target.value })}
                              className="form-control"
                            />
                          </div>
                          <div className="form-group">
                            <label>Categoría</label>
                            <select
                              value={nuevoArticulo.id_categoria}
                              onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, id_categoria: e.target.value })}
                              className="form-control"
                            >
                              <option value="">Seleccione una categoría</option>
                              {categorias.map((categoria) => (
                                <option key={categoria.id_categoria} value={categoria.id_categoria}>
                                  {categoria.nombre_categoria}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={handleCrearArticulo} className="btn btn-success">Crear</button>
                            <button onClick={() => setModalArticuloAbierto(false)} className="btn btn-secondary">Cancelar</button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Lista catálogo */}
                      <div style={{ flex: '1 1 420px', minWidth: '300px', maxHeight: 'calc(80vh - 40px)', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0 }}>Catálogo</h4>
                        </div>

                        {modalError && <div style={{ marginTop: '0.5rem' }} className="alert alert-danger">{modalError}</div>}

                        <div style={{ marginTop: '0.5rem', display: 'grid', gap: '0.5rem' }}>
                          {catalogo.length === 0 ? (
                            <div className="text-muted">No hay artículos en el catálogo.</div>
                          ) : (
                            catalogo.map(item => (
                              <div key={item.id_articulo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid #e9ecef', borderRadius: '6px' }}>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{item.nombre_articulo}</div>
                                  <div className="text-muted" style={{ fontSize: '0.9rem' }}>{item.descripcion}</div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  {pendingDeleteId === item.id_articulo ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                      <span className="text-muted" style={{ flex: '1 1 160px', minWidth: '120px', marginRight: '0.5rem', lineHeight: 1.2 }}>¿Deseas borrar este producto?</span>
                                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
                                        <button className="btn btn-sm btn-danger" onClick={() => handleEliminarArticulo(item.id_articulo)}>Sí, eliminar</button>
                                        <button className="btn btn-sm btn-secondary" onClick={cancelDelete}>Cancelar</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button className="btn btn-sm btn-danger" onClick={() => confirmDelete(item.id_articulo)}>Eliminar</button>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>, document.body)
              }
        </div>
      )}

      {toast.visible && createPortal(
        <div style={{ position: 'fixed', right: '1rem', bottom: '1rem', zIndex: 2000 }}>
          <div style={{ minWidth: '220px', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fff', backgroundColor: toast.type === 'success' ? '#28a745' : '#dc3545', boxShadow: '0 6px 18px rgba(0,0,0,0.2)' }}>
            {toast.message}
          </div>
        </div>, document.body)}

    </div>
  );
}

export default DonacionEspecieForm;
