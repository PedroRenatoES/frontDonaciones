import React, { useState } from 'react';
import Modal from 'react-modal';
import '../styles/Donors.css';

Modal.setAppElement('#root');

function DonorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, editMode, loading, serverError, serverSuccess, clearNotices }) {
  const [errors, setErrors] = useState({});

  // Expresiones regulares
  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;
  const soloNumeros = /^\d*$/;
  const letrasYNumeros = /^[a-zA-Z0-9]*$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleChange = (field, value, regex, mensajeError) => {
    if (regex.test(value)) {
      setErrors(prev => ({ ...prev, [field]: '' }));
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setErrors(prev => ({ ...prev, [field]: mensajeError }));
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
    if (!formData.usuario || !letrasYNumeros.test(formData.usuario)) newErrors.usuario = 'Solo letras y números sin espacios.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      {serverSuccess && <div className="alert-success" style={{ marginBottom: 10 }}>{serverSuccess}</div>}
      {serverError && <div className="alert-error" style={{ marginBottom: 10 }}>{serverError}</div>}

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
          onChange={e =>
            handleChange('correo', e.target.value, emailRegex, 'Ingresa un correo válido.')
          }
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

      {/* Usuario */}
      <div className="form-group">
        <label>Usuario</label>
        <input
          type="text"
          className={getInputClass('usuario')}
          value={formData.usuario}
          onChange={e =>
            handleChange('usuario', e.target.value, letrasYNumeros, 'Solo letras y números sin espacios.')
          }
        />
        {errors.usuario && <small className="error-message">{errors.usuario}</small>}
      </div>

      {/* Contraseña */}
      {!editMode && (
        <div className="form-group">
          <label>Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={formData.contraseña_hash}
            onChange={e => setFormData({ ...formData, contraseña_hash: e.target.value })}
          />
        </div>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          clearNotices && clearNotices();
          if (validateOnSubmit()) onSubmit();
        }}
        disabled={loading}
      >
        {loading ? 'Registrando...' : editMode ? 'Guardar Cambios' : 'Registrar Donante'}
      </button>
    </Modal>
  );
}

export default DonorFormModal;
