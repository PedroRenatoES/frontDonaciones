import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import axios from '../axios';

function DonacionEspecieForm({ data, setData, articulos, almacenes, onSubmit }) {
  const [espaciosFiltrados, setEspaciosFiltrados] = useState([]);
  const [tallas, setTallas] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [unidades, setUnidades] = useState([]);


  const esRopa = () => {
    const articulo = articulos.find(a => a.id_articulo === data.id_articulo);
    return articulo?.id_categoria === 1;
  };

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
  }, [data.id_articulo]);

  const handleSubmit = async () => {
    try {
      const res = await onSubmit();
      if (esRopa() && res?.id_donacion_especie && data.id_genero && data.id_talla) {
        await axios.post('/donacionesRopa', {
          id_donacion_especie: res.id_donacion_especie,
          id_genero: data.id_genero,
          id_talla: data.id_talla,
        });
      }
    } catch (err) {
      console.error('Error al guardar la donación de ropa:', err);
    }
  };

  const opcionesAlmacenes = almacenes.map(alm => ({
    value: alm.id_almacen,
    label: alm.nombre_almacen
  }));

  const opcionesArticulos = articulos.map(art => ({
    value: art.id_articulo,
    label: art.nombre_articulo
  }));

  return (
<div className="add-donation">
<h2 style={{ textAlign: 'center' }}>Donación en Especie</h2>
<div className="donation-form">
  {/* 1. Artículo y Almacén */}
  <div className="form-section">
    <div className="mb-3">
      <label><strong>Artículo</strong></label>
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
      />
    </div>

    <div className="mb-3">
      <label><strong>Seleccione un almacén</strong></label>
      <div className="almacenes-grid">
        {almacenes.map(alm => (
          <div
            key={alm.id_almacen}
            className={`almacen-card ${data.id_almacen === alm.id_almacen ? 'selected' : ''}`}
            onClick={() =>
              setData(prev => ({
                ...prev,
                id_almacen: alm.id_almacen,
                destino_donacion: alm.nombre_almacen,
                id_espacio: ''
              }))
            }
          >
            <div className="almacen-icon">🏬</div>
            <div className="almacen-nombre">{alm.nombre_almacen}</div>
          </div>
        ))}
      </div>
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
              {t.nombre_talla}
            </option>
          ))}
        </select>
      </div>
    </div>
  )}
</div>
</div>

  );
}

export default DonacionEspecieForm;
