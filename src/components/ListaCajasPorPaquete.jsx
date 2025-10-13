import React, { useEffect, useState } from 'react';
import '../styles/DetallePaquete.css';

const ListaCajasPorPaquete = ({ idPaquete, refrescarTrigger, setCajas }) => {
  const [cajasLocal, setCajasLocal] = useState([]);

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/cajas');
        const data = await res.json();

        const cajasFiltradas = data.filter(caja => caja.id_paquete === idPaquete);
        setCajasLocal(cajasFiltradas);
        if (setCajas) setCajas(cajasFiltradas);  // Actualiza el estado del padre
      } catch (error) {
        console.error('Error al obtener cajas del paquete:', error);
      }
    };

    fetchCajas();
  }, [idPaquete, refrescarTrigger, setCajas]);

  // if (!cajasLocal.length) {
  //   return (
  //     <div className="no-cajas-mensaje">
  //       📦 No se han creado cajas aún
  //     </div>
  //   );
  // }

  return (
    <div className="cajas-list">
      {cajasLocal.map((caja) => (
        <div key={caja.id_caja} className="caja-item">
          <div className="caja-header">
            <div className="caja-codigo">{caja.codigo_caja}</div>
            <div className="caja-cantidad-total">
              {caja.cantidad_asignada} items
            </div>
          </div>
          
          <div className="caja-detalles">
            <div className="caja-detalle-item">
              <span className="caja-detalle-label">Artículos:</span>
              <div className="caja-articulos">
                {typeof caja.descripcion === 'string' && caja.descripcion.length > 0
                  ? caja.descripcion.split(',').map((par, idx) => {
                      const [nombre, cantidad] = par.split(':');
                      return (
                        <span key={nombre + idx} className="caja-articulo-item">
                          {nombre}: {cantidad}
                        </span>
                      );
                    })
                  : <span className="caja-articulo-item">Sin detalle</span>
                }
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaCajasPorPaquete;
