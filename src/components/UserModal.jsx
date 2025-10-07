import React, { useState } from 'react';
import '../styles/Users.css';

const CustomUserModal = ({
  isOpen,
  onClose,
  userData,
  onChange,
  onSave,
  onActivate,
  isEditingInactive
}) => {
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const soloLetras = /^[a-zA-ZÁÉÍÓÚÑáéíóúñ\s]*$/;
  const soloNumeros = /^\d*$/;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let error = '';

    // Validaciones por campo
    if (['nombres', 'apellido_paterno', 'apellido_materno'].includes(name)) {
      if (!soloLetras.test(value)) {
        error = 'Solo letras y espacios permitidos.';
      }
    }

    if (['telefono', 'ci'].includes(name)) {
      if (!soloNumeros.test(value)) {
        error = 'Solo números permitidos.';
      }
    }

    if (name === 'contrasena') {
      if (value.length < 12) {
        error = 'La contraseña debe tener al menos 12 caracteres.';
      }
    }

    if (name === 'estado' && value === '') {
      e.target.value = 'activo'; // Default state set to 'activo'
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    onChange(e);
  };

  const getInputClass = (name) => errors[name] ? 'error-input' : '';

  const today = new Date();
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  return (
    <div className="custom-user-modal" onClick={handleOverlayClick}>
      <div className="custom-modal-content">
        <h2>{isEditingInactive ? 'Activar Usuario' : 'Manejo de Usuario'}</h2>

        {[
          { label: 'Nombres', name: 'nombres', type: 'text' },
          { label: 'Apellido Paterno', name: 'apellido_paterno', type: 'text' },
          { label: 'Apellido Materno', name: 'apellido_materno', type: 'text' },
          { label: 'Fecha de Nacimiento', name: 'fecha_nacimiento', type: 'date', max: maxDate },
          { label: 'Dirección Domiciliaria', name: 'direccion_domiciliaria', type: 'text' },
          { label: 'Correo Electrónico', name: 'correo', type: 'email' },
          { label: 'Contraseña', name: 'contrasena', type: 'password' },
          { label: 'Teléfono', name: 'telefono', type: 'text' },
          { label: 'CI', name: 'ci', type: 'text' },
        ].map(({ label, name, type, max }) => (
          <div className="form-group" key={name}>
            <label>{label}</label>
            <input
              type={type}
              name={name}
              value={userData[name] || ''}
              onChange={handleChange}
              placeholder={label}
              className={getInputClass(name)}
              max={max}
            />
            {errors[name] && <small className="error-message">{errors[name]}</small>}
          </div>
        ))}

        <div className="form-group">
          <label>Estado</label>
          <input
            type="text"
            name="estado"
            value={userData.estado === 1 ? 'activo' : 'activo'}
            disabled
          />
        </div>

        <div className="form-group">
          <label>Rol</label>
          <select name="id_rol" value={userData.id_rol || ''} onChange={onChange}>
            <option value="">Seleccione un rol</option>
            <option value="1">Administrador</option>
            <option value="2">Voluntario</option>
            <option value="3">Almacenista</option>
          </select>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          {isEditingInactive ? (
            <button className="btn-activate" onClick={onActivate}>Activar Usuario</button>
          ) : (
            <button className="btn-save" onClick={async () => {
              await onSave();
              onClose();
            }}>Guardar</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomUserModal;
