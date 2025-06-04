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
  const handleEliminarPaquete = (idPaquete) => {
  setPaquetesProceso(prev => prev.filter(p => p.id_paquete !== idPaquete));
};

  const [ordenAsc, setOrdenAsc] = useState(true);

  useEffect(() => {
    fetchSolicitudesInternas();
    fetchSolicitudesExternas();
    fetchPaquetes();
    fetchDonacionesEspecie(); // Nuevo
    fetchCatalogo();          // Nuevo
  }, []);
  

const fetchSolicitudesExternas = async () => {
  try {
    const res = await fetch('http://34.123.227.162:8080/api/solicitudes/aprobadas/almacen');
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
      const res = await fetch('/paquetes/');
      const data = await res.json();
      setPaquetesProceso(data);
    } catch (err) {
      console.error('Error al obtener paquetes:', err);
    }
  };

  const fetchSolicitudesInternas = async () => {
    try {
      const response = await fetch('http://34.28.246.100:4000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No agregar Authorization
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

  return (
    <div className="donation-page">
      <h1 className="help-title">Enviar Donaciones</h1>
      <div className="sections">
        
        {/* ✅ Sección: Solicitudes Internas */}
        <section className="section">
  <h2>Solicitudes de ayuda Internas</h2>
  {solicitudesInternas.length === 0 ? (
    <p>No hay solicitudes internas disponibles.</p>
  ) : (
    <div className="donation-list">
      {solicitudesInternas
  .filter((recurso) => recurso && recurso.descripcion && recurso.codigo)
  .map((recurso) => (
    <InternalRequestItem
      key={recurso.id}
      recurso={recurso}
      catalogo={catalogoArticulos}
      unidades={donacionesEspecie}
    />
))}

    </div>
  )}
</section>

        {/* ✅ Sección: Solicitudes Externas */}
        <section className="section">
          <h2>Solicitudes de ayuda Externas</h2>
          <div className="donation-list">
            {pedidos.map((pedido) => (
              <PedidoItem key={pedido.idDonacion} pedido={pedido} />
            ))}
          </div>
        </section>

        {/* Placeholder: Paquetes en Proceso */}
        <section className="section">
          <h2>Paquetes en Proceso</h2>
          {paquetesProceso.length === 0 ? (
            <p>No hay paquetes en proceso.</p>
          ) : (
            <div className="donation-list">
            {paquetesProceso.map((paquete) => (
              <PackageItem
                key={paquete.id_paquete}
                paquete={paquete}
                donacionesEspecie={donacionesEspecie}
                catalogoArticulos={catalogoArticulos}
                onCompletarPaquete={handleEliminarPaquete}
              />
            ))}


            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HelpRequest;
