import React, { useEffect, useState } from 'react';
import axios from '../axios';
import '../styles/Salidas.css';
import jsPDF from 'jspdf';

const Salidas = () => {
  const [salidas, setSalidas] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [idPaqueteSeleccionado, setIdPaqueteSeleccionado] = useState('');
  const [usuarioId] = useState(localStorage.getItem('id'));

  useEffect(() => {
    const fetchSalidas = async () => {
      try {
        const response = await axios.get('/salidas-almacen');
        setSalidas(response.data);
      } catch (error) {
        console.error('Error al obtener salidas:', error);
      }
    };

    const fetchPaquetesNoEnviados = async () => {
      try {
        const response = await axios.get('/paquetes/no-enviados');
        setPaquetes(response.data);
      } catch (error) {
        console.error('Error al obtener paquetes no enviados:', error);
      }
    };

    fetchSalidas();
    fetchPaquetesNoEnviados();
  }, []);

  const handleRegistrarSalida = async () => {
    if (!idPaqueteSeleccionado || !usuarioId) {
      alert('Por favor, selecciona un paquete y asegúrate de estar autenticado.');
      return;
    }

    try {
      const response = await axios.post('/salidas-almacen/', {
        id_paquete: idPaqueteSeleccionado,
        id_usuario: usuarioId,
      });

      alert('Salida registrada exitosamente');
      setSalidas((prev) => [...prev, response.data]);

      // Obtener info del paquete
      const paqueteRes = await axios.get(`/paquetes/${idPaqueteSeleccionado}`);
      const paqueteInfo = paqueteRes.data;

      // Construir nombre completo
      const nombreCompleto = `${localStorage.getItem('nombres')} ${localStorage.getItem('apellidos')}`.trim();

      // Generar PDF
      generarPDFSalida(paqueteInfo, nombreCompleto);

    } catch (error) {
      console.error('Error al registrar salida:', error);
      alert('Hubo un error al registrar la salida');
    }
  };

  const generarPDFSalida = (paquete, usuarioCompleto) => {
    const doc = new jsPDF();
    const fecha = new Date().toLocaleDateString();

    doc.setFontSize(16);
    doc.text('Salida de Paquete', 105, 20, null, null, 'center');

    doc.setFontSize(12);
    doc.text(`Nombre del paquete: ${paquete.nombre_paquete}`, 20, 35);
    doc.text(`Descripción: ${paquete.descripcion}`, 20, 45);
    doc.text(`Fecha de creación: ${paquete.fecha_creacion.split('T')[0]}`, 20, 55);

    doc.text('Contenido del paquete:', 20, 70);
    let y = 80;
    paquete.items.forEach(item => {
      doc.text(`- ${item.nombre_articulo}: ${item.cantidad} ${item.unidad}`, 25, y);
      y += 10;
    });

    y += 10;
    doc.text(`Enviado por: ${usuarioCompleto}`, 20, y);
    y += 20;
    doc.line(20, y, 120, y); // Línea de firma
    doc.text("Firma", 20, y + 10);

    doc.save(`salida_${paquete.nombre_paquete}_${fecha}.pdf`);
  };

  return (
    <div className="salidas-main-container">
      <h1 className="salidas-title">Historial de Salidas</h1>

      <section className="salidas-section">
        <h2 className="salidas-subtitle">Salidas Registradas</h2>
        <table className="salidas-table">
          <thead>
            <tr>
              <th>Paquete</th>
              <th>Fecha</th>
              <th>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {salidas.map((s) => (
              <tr key={s.id_salida}>
                <td>{s.nombre_paquete}</td>
                <td>{new Date(s.fecha_salida).toLocaleDateString()}</td>
                <td>{`${s.nombre_usuario} ${s.apellido_paterno} ${s.apellido_materno}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="salidas-section">
        <h2 className="salidas-subtitle">Registrar Nueva Salida</h2>
        <div className="salidas-form-group">
          <label htmlFor="paquete" className="salidas-label">Seleccionar Paquete:</label>
          <select
            id="paquete"
            className="salidas-select"
            value={idPaqueteSeleccionado}
            onChange={(e) => setIdPaqueteSeleccionado(e.target.value)}
          >
            <option value="">Seleccione un paquete</option>
            {paquetes.map((p) => (
              <option key={p.id_paquete} value={p.id_paquete}>
                {p.nombre_paquete}
              </option>
            ))}
          </select>
        </div>
        <button className="salidas-button" onClick={handleRegistrarSalida}>
          Registrar Salida
        </button>
      </section>
    </div>
  );
};

export default Salidas;
