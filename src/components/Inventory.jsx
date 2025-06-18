import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Inventory.css';
import DonorsModal from './DonorsModal';
import MoneyDonorsModal from './MoneyDonorsModal';



function Inventory() {
  const [inventario, setInventario] = useState([]);
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [almacenFiltro, setAlmacenFiltro] = useState('');
  const [montoAnimado, setMontoAnimado] = useState(0); // ✅ Hook correcto
  const [modalAbierto, setModalAbierto] = useState(false);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);
  const [modalDineroAbierto, setModalDineroAbierto] = useState(false);



  useEffect(() => {
    const fetchInventario = async () => {
      try {
        const [resInventario, resDinero] = await Promise.all([
          axios.get('/inventario/ubicaciones'),
          axios.get('/donaciones-en-dinero')
        ]);
        setInventario(resInventario.data);
        setDonacionesDinero(resDinero.data);
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchInventario();
  }, []);

  // ✅ Calcular monto total de donaciones en dinero
  const montoTotalDinero = donacionesDinero.reduce(
    (total, donacion) => total + donacion.monto,
    0
  );

  // ✅ Animación del contador
  useEffect(() => {
    let start = 0;
    const end = parseFloat(montoTotalDinero);
    if (isNaN(end)) return;

    const duration = 1500; // 1.5s
    const startTime = performance.now();

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const currentValue = progress * end;
      setMontoAnimado(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [montoTotalDinero]);

  // ✅ Filtros
  const categorias = [...new Set(inventario.map(item => item.nombre_categoria))];
  const almacenes = [...new Set(inventario.flatMap(item => item.ubicaciones.map(u => u.almacen)))];

  const inventarioFiltrado = inventario.filter(item => {
    const coincideCategoria = !categoriaFiltro || item.nombre_categoria === categoriaFiltro;
    const coincideAlmacen = !almacenFiltro || item.ubicaciones.some(u => u.almacen === almacenFiltro);
    return coincideCategoria && coincideAlmacen;
  });

  const descargarExcel = async () => {
    try {
      const response = await axios.get('/reportes/stock/excel', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'stock_total.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el Excel:', error);
      alert('No se pudo descargar el archivo.');
    }
  };

  const abrirModal = (item) => {
    setArticuloSeleccionado(item);
    setModalAbierto(true);
  };

  return (
  <div className="inventory">
    <h1 className='inventory-title'>Inventario de Donaciones</h1>

    <div className="inventory-actions">
  <div className="filters">
    <div>
      <label>Categoría:</label>
      <select value={categoriaFiltro} onChange={(e) => setCategoriaFiltro(e.target.value)}>
        <option value="">Todas</option>
        {categorias.map((categoria, idx) => (
          <option key={idx} value={categoria}>{categoria}</option>
        ))}
      </select>
    </div>

    {localStorage.getItem('rol') === '1' && (
  <div>
    <label>Almacén:</label>
    <select value={almacenFiltro} onChange={(e) => setAlmacenFiltro(e.target.value)}>
      <option value="">Todos</option>
      {almacenes.map((almacen, idx) => (
        <option key={idx} value={almacen}>{almacen}</option>
      ))}
    </select>
  </div>
)}
    <div className="download-wrapper">
      <label style={{ visibility: 'hidden' }}>Descargar:</label> {/* para alinear verticalmente */}
      <button className="btn-download" onClick={descargarExcel}>
        📥 Descargar Excel
      </button>
    </div>
  </div>
</div>

    <section className="table-section">
      <h4>Donaciones en Especie</h4>
      <table className="activity-table">
        <thead>
          <tr>
            <th>Artículo</th>
            <th>Categoría</th>
            <th>Unidad</th>
            <th>Cantidad Total</th>
            <th>Ubicaciones</th>
          </tr>
        </thead>
        <tbody>
          {inventarioFiltrado.map((item) => (
            <tr key={item.id_articulo}>
            <td onClick={() => abrirModal(item)} style={{ cursor: 'pointer', color: 'blue' }}>
              {item.nombre_articulo}
            </td>
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
          ))}
        </tbody>
      </table>
    </section>

    <section className="table-section">
      <h4>Donaciones en Dinero (Cuenta)</h4>
      <table className="activity-table">
        <thead>
          <tr>
            <th>Monto Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{montoAnimado.toFixed(2)} Bs</td>
          </tr>
        </tbody>
      </table>
      <button className="btn-donors" onClick={() => setModalDineroAbierto(true)}>
  Ver Detalle
</button>

    </section>
    <DonorsModal
  isOpen={modalAbierto}
  articuloId={articuloSeleccionado?.id_articulo}
  articuloNombre={articuloSeleccionado?.nombre_articulo}
  onClose={() => setModalAbierto(false)}
/>

<MoneyDonorsModal
  isOpen={modalDineroAbierto}
  onClose={() => setModalDineroAbierto(false)}
/>


  </div>


  );
  
}

export default Inventory;
