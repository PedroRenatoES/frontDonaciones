import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Almacen.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Almacenes() {
  const [almacenes, setAlmacenes] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [itemsFiltrados, setItemsFiltrados] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [estantes, setEstantes] = useState([]);
  const [estanteFiltro, setEstanteFiltro] = useState('');
  const [idAlmacenSeleccionado, setIdAlmacenSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoAlmacen, setNuevoAlmacen] = useState({ nombre: '', ubicacion: '' });
  const [estantesAlmacen, setEstantesAlmacen] = useState([]);
  const [estanteSeleccionado, setEstanteSeleccionado] = useState(null);
  const [espaciosEstante, setEspaciosEstante] = useState([]);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nuevoEstante, setNuevoEstante] = useState({
    nombre: '',
    cantidad_filas: '',
    cantidad_columnas: ''
  });
  const [espacioFiltro, setEspacioFiltro] = useState('');

  
  

  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const resAlmacenes = await axios.get('/almacenes');
        const resCategorias = await axios.get('/categorias');
        setAlmacenes(resAlmacenes.data);
        setCategorias(resCategorias.data);
        filterItems(resAlmacenes.data);
      } catch (error) {
        console.error('Error al obtener los almacenes o categorías:', error);
      }
    };

    const fetchEstantes = async () => {
      if (!idAlmacenSeleccionado) {
        setEstantes([]);
        setEstanteFiltro('');
        return;
      }
  
      try {
        const res = await axios.get(`/almacenes/${idAlmacenSeleccionado}`);
        setEstantes(res.data.estantes || []);
      } catch (error) {
        console.error('Error al obtener estantes del almacén:', error);
        setEstantes([]);
      }
    };
  
  
    fetchAlmacenes();
    fetchEstantes();
    filterItems(); // sigue aplicando el filtro general
  }, [idAlmacenSeleccionado]);

  const fetchEstantesDeAlmacen = async () => {
    if (!idAlmacenSeleccionado) return;
    try {
      const res = await axios.get(`/estantes/almacen/${idAlmacenSeleccionado}`);
      setEstantesAlmacen(res.data);
      setEstanteSeleccionado(null); // 👈 LIMPIAR SELECCIÓN
      setEspaciosEstante([]);       // 👈 LIMPIAR ESPACIOS
    } catch (error) {
      console.error('Error al obtener estantes del almacén:', error);
    }
  };
  
  const fetchEspaciosDeEstante = async (id_estante) => {
    try {
      const res = await axios.get(`/espacios/estante/${id_estante}`);
      setEspaciosEstante(res.data);
    } catch (error) {
      console.error('Error al obtener espacios del estante:', error);
    }
  };
  
  const handleSeleccionarEstante = (estante) => {
    const mismoEstante = estanteSeleccionado?.id_estante === estante.id_estante;
  
    setEstanteSeleccionado(mismoEstante ? null : estante);
    setEstanteFiltro(mismoEstante ? '' : estante.nombre);
    setEspacioFiltro(''); // Limpia el espacio si se cambia el estante
  
    if (!mismoEstante) {
      fetchEspaciosDeEstante(estante.id_estante);
    } else {
      setEspaciosEstante([]);
    }
  };
  
  
  const handleEliminarEstante = async (id_estante) => {
    try {
      await axios.delete(`/estantes/${id_estante}`);
      fetchEstantesDeAlmacen();
      setEstanteSeleccionado(null);
      setEspaciosEstante([]);
    } catch (error) {
      console.error('Error al eliminar el estante:', error);
    }
  };

  const handleSeleccionarEspacio = (codigoEspacio) => {
    setEspacioFiltro(prev => (prev === codigoEspacio ? '' : codigoEspacio));
  };
  
  const handleEliminarEspacio = async (id_espacio) => {
    try {
      await axios.delete(`/espacios/${id_espacio}`);
      fetchEspaciosDeEstante(estanteSeleccionado.id_estante);
    } catch (error) {
      console.error('Error al eliminar el espacio:', error);
    }
  };
  

  const filterItems = async () => {
    try {
      const res = await axios.get('/almacenes/con-contenido'); // nuevo endpoint
      const data = res.data;
  
      let articulos = [];
  
      data.forEach(almacen => {
        // Filtro por almacén
        if (idAlmacenSeleccionado && almacen.id_almacen !== idAlmacenSeleccionado) return;
  
        Object.values(almacen.estantes).forEach(estante => {
          // Filtro por estante
          if (estanteSeleccionado && estante.id_estante !== estanteSeleccionado.id_estante) return;
  
          Object.values(estante.espacios).forEach(espacio => {
            // Filtro por espacio (opcional)
            if (espacioFiltro && espacio.codigo_espacio !== espacioFiltro) return;
  
            espacio.articulos.forEach(articulo => {
              // Agregamos la ubicación a cada artículo
              articulos.push({
                ...articulo,
                ubicacion: {
                  espacio: espacio.codigo_espacio,
                  estante: estante.nombre_estante,
                  almacen: almacen.nombre_almacen
                }
              });
            });
          });
        });
      });
  
      // Agrupamos por artículo
      const agrupados = {};
  
      articulos.forEach(a => {
        const key = a.id_articulo;
  
        if (!agrupados[key]) {
          agrupados[key] = {
            id_articulo: a.id_articulo,
            nombre_articulo: a.nombre_articulo,
            nombre_categoria: a.nombre_categoria,
            nombre_unidad: a.nombre_unidad,
            cantidad_total: 0,
            ubicaciones: []
          };
        }
  
        agrupados[key].cantidad_total += a.cantidad;
        agrupados[key].ubicaciones.push(a.ubicacion);
      });
  
      // Filtro por categoría (si aplica)
      let resultado = Object.values(agrupados);
      if (categoriaFiltro) {
        resultado = resultado.filter(item => item.nombre_categoria === categoriaFiltro);
      }
  
      setItemsFiltrados(resultado);
    } catch (error) {
      console.error('Error al obtener los artículos:', error);
    }
  };
  
  
  const handleCrearAlmacen = async () => {
    try {
      await axios.post('/almacenes', {
        nombre_almacen: nuevoAlmacen.nombre,
        ubicacion: nuevoAlmacen.ubicacion
      });
  
      // Limpiar campos y cerrar modal
      setNuevoAlmacen({ nombre: '', ubicacion: '' });
      setModalVisible(false);
  
      // Refrescar lista de almacenes
      const res = await axios.get('/almacenes');
      setAlmacenes(res.data);
    } catch (error) {
      console.error('Error al crear el almacén:', error);
    }
  };
  const handleAbrirModalCrearEstante = () => {
    setMostrarModalCrear(true);
  };
  
  const handleCerrarModalCrearEstante = () => {
    setMostrarModalCrear(false);
    setNuevoEstante({ nombre: '', cantidad_filas: '', cantidad_columnas: '' });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoEstante(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCrearEstante = async () => {
    const { nombre, cantidad_filas, cantidad_columnas } = nuevoEstante;
    if (!nombre || !cantidad_filas || !cantidad_columnas) {
      alert('Todos los campos son obligatorios');
      return;
    }
  
    try {
      await axios.post('/estantes', {
        id_almacen: idAlmacenSeleccionado,
        nombre,
        cantidad_filas: parseInt(cantidad_filas, 10),
        cantidad_columnas: parseInt(cantidad_columnas, 10)
      });
      fetchEstantesDeAlmacen();
      handleCerrarModalCrearEstante();
    } catch (error) {
      console.error('Error al crear estante:', error);
      alert('No se pudo crear el estante');
    }
  };
  
  

  useEffect(() => {
    filterItems();
    if (idAlmacenSeleccionado) {
      fetchEstantesDeAlmacen();
    } else {
      setEstantesAlmacen([]);
      setEstanteSeleccionado(null);
      setEspaciosEstante([]);
    }
  }, [categoriaFiltro, almacenFiltro, estanteFiltro, espacioFiltro, idAlmacenSeleccionado]);
  
  // ✅ Esta función ahora está dentro del componente y puede acceder a itemsFiltrados
  const generarPDF = () => {
    const doc = new jsPDF();
    const fechaActual = new Date().toLocaleString('es-MX'); // Fecha y hora en formato local
  
    doc.setFontSize(18);
    doc.text('Inventario de Almacén', 14, 22);
  
    doc.setFontSize(11);
    doc.text(`Generado el: ${fechaActual}`, 14, 30); // Línea nueva
  
    const rows = [];
  
    itemsFiltrados.forEach(item => {
      const ubicacionesTexto = item.ubicaciones
        .map(u => `${u.espacio} – ${u.estante} – ${u.almacen}`)
        .join(', ');
  
      rows.push([
        item.nombre_articulo,
        item.nombre_categoria,
        item.nombre_unidad,
        item.cantidad_total,
        ubicacionesTexto
      ]);
    });
  
    autoTable(doc, {
      head: [['Artículo', 'Categoría', 'Unidad', 'Cantidad', 'Ubicaciones']],
      body: rows,
      startY: 38,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });
    
  
    doc.save('inventario_almacen.pdf');
  };
  

  return (
      <div className="almacen">
        <h1>Almacenes y Artículos</h1>

        <div className="row mb-3">
    {/* Filtros */}
    <div className="col-md-6 mb-2">
      <label htmlFor="categoriaFiltro" className="form-label">Filtrar por Categoría</label>
      <select
        id="categoriaFiltro"
        className="form-select"
        value={categoriaFiltro}
        onChange={e => setCategoriaFiltro(e.target.value)}
      >
        <option value="">Todas las categorías</option>
        {categorias.map(cat => (
          <option key={cat.id_categoria} value={cat.nombre_categoria}>{cat.nombre_categoria}</option>
        ))}
      </select>
    </div>

    {/* Botón para abrir el modal */}
    <div className="col-md-6 mb-2 d-flex align-items-end justify-content-end">
      <button className="btn btn-success" onClick={() => setModalVisible(true)}>
        Crear Nuevo Almacén
      </button>
    </div>
  </div>

{/* Modal para crear un nuevo almacén */}
{modalVisible && (
  <div className="almacen-modal-backdrop">
    <div className="almacen-modal-content">
      <h2>Crear Nuevo Almacén</h2>
      <div className="mb-3">
        <label htmlFor="nombreAlmacen" className="form-label">Nombre del Almacén</label>
        <input
          type="text"
          id="nombreAlmacen"
          className="form-control"
          value={nuevoAlmacen.nombre}
          onChange={(e) => setNuevoAlmacen({ ...nuevoAlmacen, nombre: e.target.value })}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ubicacion" className="form-label">Ubicación</label>
        <input
          type="text"
          id="ubicacion"
          className="form-control"
          value={nuevoAlmacen.ubicacion}
          onChange={(e) => setNuevoAlmacen({ ...nuevoAlmacen, ubicacion: e.target.value })}
        />
      </div>
      <div className="almacen-modal-footer">
        <button className="almacen-btn-secundary" onClick={() => setModalVisible(false)}>Cerrar</button>
        <button className="almacen-btn-confirmar" onClick={handleCrearAlmacen}>Crear Almacén</button>
      </div>
    </div>
  </div>
)}

          <div className="mb-3">
    <h5>Seleccionar Almacén</h5>
    <div className="row">
      {almacenes.map(almacen => (
        <div className="col-md-4 mb-3" key={almacen.id_almacen}>
          <div
            className={`card h-100 text-center ${idAlmacenSeleccionado === almacen.id_almacen ? 'border-primary' : ''}`}
          >
            <div className="card-body d-flex flex-column">
    <i className="fas fa-warehouse fa-3x mb-3 text-secondary"></i>
    <h5 className="card-title">{almacen.nombre_almacen}</h5>
    <p className="card-text">{almacen.ubicacion || 'Sin dirección registrada'}</p>

    <button
      className={`btn mt-auto ${idAlmacenSeleccionado === almacen.id_almacen ? 'btn-primary' : 'btn-outline-primary'}`}
      onClick={() => {
        if (idAlmacenSeleccionado === almacen.id_almacen) {
          setIdAlmacenSeleccionado(null);
          setAlmacenFiltro('');
          setEstanteFiltro('');
        } else {
          setIdAlmacenSeleccionado(almacen.id_almacen);
          setAlmacenFiltro(almacen.nombre_almacen);
        }
      }}
    >
      {idAlmacenSeleccionado === almacen.id_almacen ? 'Seleccionado' : 'Seleccionar'}
    </button>
  </div>

          </div>
        </div>
      ))}
    </div>
    {estantesAlmacen.length > 0 && (
  <div className="mt-4">
    <div className="d-flex justify-content-between align-items-center mb-2">
      <h4>Estantes del almacén seleccionado</h4>
      <div>
        <button className="btn btn-success me-2" onClick={handleAbrirModalCrearEstante}>
          Crear Estante
        </button>
        {estanteSeleccionado && (
          <button className="btn btn-danger" onClick={() => handleEliminarEstante(estanteSeleccionado.id_estante)}>
            Eliminar Estante Seleccionado
          </button>
        )}
      </div>
    </div>
    <div className="row">
      {estantesAlmacen.map(estante => (
        <div className="col-md-3 mb-3" key={estante.id_estante}>
          <div
            className={`card text-center ${estanteSeleccionado?.id_estante === estante.id_estante ? 'border-primary' : ''}`}
            onClick={() => handleSeleccionarEstante(estante)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body d-flex flex-column align-items-center">
              <i className="fas fa-table fa-3x mb-3 text-secondary"></i> {/* ícono de estante */}
                <h5 className="card-title">{estante.nombre}</h5>
              <p className="card-text small text-muted mt-2">
                {estante.cantidad_filas} filas x {estante.cantidad_columnas} columnas
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{estanteSeleccionado && (
  <div className="mt-4">
    <h4>Espacios del estante seleccionado</h4>
    <div className="row">
      {espaciosEstante.map(espacio => (
        <div className="col-md-2 mb-2" key={espacio.id_espacio}>
          <div
            className={`card text-center ${espacioFiltro === espacio.codigo ? 'border-primary' : ''}`}
            onClick={() => setEspacioFiltro(prev => prev === espacio.codigo ? '' : espacio.codigo)}
            style={{ cursor: 'pointer' }}
          >
            <div className="card-body p-2">
              <i className="fas fa-square fa-3x mb-3 text-secondary"></i> 
              <h6>{espacio.codigo}</h6>
              <p className={`mb-1 ${espacio.lleno ? 'text-success' : 'text-muted'}`}>
                {espacio.lleno ? 'Lleno' : 'Vacío'}
              </p>
              <button
                className="btn btn-sm btn-danger"
                onClick={(e) => {
                  e.stopPropagation(); // evita seleccionar al hacer click en el botón
                  handleEliminarEspacio(espacio.id_espacio);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


  </div>

        {/* Tabla */}
        <table className="almacenes-table">
          <thead>
            <tr>
              <th>Artículo</th>
              <th>Categoría</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Ubicaciones</th>
            </tr>
          </thead>
          <tbody>
            {itemsFiltrados.length > 0 ? (
              itemsFiltrados.map(item => (
                <tr key={item.id_articulo}>
                  <td>{item.nombre_articulo}</td>
                  <td>{item.nombre_categoria}</td>
                  <td>{item.nombre_unidad}</td>
                  <td>{item.cantidad_total}</td>
                  <td>
                    <ul>
                      {[...new Map(item.ubicaciones.map(u => {
                        const key = `${u.espacio}-${u.estante}-${u.almacen}`;
                        return [key, u];
                      })).values()].map((ubicacion, idx) => (
                        <li key={idx}>
                          {ubicacion.espacio} – {ubicacion.estante} – {ubicacion.almacen}
                        </li>
                      ))}
                    </ul>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center">No hay artículos disponibles para mostrar</td>
              </tr>
            )}
          </tbody>
        </table>

        <button className="btn btn-outline-primary mb-4" onClick={generarPDF}>
          Exportar a PDF
        </button>

        {mostrarModalCrear && (
  <div className="modal show d-block" tabIndex="-1">
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Crear Estante</h5>
          <button type="button" className="btn-close" onClick={handleCerrarModalCrearEstante}></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Nombre del estante</label>
            <input type="text" className="form-control" name="nombre" value={nuevoEstante.nombre} onChange={handleInputChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Cantidad de filas</label>
            <input type="number" className="form-control" name="cantidad_filas" value={nuevoEstante.cantidad_filas} onChange={handleInputChange} />
          </div>
          <div className="mb-3">
            <label className="form-label">Cantidad de columnas</label>
            <input type="number" className="form-control" name="cantidad_columnas" value={nuevoEstante.cantidad_columnas} onChange={handleInputChange} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleCerrarModalCrearEstante}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleCrearEstante}>Crear</button>
        </div>
      </div>
    </div>
  </div>
)}

      </div>

      
    );
  }

  export default Almacenes;
