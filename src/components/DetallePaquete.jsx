import React, { useState, useMemo } from 'react';
import axios from '../axios';
import axiosPublic from '../axiosPublic';
import ListaCajasPorPaquete from './ListaCajasPorPaquete';

const DetallePaquete = ({ paquete, productos, volver }) => {
  const [seleccionados, setSeleccionados] = useState([]);
  const [refreshCajas, setRefreshCajas] = useState(Date.now());
  const [cajas, setCajas] = useState([]); // Estado para cajas actuales
  const [creando, setCreando] = useState(false);
  const [enviando, setEnviando] = useState(false);

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
    let cantidad = Number(valor);
    const disponible = cantidadDisponibleReal(nombre_articulo);
    if (cantidad < 1) cantidad = 1;
    if (cantidad > disponible) cantidad = disponible;

    setSeleccionados(prev =>
      prev.map(p =>
        p.nombre_articulo === nombre_articulo ? { ...p, cantidad_asignada: cantidad } : p
      )
    );
  };

  const crearCaja = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (creando) return;

    setCreando(true);

    if (seleccionados.length === 0) {
      alert('Selecciona al menos un producto');
      setCreando(false);
      return;
    }

    // Validar cantidades asignadas respecto a disponible real
    for (const p of seleccionados) {
      const disponible = cantidadDisponibleReal(p.nombre_articulo);
      if (p.cantidad_asignada < 1) {
        alert('La cantidad asignada debe ser al menos 1 en cada producto seleccionado');
        setCreando(false);
        return;
      }
      if (p.cantidad_asignada > disponible) {
        alert(`La cantidad asignada para ${p.nombre_articulo} excede la cantidad disponible (${disponible})`);
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

      alert(`Caja creada: ${res.data.id_caja}`);
      setRefreshCajas(Date.now());
      setSeleccionados([]);
    } catch (error) {
      console.error('Error creando caja:', error);
      alert('Hubo un error al crear la caja');
    } finally {
      setCreando(false);
    }
  };

  const marcarComoEnviado = async () => {
    if (enviando) return;

    // Validar que para cada producto las cantidades asignadas coincidan con la cantidad total
    for (const prod of productos) {
      const asignado = cantidadesAsignadas[prod.nombre_articulo] || 0;
      if (asignado !== prod.cantidad) {
        alert(`No se puede marcar como enviado: El producto "${prod.nombre_articulo}" tiene ${asignado} asignados pero la cantidad total es ${prod.cantidad}`);
        return;
      }
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

  return (
    <div>
      <h4>Crear caja para: {paquete.nombre_paquete}</h4>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Unidad</th>
            <th>Disponible</th>
            <th>Asignar</th>
            <th>Seleccionar</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(prod => {
            const seleccionado = seleccionados.find(p => p.nombre_articulo === prod.nombre_articulo);
            const disponibleReal = cantidadDisponibleReal(prod.nombre_articulo);

            return (
              <tr key={prod.nombre_articulo}>
                <td>{prod.nombre_articulo}</td>
                <td>{prod.unidad}</td>
                <td>{disponibleReal}</td>
                <td>
                  <input
                    type="number"
                    min={1}
                    max={disponibleReal}
                    disabled={!seleccionado || disponibleReal === 0}
                    value={seleccionado?.cantidad_asignada || ''}
                    onChange={e => cambiarCantidad(prod.nombre_articulo, e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
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

      <button
        className="btn btn-primary"
        onClick={crearCaja}
        disabled={creando}
      >
        {creando ? 'Creando...' : 'Crear Caja'}
      </button>

      <button className="btn btn-secondary ms-2" onClick={volver}>Cancelar</button>

      <ListaCajasPorPaquete
        idPaquete={paquete.id_paquete}
        refrescarTrigger={refreshCajas}
        setCajas={setCajas}
      />

      <hr />
      <button
        className="btn btn-success mt-3"
        onClick={marcarComoEnviado}
        disabled={enviando}
      >
        {enviando ? 'Enviando...' : 'Marcar como Enviado'}
      </button>
    </div>
  );
};

export default DetallePaquete;
