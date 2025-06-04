import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/CampainModal.css';

function CampanaModal({ show, onClose, onCreated }) {
  const today = new Date().toISOString().split('T')[0]; // Fecha actual en formato YYYY-MM-DD

  const [formData, setFormData] = useState({
    nombre_campana: '',
    descripcion: '',
    fecha_inicio: today,  // Establecer la fecha de inicio como fija
    fecha_fin: '',
    organizador: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!show) return;
    // Reinicia valores al mostrar el modal
    setFormData({
      nombre_campana: '',
      descripcion: '',
      fecha_inicio: today,
      fecha_fin: '',
      organizador: '',
    });
    setSelectedFile(null);
    setError('');
  }, [show]);

  if (!show) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Validar que fecha_fin no sea menor a fecha_inicio
    if (name === 'fecha_fin' && value < formData.fecha_inicio) {
      setError('La fecha final no puede ser anterior a la fecha de inicio.');
      return;
    } else {
      setError('');
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imagen_url = '';

      if (selectedFile) {
        const data = new FormData();
        data.append('image', selectedFile);

        const imgRes = await axios.post('/imagenes-campanas', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        imagen_url = imgRes.data.url;
      }

      const payload = { ...formData, imagen_url };

      await axios.post('/campanas', payload);

      if (onCreated) onCreated(); // Refresca lista
      onClose(); // Cierra modal
    } catch (err) {
      console.error('Error creando campaña:', err);
      setError('Error al crear la campaña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'modal-backdrop') {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <h2>Crear Nueva Campaña</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre de la campaña:
            <input name="nombre_campana" value={formData.nombre_campana} onChange={handleInputChange} required />
          </label>

          <label>
            Descripción:
            <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} required />
          </label>

          <label>
            Fecha de inicio:
            <input
              type="date"
              name="fecha_inicio"
              value={formData.fecha_inicio}
              disabled
              readOnly
            />
          </label>

          <label>
            Fecha final:
            <input
              type="date"
              name="fecha_fin"
              value={formData.fecha_fin}
              onChange={handleInputChange}
              required
              min={formData.fecha_inicio}
            />
          </label>

          <label>
            Organizador:
            <input name="organizador" value={formData.organizador} onChange={handleInputChange} required />
          </label>

          <label>
            Imagen de la campaña:
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="campana-create-button" type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Campaña'}
          </button>
          <button className="campana-cancel-button" type="button" onClick={onClose} disabled={loading}>Cancelar</button>
        </form>
      </div>
    </div>
  );
}

export default CampanaModal;
