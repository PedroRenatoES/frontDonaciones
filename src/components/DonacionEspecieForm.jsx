import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import axios from '../axios';

function DonacionEspecieForm({ data, setData, articulos, almacenes }) {
  const [espaciosFiltrados, setEspaciosFiltrados] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [modalArticuloAbierto, setModalArticuloAbierto] = useState(false); // Estado para el modal
  const [categorias, setCategorias] = useState([]); // Estado para las categorías
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

  useEffect(() => {
    const fetchEspacios = async () => {
      if (data.id_almacen) {
        try {
          const res = await axios.get(`/espacios/por-almacen/${data.id_almacen}`);
          setEspaciosFiltrados(res.data);
        } catch (error) {
          console.error('Error al obtener espacios del almacén:', error);
          setEspaciosFiltrados([]);
        }
      } else {
        setEspaciosFiltrados([]);
      }
    };

    fetchEspacios();
  }, [data.id_almacen]);

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
      alert('Artículo creado con éxito');
      setModalArticuloAbierto(false);
      setNuevoArticulo({ nombre_articulo: '', descripcion: '', id_categoria: '' });
    } catch (error) {
      console.error('Error al crear el artículo:', error);
      alert('No se pudo crear el artículo');
    }
  };

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
                }}
                value={opcionesArticulos.find(opt => opt.value === data.id_articulo) || null}
                isClearable
                styles={{ container: (base) => ({ ...base, flex: 1 }) }}
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

        </div>

        {/* 2. Espacio en el almacén */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Seleccione un espacio en el almacén</strong></label>
            {espaciosFiltrados.length === 0 && (
              <div className="text-muted">Seleccione un almacén para ver sus espacios disponibles.</div>
            )}
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
          </div>
        </div>

        {/* 3. Detalles del artículo */}
        <div className="form-section">
          <div className="mb-3">
            <label><strong>Cantidad</strong></label>
            <input
              type="number"
              className="form-control"
              placeholder="Cantidad"
              min="1"
              value={data.cantidad}
              onChange={e => {
                const valor = e.target.value;
                if (parseFloat(valor) >= 0 || valor === '') {
                  setData({ ...data, cantidad: valor });
                }
              }}
            />
          </div>

          
          <div className="mb-3">
            <label><strong>Unidad de medida</strong></label>
            <select
              className="form-select"
              value={data.id_unidad}
              onChange={e => setData({ ...data, id_unidad: parseInt(e.target.value) })}
            >
              <option value="">Seleccione unidad</option>
              {unidades.map(u => (
                <option key={u.id_unidad} value={u.id_unidad}>
                  {u.nombre_unidad} ({u.simbolo})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label><strong>Estado del artículo</strong></label>
            <select
              className="form-select"
              value={data.estado_articulo}
              onChange={e => setData({ ...data, estado_articulo: e.target.value })}
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
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '1rem', borderRadius: '5px', backgroundColor: 'white', maxWidth: '600px', margin: '2rem auto' }}>
            <h4>Crear Nuevo Artículo</h4>
            <div className="form-group">
              <label>Nombre del Artículo</label>
              <input
                type="text"
                value={nuevoArticulo.nombre_articulo}
                onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, nombre_articulo: e.target.value })}
                style={{ marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea
                value={nuevoArticulo.descripcion}
                onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, descripcion: e.target.value })}
                style={{ marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
              />
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <select
                value={nuevoArticulo.id_categoria}
                onChange={(e) => setNuevoArticulo({ ...nuevoArticulo, id_categoria: e.target.value })}
                style={{ marginBottom: '0.5rem', padding: '0.5rem', borderRadius: '5px', border: '1px solid #ccc', width: '100%' }}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id_categoria} value={categoria.id_categoria}>
                    {categoria.nombre_categoria}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleCrearArticulo}
                style={{ marginRight: '0.5rem', padding: '0.5rem 1rem', borderRadius: '5px', backgroundColor: '#28a745', color: 'white', border: 'none' }}
              >
                Crear
              </button>
              <button
                onClick={() => setModalArticuloAbierto(false)}
                style={{ padding: '0.5rem 1rem', borderRadius: '5px', backgroundColor: '#ccc', color: 'black', border: 'none' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DonacionEspecieForm;
