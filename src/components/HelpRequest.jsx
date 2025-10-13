import React, { useEffect, useState } from 'react';
import PedidoItem from './HelpRequestItem';
import InternalRequestItem from './InternalRequestItem'; 
import '../styles/HelpRequest.css';
import PackageItem from './PackageItem';
import axios from '../axios';

const HelpRequest = () => {
  const [pedidos, setPedidos] = useState([]);
  const [solicitudesInternas, setSolicitudesInternas] = useState([]);
  const [paquetesProceso, setPaquetesProceso] = useState([]);
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [catalogoArticulos, setCatalogoArticulos] = useState([]);
  const [miAlmacen] = useState(localStorage.getItem('almacen'));
  const [ordenAsc, setOrdenAsc] = useState(true);

  const handleEliminarPaquete = (idPaquete) => {
    setPaquetesProceso(prev => prev.filter(p => p.id_paquete !== idPaquete));
  };

  // 🔥 NUEVAS FUNCIONES PARA METADATOS
  const extraerMetadatos = (descripcion) => {
    if (!descripcion) return null;
    // Nuevo formato: CI:...|SOL#...|IDALMACEN:...|ALMACEN:...|
    const matchCI = descripcion.match(/^CI:([^|]+)\|SOL#([^|]+)\|IDALMACEN:([^|]+)\|ALMACEN:([^|]+)\|(.*)$/);
    if (matchCI) {
      return {
        ci: matchCI[1],
        codigo: matchCI[2],
        id_almacen: matchCI[3],
        almacen: matchCI[4],
        descripcionOriginal: matchCI[5] || ''
      };
    }
    // Formato anterior: SOL#...|IDALMACEN:...|ALMACEN:...|
    const match = descripcion.match(/^SOL#([^|]+)\|IDALMACEN:([^|]+)\|ALMACEN:([^|]+)\|(.*)$/);
    if (match) {
      return {
        codigo: match[1],
        id_almacen: match[2],
        almacen: match[3],
        descripcionOriginal: match[4] || ''
      };
    }
    // Compatibilidad con paquetes antiguos
    const matchOld = descripcion.match(/^SOL#([^|]+)\|ALMACEN:([^|]+)\|(.+)?$/);
    return matchOld ? {
      codigo: matchOld[1],
      id_almacen: undefined,
      almacen: matchOld[2],
      descripcionOriginal: matchOld[3] || ''
    } : null;
  };

  const obtenerPaquetesDeMiAlmacen = (paquetes) => {
    const idAlmacenUsuario = localStorage.getItem('id_almacen');
    return paquetes.filter(paquete => {
      const metadatos = extraerMetadatos(paquete.descripcion);
      // Preferir id_almacen si está disponible
      if (metadatos && metadatos.id_almacen) {
        return String(metadatos.id_almacen) === String(idAlmacenUsuario);
      }
      // Fallback: comparar por nombre
      return metadatos && metadatos.almacen === miAlmacen;
    });
  };

  const obtenerPaquetesSinAsignar = (paquetes) => {
    return paquetes.filter(paquete => {
      const metadatos = extraerMetadatos(paquete.descripcion);
      return !metadatos; // Paquetes sin metadatos (antiguos)
    });
  };

  useEffect(() => {
    fetchSolicitudesInternas();
    fetchSolicitudesExternas();
    fetchPaquetes();
    fetchDonacionesEspecie();
    fetchCatalogo();
  }, []);

  const fetchSolicitudesExternas = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/solicitudes/aprobadas/almacen');
      const data = await res.json();
      setPedidos(data);
    } catch (err) {
      console.error('Error al obtener los pedidos:', err);
    }
  };

  const fetchDonacionesEspecie = async () => {
    try {
      const res = await axios.get('/donaciones-en-especie');
      setDonacionesEspecie(res.data);
    } catch (err) {
      console.error('Error al obtener donaciones en especie:', err);
    }
  };
  
  const fetchCatalogo = async () => {
    try {
      const res = await axios.get('/catalogo');
      setCatalogoArticulos(res.data);
    } catch (err) {
      console.error('Error al obtener catálogo:', err);
    }
  };

  const fetchPaquetes = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/paquetes');
      const data = await res.json();
      setPaquetesProceso(data);
    } catch (err) {
      console.error('Error al obtener paquetes:', err);
    }
  };

  const fetchSolicitudesInternas = async () => {
    try {
      const response = await fetch('http://alas-back1.local/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `
            query ObtenerRecursos {
              obtenerRecursos {
                id
                codigo
                descripcion
              }
            }
          `
        })
      });

      const { data } = await response.json();
      setSolicitudesInternas(data.obtenerRecursos || []);
    } catch (error) {
      console.error('Error al obtener solicitudes internas:', error);
      setSolicitudesInternas([]);
    }
  };

  const ordenarPorFecha = () => {
    const sorted = [...pedidos].sort((a, b) =>
      ordenAsc
        ? new Date(a.fecha_pedido) - new Date(b.fecha_pedido)
        : new Date(b.fecha_pedido) - new Date(a.fecha_pedido)
    );
    setPedidos(sorted);
    setOrdenAsc(!ordenAsc);
  };

  // Función para refrescar todas las listas (puede pasarse como prop)
  const refrescarTodo = () => {
    fetchSolicitudesExternas();
    fetchPaquetes();
    fetchDonacionesEspecie();
    fetchCatalogo();
  };

  return (
    <div className="donation-page">
      <h1 className="help-title">Enviar Donaciones</h1>
      <div className="sections">
        {/* ...existing code... */}
        {/* ✅ Sección: Solicitudes Externas */}
        <section className="section">
          <h2>Solicitudes de ayuda Externas</h2>
          <div className="donation-list">
            {Array.isArray(pedidos) && pedidos.map((pedido) => (
              <PedidoItem key={pedido.idDonacion} pedido={pedido} onPaquetesCreados={refrescarTodo} />
            ))}
          </div>
        </section>

        {/* ✅ Sección: Mis Tareas de Almacén - NUEVA (REEMPLAZA Paquetes en Proceso) */}
        <section className="section">
          <h2>🎯 Mis Tareas - {miAlmacen}</h2>
          {obtenerPaquetesDeMiAlmacen(paquetesProceso).length === 0 ? (
            <p>No hay tareas asignadas a tu almacén.</p>
          ) : (
            <div className="donation-list">
              {obtenerPaquetesDeMiAlmacen(paquetesProceso).map((paquete) => (
                <PackageItem
                  key={paquete.id_paquete}
                  paquete={paquete}
                  donacionesEspecie={donacionesEspecie}
                  catalogoArticulos={catalogoArticulos}
                  onCompletarPaquete={handleEliminarPaquete}
                  esTareaAlmacen={true}
                />
              ))}
            </div>
          )}
        </section>

        {/* ✅ Sección: Paquetes Sin Asignar (antiguos) */}
        {obtenerPaquetesSinAsignar(paquetesProceso).length > 0 && (
          <section className="section">
            <h2>📦 Paquetes Sin Asignar</h2>
            <div className="donation-list">
              {obtenerPaquetesSinAsignar(paquetesProceso).map((paquete) => (
                <PackageItem
                  key={paquete.id_paquete}
                  paquete={paquete}
                  donacionesEspecie={donacionesEspecie}
                  catalogoArticulos={catalogoArticulos}
                  onCompletarPaquete={handleEliminarPaquete}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default HelpRequest;