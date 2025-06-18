import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/History.css';

function DonationHistory() {
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [modalUrl, setModalUrl] = useState(null); // URL temporal (blob)
  const [loadingImage, setLoadingImage] = useState(false);
  
  useEffect(() => {
    const fetchDonaciones = async () => {
      try {
        // Peticiones paralelas
        const [dineroRes, especieRes, catalogoRes, unidadesRes, almacenesRes] = await Promise.all([
          axios.get('/donaciones-en-dinero'),
          axios.get('/donaciones-en-especie'),
          axios.get('/catalogo'),
          axios.get('/unidades'),
          axios.get('/almacenes') // Traemos almacenes también
        ]);
  
        const nombreAlmacenLS = localStorage.getItem('almacen'); // nombre guardado
        const almacenMatch = almacenesRes.data.find(
          (alm) => alm.nombre_almacen === nombreAlmacenLS
        );
  
        if (!almacenMatch) {
          console.warn('No se encontró el almacén del usuario.');
          setDonacionesEspecie([]); // vaciar si no hay coincidencia
        } else {
          const idAlmacenUsuario = almacenMatch.id_almacen;
          const donacionesFiltradas = especieRes.data.filter(
            (d) => d.id_almacen === idAlmacenUsuario
          );
          setDonacionesEspecie(donacionesFiltradas);
        }
  
        setDonacionesDinero(dineroRes.data);
        setCatalogo(catalogoRes.data);
        setUnidades(unidadesRes.data);
      } catch (error) {
        console.error('Error al obtener las donaciones:', error);
      }
    };
  
    fetchDonaciones();
  }, []);
  

  const getArticuloNombre = (id) => {
    const articulo = catalogo.find((item) => item.id_articulo === id);
    return articulo ? articulo.nombre_articulo : 'Desconocido';
  };

  const getUnidadSimbolo = (id) => {
    const unidad = unidades.find((u) => u.id_unidad === id);
    return unidad ? unidad.simbolo : '-';
  };

  const handleVerComprobante = async (urlProtegida) => {
    try {
      setLoadingImage(true);
      const res = await axios.get(urlProtegida, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}` // Asegúrate de que tu token esté aquí
        }
      });
      const blobUrl = URL.createObjectURL(res.data);
      setModalUrl(blobUrl);
    } catch (err) {
      console.error('Error cargando comprobante:', err);
      alert('No se pudo cargar el comprobante.');
    } finally {
      setLoadingImage(false);
    }
  };
  
  

  return (
    <div className="donation-history">
      <h1>Historial de Donaciones</h1>

      <section>
        <h2>Donaciones en Dinero</h2>
        <table>
  <thead>
    <tr>
      <th>Nombre</th>
      <th>Apellido</th>
      <th>Monto</th>
      <th>Divisa</th>
      <th>Nombre de Cuenta</th>
      <th>Número de Cuenta</th>
    </tr>
  </thead>
  <tbody>
    {donacionesDinero.map((donacion) => (
      <tr key={donacion.id_donacion}>
        <td>{donacion.nombres}</td>
        <td>{donacion.apellido_paterno}</td>
        <td>{donacion.monto}</td>
        <td>{donacion.divisa}</td>
        <td>{donacion.nombre_cuenta}</td>
        <td>{donacion.numero_cuenta}</td>
      </tr>
    ))}
  </tbody>
</table>
      </section>

      <section>
        <h2>Donaciones en Especie</h2>
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Artículo</th>
              <th>Espacio</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Unidad</th>
            </tr>
          </thead>
          <tbody>
            {donacionesEspecie.map((donacion) => (
              <tr key={donacion.id_donacion}>
                <td>{donacion.nombres}</td>
                <td>{donacion.apellido_paterno}</td>
                <td>{getArticuloNombre(donacion.id_articulo)}</td>
                <td>{donacion.id_espacio}</td>
                <td>{donacion.cantidad}</td>
                <td>{donacion.estado_articulo}</td>
                <td>{getUnidadSimbolo(donacion.id_unidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {modalUrl && (
  <div className="modal-overlay" onClick={() => setModalUrl(null)}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button className="close-button" onClick={() => setModalUrl(null)}>X</button>
      {loadingImage ? (
        <p>Cargando comprobante...</p>
      ) : (
        <img src={modalUrl} alt="Comprobante" className="modal-image" />
      )}
    </div>
  </div>
)}

    </div>
  );
}

export default DonationHistory;
