import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import '../styles/Donors.css';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';

Modal.setAppElement('#root');

function DonorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, editMode, loading, serverError, serverSuccess, clearNotices }) {
  const [errors, setErrors] = useState({});
  const { modalState, showAlert } = useConfirmModal();

  // Mostrar modales de error cuando cambien las props (sin éxito)
  // useEffect para éxito removido - solo se cierra el modal

  useEffect(() => {
    if (serverError) {
      showAlert({
        title: 'Error',
        message: serverError,
        type: 'error',
        confirmText: 'Entendido'
      });
      clearNotices();
    }
  }, [serverError, showAlert, clearNotices]);

  // Expresiones regulares
  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;
  const soloNumeros = /^\d*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (field, value, regex, mensajeError) => {
    // Always update the form data
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Only validate and show errors for non-email fields
    if (field !== 'correo') {
      if (regex.test(value)) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      } else {
        setErrors(prev => ({ ...prev, [field]: mensajeError }));
      }
    }
  };

  const getInputClass = field => (errors[field] ? 'form-control error' : 'form-control');

  const validateOnSubmit = () => {
    const newErrors = {};
    if (!formData.nombres || !soloLetras.test(formData.nombres)) newErrors.nombres = 'Solo se permiten letras y espacios.';
    if (!formData.apellido_paterno || !soloLetras.test(formData.apellido_paterno)) newErrors.apellido_paterno = 'Solo se permiten letras y espacios.';
    if (!formData.apellido_materno || !soloLetras.test(formData.apellido_materno)) newErrors.apellido_materno = 'Solo se permiten letras y espacios.';
    if (!formData.correo || !emailRegex.test(formData.correo)) newErrors.correo = 'Ingresa un correo válido.';
    if (!formData.telefono || !soloNumeros.test(formData.telefono)) newErrors.telefono = 'Solo se permiten números.';
    
    // Eliminadas validaciones de usuario y contraseña
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateOnSubmit()) {
      // Preparar datos con usuario y contraseña como null
      const submitData = {
        ...formData,
        usuario: null,
        contraseña_hash: null
      };
      onSubmit(submitData);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Formulario Donante"
      className="modal-form"
      overlayClassName="modal-overlay"
    >
      <h2>{editMode ? 'Editar Donante' : 'Registrar Donante'}</h2>

      {/* Nombres */}
      <div className="form-group">
        <label>Nombres</label>
        <input
          type="text"
          className={getInputClass('nombres')}
          value={formData.nombres}
          onChange={e =>
            handleChange('nombres', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.nombres && <small className="error-message">{errors.nombres}</small>}
      </div>

      {/* Apellido Paterno */}
      <div className="form-group">
        <label>Apellido Paterno</label>
        <input
          type="text"
          className={getInputClass('apellido_paterno')}
          value={formData.apellido_paterno}
          onChange={e =>
            handleChange('apellido_paterno', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.apellido_paterno && <small className="error-message">{errors.apellido_paterno}</small>}
      </div>

      {/* Apellido Materno */}
      <div className="form-group">
        <label>Apellido Materno</label>
        <input
          type="text"
          className={getInputClass('apellido_materno')}
          value={formData.apellido_materno}
          onChange={e =>
            handleChange('apellido_materno', e.target.value, soloLetras, 'Solo se permiten letras y espacios.')
          }
        />
        {errors.apellido_materno && <small className="error-message">{errors.apellido_materno}</small>}
      </div>

      {/* Correo */}
      <div className="form-group">
        <label>Correo</label>
        <input
          type="email"
          className={getInputClass('correo')}
          value={formData.correo}
          onChange={e => setFormData(prev => ({ ...prev, correo: e.target.value }))}
        />
        {errors.correo && <small className="error-message">{errors.correo}</small>}
      </div>

      {/* Teléfono */}
      <div className="form-group">
        <label>Teléfono</label>
        <input
          type="text"
          className={getInputClass('telefono')}
          value={formData.telefono}
          onChange={e =>
            handleChange('telefono', e.target.value, soloNumeros, 'Solo se permiten números.')
          }
        />
        {errors.telefono && <small className="error-message">{errors.telefono}</small>}
      </div>

      {/* Campos de usuario y contraseña ELIMINADOS */}

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          clearNotices && clearNotices();
          handleSubmit();
        }}
        disabled={loading}
      >
        {loading ? 'Registrando...' : editMode ? 'Guardar Cambios' : 'Registrar Donante'}
      </button>
      
      <ConfirmModal
        show={modalState.show}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
      />
    </Modal>
  );
}

export default DonorFormModal;