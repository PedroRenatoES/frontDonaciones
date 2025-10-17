import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/CampainModal.css';

function EditCampanaModal({ show, onClose, campana, onUpdated }) {
  const [formData, setFormData] = useState({
    nombre_campana: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_fin: '',
    organizador: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(false);

  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;

  // Función para convertir fecha ISO a formato yyyy-MM-dd (sin problemas de zona horaria)
  const isoToDateInput = (isoString) => {
    if (!isoString) return '';
    // Extraer solo la parte de la fecha sin la hora
    return isoString.split('T')[0];
  };

  // Función para convertir formato yyyy-MM-dd a ISO (conservando la fecha exacta)
  const dateInputToISO = (dateString) => {
    if (!dateString) return '';
    // Simplemente agregar 'T00:00:00.000Z' para mantener consistencia
    return `${dateString}T00:00:00.000Z`;
  };

  useEffect(() => {
    if (show && campana) {
      console.log('Fechas originales:', {
        fecha_inicio: campana.fecha_inicio,
        fecha_fin: campana.fecha_fin,
        converted_inicio: isoToDateInput(campana.fecha_inicio),
        converted_fin: isoToDateInput(campana.fecha_fin)
      });
      
      setFormData({
        nombre_campana: campana.nombre_campana || '',
        descripcion: campana.descripcion || '',
        fecha_inicio: isoToDateInput(campana.fecha_inicio) || '',
        fecha_fin: isoToDateInput(campana.fecha_fin) || '',
        organizador: campana.organizador || '',
      });
    }
    setSelectedFile(null);
    setError('');
    setFieldErrors({});
  }, [show, campana]);

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
    if (!allValid) {
      setError('Por favor, corrija los errores antes de continuar.');
      setLoading(false);
      return;
    }

    try {
      let imagen_url = campana.imagen_url;

      // Si se seleccionó una nueva imagen, subirla
      if (selectedFile) {
        const data = new FormData();
        data.append('image', selectedFile);

        const imgRes = await axios.post('/imagenes-campanas', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        imagen_url = imgRes.data.url;
      }

      // Convertir las fechas al formato ISO para el backend
      const payload = { 
        ...formData, 
        fecha_inicio: dateInputToISO(formData.fecha_inicio),
        fecha_fin: dateInputToISO(formData.fecha_fin),
        imagen_url 
      };

      console.log('Enviando payload:', {
        ...payload,
        debug: {
          fecha_inicio_input: formData.fecha_inicio,
          fecha_fin_input: formData.fecha_fin,
          fecha_inicio_iso: dateInputToISO(formData.fecha_inicio),
          fecha_fin_iso: dateInputToISO(formData.fecha_fin)
        }
      });

      await axios.put(`/campanas/${campana.id_campana}`, payload);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Error actualizando campaña:', err);
      setError('Error al actualizar la campaña. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      if (!campana || !campana.id_campana) {
        const msg = 'ID de campaña inválido. No se puede realizar la eliminación.';
        console.error(msg, campana);
        setError(msg);
        setLoading(false);
        setPendingDelete(false);
        return;
      }
      console.log('Intentando eliminar campaña id=', campana.id_campana);
      await axios.delete(`/campanas/${campana.id_campana}`);
      if (onUpdated) onUpdated();
      onClose();
    } catch (err) {
      console.error('Error eliminando campaña:', err);
      if (err.response) {
        console.error('Delete response data:', err.response.data);
        console.error('Delete response status:', err.response.status);
      }
      const msg = err?.response?.data?.message || '';
      const userMsg = (msg.toLowerCase().includes('donacion') || msg.toLowerCase().includes('donaciones') || err?.response?.status === 409)
        ? 'No se pudo eliminar ya que esta campaña contiene donaciones registradas.'
        : 'No se pudo eliminar la campaña.';
      setError(userMsg);
    } finally {
      setLoading(false);
      setPendingDelete(false);
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
        <h2>Editar Campaña</h2>
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
              onChange={handleInputChange}
              required
            />
            <small className="date-help">
              Seleccionada: {formData.fecha_inicio}
            </small>
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
            <small className="date-help">
              Seleccionada: {formData.fecha_fin}
            </small>
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
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
            <small className="file-help">
              {selectedFile ? `Nueva imagen: ${selectedFile.name}` : 'Selecciona una nueva imagen o mantén la actual'}
            </small>
          </label>

          {campana.imagen_url && !selectedFile && (
            <div className="current-image">
              <p>Imagen actual:</p>
              <img 
                src={campana.imagen_url} 
                alt="Imagen actual" 
                style={{ maxWidth: '200px', maxHeight: '150px', marginTop: '10px' }}
              />
            </div>
          )}

          {error && <p className="error-msg">{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button className="campana-create-button" type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Actualizar Campaña'}
            </button>

            <button className="campana-cancel-button" type="button" onClick={onClose} disabled={loading}>
              Cancelar
            </button>

            {/* Delete flow */}
            {!pendingDelete ? (
              <button
                className="campana-delete-button"
                type="button"
                onClick={() => { setPendingDelete(true); setError(''); }}
                disabled={loading}
              >
                Eliminar campaña
              </button>
            ) : (
              <div className="delete-confirmation">
                <span style={{ marginRight: '0.5rem', color: '#374151' }}>¿Eliminar campaña?</span>
                <button className="campana-delete-button" type="button" onClick={handleDelete} disabled={loading}>Sí, eliminar</button>
                <button className="campana-cancel-button" type="button" onClick={() => setPendingDelete(false)} disabled={loading}>Cancelar</button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCampanaModal;