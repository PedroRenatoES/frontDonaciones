import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/CampainModal.css';

function CampanaModal({ show, onClose, onCreated }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    nombre_campana: '',
    descripcion: '',
    fecha_inicio: today,
    fecha_fin: '',
    organizador: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;

  useEffect(() => {
    if (!show) return;
    setFormData({
      nombre_campana: '',
      descripcion: '',
      fecha_inicio: today,
      fecha_fin: '',
      organizador: '',
    });
    setSelectedFile(null);
    setError('');
    setFieldErrors({});
  }, [show]);

  if (!show) return null;

  const validateField = (name, value) => {
    let errorMsg = '';

    if (['nombre_campana', 'organizador'].includes(name)) {
      if (!soloLetras.test(value)) {
        errorMsg = 'Solo se permiten letras y espacios.';
      }
    }

    if (name === 'fecha_fin' && value < formData.fecha_inicio) {
      errorMsg = 'La fecha final no puede ser anterior a la fecha de inicio.';
    }

    setFieldErrors(prev => ({ ...prev, [name]: errorMsg }));
    return errorMsg === '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const allValid = Object.entries(formData).every(([key, val]) => validateField(key, val));
    if (!allValid || !selectedFile) {
      setError('Por favor, corrija los errores antes de continuar.');
      setLoading(false);
      return;
    }

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
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      console.error('Error creando campaña:', err);
      setError('Error al crear la campaña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.className === 'campana-modal-backdrop') {
      onClose();
    }
  };

  const inputClass = (name) => fieldErrors[name] ? 'error-input' : '';

  return (
    <div className="campana-modal-backdrop" onClick={handleBackdropClick}>
      <div className="campana-modal-content">
        <h2>Crear Nueva Campaña</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Nombre de la campaña:
            <input
              name="nombre_campana"
              value={formData.nombre_campana}
              onChange={handleInputChange}
              required
              className={inputClass('nombre_campana')}
            />
            {fieldErrors.nombre_campana && <small className="error-message">{fieldErrors.nombre_campana}</small>}
          </label>

          <label>
            Descripción:
            <textarea
              name="descripcion"
              value={formData.descripcion}
              onChange={handleInputChange}
              required
            />
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
              className={inputClass('fecha_fin')}
              min={formData.fecha_inicio}
            />
            {fieldErrors.fecha_fin && <small className="error-message">{fieldErrors.fecha_fin}</small>}
          </label>

          <label>
            Organizador:
            <input
              name="organizador"
              value={formData.organizador}
              onChange={handleInputChange}
              required
              className={inputClass('organizador')}
            />
            {fieldErrors.organizador && <small className="error-message">{fieldErrors.organizador}</small>}
          </label>

          <label>
            Imagen de la campaña:
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </label>

          {error && <p className="error-msg">{error}</p>}

          <button className="campana-create-button" type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear Campaña'}
          </button>
          <button className="campana-cancel-button" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
}

export default CampanaModal;
