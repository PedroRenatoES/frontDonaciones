import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from '../axios';
import '../styles/CampainModal.css';

Modal.setAppElement('#root');

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
    
    // Limpiar error específico cuando el usuario interactúa
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    
    // Limpiar error de imagen cuando el usuario interactúa
    if (fieldErrors.imagen) {
      setFieldErrors(prev => ({
        ...prev,
        imagen: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validar todos los campos manualmente
    const newErrors = {};
    
    if (!formData.nombre_campana.trim()) {
      newErrors.nombre_campana = 'El nombre de la campaña es requerido.';
    }
    if (!formData.descripcion.trim()) {
      newErrors.descripcion = 'La descripción es requerida.';
    }
    if (!formData.fecha_fin) {
      newErrors.fecha_fin = 'La fecha final es requerida.';
    }
    if (!formData.organizador.trim()) {
      newErrors.organizador = 'El organizador es requerido.';
    }
    if (!selectedFile) {
      newErrors.imagen = 'La imagen de la campaña es requerida.';
    }

    // Validar formato de campos específicos
    if (formData.nombre_campana && !soloLetras.test(formData.nombre_campana)) {
      newErrors.nombre_campana = 'Solo se permiten letras y espacios.';
    }
    if (formData.organizador && !soloLetras.test(formData.organizador)) {
      newErrors.organizador = 'Solo se permiten letras y espacios.';
    }
    if (formData.fecha_fin && formData.fecha_fin < formData.fecha_inicio) {
      newErrors.fecha_fin = 'La fecha final no puede ser anterior a la fecha de inicio.';
    }

    setFieldErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
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

  const getInputClass = field => (fieldErrors[field] ? 'form-control error' : 'form-control');

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      contentLabel="Formulario Campaña"
      className="modal-form"
      overlayClassName="modal-overlay"
    >
      <h2>Crear Nueva Campaña</h2>
      <form onSubmit={handleSubmit}>
        {/* Nombre de la campaña */}
        <div className="form-group">
          <label>Nombre de la campaña</label>
          <input
            type="text"
            name="nombre_campana"
            className={getInputClass('nombre_campana')}
            value={formData.nombre_campana}
            onChange={handleInputChange}
          />
          {fieldErrors.nombre_campana && <small className="error-message">{fieldErrors.nombre_campana}</small>}
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="descripcion"
            className={getInputClass('descripcion')}
            value={formData.descripcion}
            onChange={handleInputChange}
            rows="4"
          />
          {fieldErrors.descripcion && <small className="error-message">{fieldErrors.descripcion}</small>}
        </div>

        {/* Fecha de inicio */}
        <div className="form-group">
          <label>Fecha de inicio</label>
          <input
            type="date"
            name="fecha_inicio"
            className="form-control"
            value={formData.fecha_inicio}
            disabled
            readOnly
          />
        </div>

        {/* Fecha final */}
        <div className="form-group">
          <label>Fecha final</label>
          <input
            type="date"
            name="fecha_fin"
            className={getInputClass('fecha_fin')}
            value={formData.fecha_fin}
            onChange={handleInputChange}
            min={formData.fecha_inicio}
          />
          {fieldErrors.fecha_fin && <small className="error-message">{fieldErrors.fecha_fin}</small>}
        </div>

        {/* Organizador */}
        <div className="form-group">
          <label>Organizador</label>
          <input
            type="text"
            name="organizador"
            className={getInputClass('organizador')}
            value={formData.organizador}
            onChange={handleInputChange}
          />
          {fieldErrors.organizador && <small className="error-message">{fieldErrors.organizador}</small>}
        </div>

        {/* Imagen de la campaña */}
        <div className="form-group">
          <label>Imagen de la campaña</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            className={getInputClass('imagen')}
          />
          {fieldErrors.imagen && <small className="error-message">{fieldErrors.imagen}</small>}
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Campaña'}
        </button>
      </form>
    </Modal>
  );
}

export default CampanaModal;
