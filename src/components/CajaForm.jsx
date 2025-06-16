import React, { useState } from 'react';
import axios from '../axios';

const CajaForm = ({ idPaquete, productos, onCajaCreada }) => {
  const [codigoCaja, setCodigoCaja] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const nuevaCaja = {
        codigo_caja: codigoCaja,
        id_paquete: idPaquete,
        cantidad_maxima: cantidad,
        cantidad_asignada: cantidad,
        estado: 'pendiente',
      };

      const response = await axios.post('/cajas', nuevaCaja);
      onCajaCreada({ ...nuevaCaja, id_caja: response.data.id_caja });

      // Reset form
      setCodigoCaja('');
      setCantidad(0);
    } catch (err) {
      console.error('Error al crear la caja:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Crear Nueva Caja</h4>
      <label>
        Código:
        <input value={codigoCaja} onChange={e => setCodigoCaja(e.target.value)} required />
      </label>
      <label>
        Producto:
        <select value={productoId} onChange={e => setProductoId(e.target.value)} required>
          <option value="">Seleccionar</option>
          {productos.map(prod => (
            <option key={prod.id_articulo} value={prod.id_articulo}>
              {prod.nombre_articulo}
            </option>
          ))}
        </select>
      </label>
      <label>
        Cantidad:
        <input type="number" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} required />
      </label>
      <button type="submit">Crear Caja</button>
    </form>
  );
};

export default CajaForm;
