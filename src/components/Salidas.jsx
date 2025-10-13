import React, { useEffect, useState } from 'react';
import axios from '../axios';
import '../styles/Salidas.css';
import jsPDF from 'jspdf';

const Salidas = () => {
  const [salidas, setSalidas] = useState([]);
  const [paquetes, setPaquetes] = useState([]);
  const [idPaqueteSeleccionado, setIdPaqueteSeleccionado] = useState('');
  const [usuarioId] = useState(localStorage.getItem('id'));
  const [miAlmacen] = useState(localStorage.getItem('almacen'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
        
        // 🔥 FILTRAR por almacén del usuario usando metadatos
        const paquetesFiltrados = response.data.filter(paquete => {
          // Extraer metadatos de la descripción
          const match = paquete.descripcion?.match(/SOL#[^|]+\|ALMACEN:([^|]+)\|/);
          const almacenPaquete = match ? match[1] : null;
          
          // Si tiene metadatos, filtrar por almacén
          if (almacenPaquete) {
            return almacenPaquete === miAlmacen;
          }
          
          // Si no tiene metadatos (paquete antiguo), mostrarlo a todos
          return true;
        });
        
        setPaquetes(paquetesFiltrados);
      } catch (error) {
        console.error('Error al obtener paquetes no enviados:', error);
      }
    };

    fetchSalidas();
    fetchPaquetesNoEnviados();
  }, []);

  const handleRegistrarSalida = async (e) => {
    if (e) e.preventDefault();
    console.log('🔍 Validando:', { idPaqueteSeleccionado, usuarioId });
    
    if (!idPaqueteSeleccionado) {
      setError('Por favor, selecciona un paquete de la lista.');
      return;
    }
    
    if (!usuarioId) {
      setError('No estás autenticado. Por favor, inicia sesión nuevamente.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/salidas-almacen/', {
        id_paquete: idPaqueteSeleccionado,
        id_usuario: usuarioId,
      });

      setSuccess('Salida registrada exitosamente');
      setSalidas((prev) => [...prev, response.data]);

      // Obtener info del paquete
      const paqueteRes = await axios.get(`/paquetes/${idPaqueteSeleccionado}`);
      const paqueteInfo = paqueteRes.data;

      // Construir nombre completo
      const nombreCompleto = `${localStorage.getItem('nombres')} ${localStorage.getItem('apellidos')}`.trim();

      // Generar PDF
      generarPDFSalida(paqueteInfo, nombreCompleto);

      // Limpiar selección
      setIdPaqueteSeleccionado('');

    } catch (error) {
      console.error('Error al registrar salida:', error);
      setError('Hubo un error al registrar la salida. Intenta nuevamente.');
    } finally {
      setLoading(false);
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

      <div className="salidas-sections">
        <section className="salidas-section">
          <h2 className="salidas-subtitle">Salidas Registradas</h2>
          {salidas.length === 0 ? (
            <div className="salidas-empty">
              <div className="salidas-empty-icon">📦</div>
              <p>No hay salidas registradas aún</p>
            </div>
          ) : (
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
          )}
        </section>

        <section className="salidas-section">
          <h2 className="salidas-subtitle">Registrar Nueva Salida</h2>
          
          {/* Indicadores de estado */}
          {error && (
            <div className="salidas-error">
              <div className="salidas-error-icon">⚠️</div>
              <div className="salidas-error-message">{error}</div>
            </div>
          )}
          
          {success && (
            <div className="salidas-success">
              <div className="salidas-success-icon">✅</div>
              <div className="salidas-success-message">{success}</div>
            </div>
          )}
          
          <div className="salidas-form-group">
            <label htmlFor="paquete" className="salidas-label">Seleccionar Paquete:</label>
            <select
              id="paquete"
              className="salidas-select"
              value={idPaqueteSeleccionado}
              onChange={(e) => {
                setIdPaqueteSeleccionado(e.target.value);
                setError('');
                setSuccess('');
              }}
            >
              <option value="">Seleccione un paquete</option>
              {paquetes.map((p) => (
                <option key={p.id_paquete} value={p.id_paquete}>
                  {p.nombre_paquete}
                </option>
              ))}
            </select>
          </div>
          <button 
            type="button"
            className="salidas-button" 
            onClick={handleRegistrarSalida}
            disabled={!idPaqueteSeleccionado || loading}
          >
            {loading ? 'Registrando...' : 'Registrar Salida'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default Salidas;
