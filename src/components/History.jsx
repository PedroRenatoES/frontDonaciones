import React, { useState, useEffect } from 'react';
import axios from '../axios'; // Asegúrate de que esté configurado correctamente
import '../styles/History.css'; // Asegúrate de tener este archivo CSS

function DonationHistory() {
  const [donacionesDinero, setDonacionesDinero] = useState([]);
  const [donacionesEspecie, setDonacionesEspecie] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [unidades, setUnidades] = useState([]);


  useEffect(() => {
    const fetchDonaciones = async () => {
      try {
        const [dineroRes, especieRes, catalogoRes, unidadesRes] = await Promise.all([
          axios.get('/donaciones-en-dinero'),
          axios.get('/donaciones-en-especie'),
          axios.get('/catalogo'),
          axios.get('/unidades')
        ]);

        setDonacionesDinero(dineroRes.data);
        setDonacionesEspecie(especieRes.data);
        setCatalogo(catalogoRes.data);
        setUnidades(unidadesRes.data);
      } catch (error) {
        console.error('Error al obtener las donaciones:', error);
      }
    };

    fetchDonaciones();
  }, []);

  // Función para obtener el nombre del artículo por su ID
    const getArticuloNombre = (id) => {
        const articulo = catalogo.find((item) => item.id_articulo === id);
        return articulo ? articulo.nombre_articulo : 'Desconocido';
    };

    const getUnidadSimbolo = (id) => {
      const unidad = unidades.find((u) => u.id_unidad === id);
      return unidad ? unidad.simbolo : '-';
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
              <th>Nombre Cuenta</th>
              <th>Número Cuenta</th>
              <th>Comprobante</th>
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
                <td>
                  <a href={donacion.comprobante_url} target="_blank" rel="noopener noreferrer">
                    Ver Comprobante
                  </a>
                </td>
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
    </div>
  );
}

export default DonationHistory;
