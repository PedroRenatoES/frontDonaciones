import React, { useEffect, useState } from 'react';
import axios from '../axios';
import '../styles/ModalCambioEspacio.css'; // Asegúrate de tener este CSS

function ModalCambioEspacio({ idDonacion, onClose, onSuccess }) {
  const [almacenes, setAlmacenes] = useState([]);
  const [estantes, setEstantes] = useState([]);
  const [espacios, setEspacios] = useState([]);

  const [selectedAlmacen, setSelectedAlmacen] = useState('');
  const [selectedEstante, setSelectedEstante] = useState('');
  const [selectedEspacio, setSelectedEspacio] = useState('');
  const [error, setError] = useState('');

  const usuario = JSON.parse(localStorage.getItem('usuario'));
  const esAlmacenista = usuario?.rol === 3;
  const esAdmin = usuario?.rol === 1;
  const nombreAlmacenLS = localStorage.getItem('almacen'); // Get the almacen name from localStorage

  useEffect(() => {
    axios.get('/almacenes')
      .then(res => {
        console.log('Fetched almacenes:', res.data); // Debugging log
        if (esAlmacenista) {
          const almacenUsuario = res.data.find(alm => alm.nombre_almacen === nombreAlmacenLS);
          if (almacenUsuario) {
            setAlmacenes([almacenUsuario]);
            setSelectedAlmacen(almacenUsuario.id_almacen.toString());
          }
        } else if (esAdmin) {
          setAlmacenes(res.data);
        }
      })
      .catch(err => console.error('Error cargando almacenes:', err));
  }, [esAlmacenista, esAdmin, nombreAlmacenLS]);

  useEffect(() => {
    if (selectedAlmacen) {
      axios.get('/estantes')
        .then(res => {
          const filtrados = res.data.filter(est => est.id_almacen === parseInt(selectedAlmacen));
          console.log('Fetched estantes:', filtrados); // Debugging log
          setEstantes(filtrados);
          setSelectedEstante('');
          setEspacios([]);
        })
        .catch(err => console.error('Error cargando estantes:', err));
    }
  }, [selectedAlmacen]);

  useEffect(() => {
    if (selectedEstante) {
      axios.get('/espacios')
        .then(res => {
          const filtrados = res.data.filter(esp => esp.id_estante === parseInt(selectedEstante));
          console.log('Fetched espacios:', filtrados); // Debugging log
          setEspacios(filtrados);
          setSelectedEspacio('');
        })
        .catch(err => console.error('Error cargando espacios:', err));
    }
  }, [selectedEstante]);

  const handleSubmit = () => {
    if (!selectedEspacio) {
      setError('Selecciona un espacio');
      return;
    }

    axios.put('/donaciones-en-especie/espacio', {
      id_donacion_especie: idDonacion,
      id_espacio: parseInt(selectedEspacio),
    })
    .then(() => {
      alert('Espacio actualizado correctamente');
      onSuccess && onSuccess();
      onClose();
    })
    .catch(err => {
      console.error('Error actualizando espacio:', err);
      setError('No se pudo actualizar el espacio');
    });
  };

  return (
    <div className="modal-cambio-espacio__backdrop">
      <div className="modal-cambio-espacio__container">
        <h2>Cambiar Espacio de Donación</h2>

        <label>Almacén:</label>
        <select
          value={selectedAlmacen}
          onChange={(e) => setSelectedAlmacen(e.target.value)}
        >
          <option value="">Seleccione un almacén</option>
          {almacenes.map(a => (
            <option key={a.id_almacen} value={a.id_almacen}>
              {a.nombre_almacen}
            </option>
          ))}
        </select>

        <label>Estante:</label>
        <select value={selectedEstante} onChange={(e) => setSelectedEstante(e.target.value)} disabled={!selectedAlmacen}>
          <option value="">Seleccione un estante</option>
          {estantes.map(e => (
            <option key={e.id_estante} value={e.id_estante}>
              {e.nombre}
            </option>
          ))}
        </select>

        <label>Espacio:</label>
        <select value={selectedEspacio} onChange={(e) => setSelectedEspacio(e.target.value)} disabled={!selectedEstante}>
          <option value="">Seleccione un espacio</option>
          {espacios.map(e => (
            <option key={e.id_espacio} value={e.id_espacio}>
              {e.codigo}
            </option>
          ))}
        </select>

        {error && <p className="modal-cambio-espacio__error">{error}</p>}

        <button onClick={handleSubmit}>Guardar</button>
        <button className="modal-cambio-espacio__btn-cancelar" onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

export default ModalCambioEspacio;
