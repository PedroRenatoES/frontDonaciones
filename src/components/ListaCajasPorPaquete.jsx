import React, { useEffect, useState } from 'react';

const ListaCajasPorPaquete = ({ idPaquete, refrescarTrigger, setCajas }) => {
  const [cajasLocal, setCajasLocal] = useState([]);

  useEffect(() => {
    const fetchCajas = async () => {
      try {
        const res = await fetch('https://backenddonaciones.onrender.com/api/cajas');
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

  if (!cajasLocal.length) return <p>No se han creado cajas aún.</p>;

  return (
    <div className="mt-4">
      <h5>Cajas creadas</h5>
      <ul className="list-group">
        {cajasLocal.map((caja) => (
          <li key={caja.id_caja} className="list-group-item">
            <strong>Código:</strong> {caja.codigo_caja} <br />
            <strong>Descripción:</strong> {caja.descripcion} <br />
            <strong>Cantidad asignada:</strong> {caja.cantidad_asignada}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaCajasPorPaquete;
