import React, { useState, useEffect } from 'react';
import axios from '../axios';
import axiosPublic from '../axiosPublic';

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
          alert('No se pudieron cargar donaciones, almacenes o catálogo.');
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
    // Validar que la suma asignada para cada artículo sea igual a lo solicitado
    for (const art of articulosPedido) {
      if (sumaAsignada(art.nombre) !== art.cantidad) {
        alert(`Debes asignar exactamente ${art.cantidad} unidades de ${art.nombre}`);
        return;
      }
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
          alert(`[DEBUG] Enviando POST externo a: ${url} con ciUsuario: ${ciUsuario}`);
          await axiosPublic.post(url, {
            ciUsuario: ciUsuario
          });
        } catch (err) {
          console.error('Error al enviar POST externo (aceptar pedido):', err);
          alert('[ERROR] No se pudo enviar el POST externo. Revisa la consola.');
        }
      } else {
        alert(`[DEBUG] No se envió POST externo. ciUsuario: ${ciUsuario}, idDonacion: ${idDonacion}`);
      }

      alert('Paquetes creados correctamente');
      onPaqueteCreado && onPaqueteCreado();
      onClose && onClose();
    } catch (err) {
      alert('Error al crear paquetes');
    }
  };

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-dialog" style={{ maxWidth: '1100px' }}>
        <div className="modal-content p-3">
          <div className="modal-header">
            <h5 className="modal-title">Asignar Donaciones a Almacenes</h5>
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
              <input type="text" className="form-control" value={codigoPedido} disabled />
              <div className="form-text">El nombre del paquete es el código de la solicitud y no puede cambiarse.</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Descripción</label>
              <textarea
                className="form-control"
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
              />
            </div>
            <h5>Asignar artículos desde donaciones disponibles</h5>
            {articulosPedido.map((art, idx) => {
              const porAlmacen = asignacion[art.nombre] || {};
              return (
                <div key={art.nombre + idx} style={{ marginBottom: 32, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1em', marginBottom: 8 }}>{art.nombre} <span style={{ color: '#888', fontWeight: 'normal' }}>(Requerido: {art.cantidad})</span></div>
                  <table className="table table-bordered">
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
                              type="number"
                              min={0}
                              max={info.stock}
                              value={info.cantidad_asignada}
                              onChange={e => handleAsignacionChange(art.nombre, idAlmacen, e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ color: sumaAsignada(art.nombre) === art.cantidad ? 'green' : 'red', fontWeight: 'bold' }}>
                    Total asignado: {sumaAsignada(art.nombre)} / {art.cantidad}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleCrearPaquetes}>Confirmar Asignación</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaqueteFormModal;