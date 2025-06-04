import React from 'react';
import Modal from 'react-modal';
import '../styles/Donors.css';

Modal.setAppElement('#root');

function DonorFormModal({ isOpen, onClose, onSubmit, formData, setFormData, editMode }) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Formulario Donante"
      className="modal-form"
      overlayClassName="modal-overlay"
    >
      <h2>{editMode ? 'Editar Donante' : 'Registrar Donante'}</h2>

      <div className="form-group">
        <label>Nombres</label>
        <input type="text" value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Apellido Paterno</label>
        <input type="text" value={formData.apellido_paterno} onChange={e => setFormData({ ...formData, apellido_paterno: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Apellido Materno</label>
        <input type="text" value={formData.apellido_materno} onChange={e => setFormData({ ...formData, apellido_materno: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Correo</label>
        <input type="email" value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Teléfono</label>
        <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Usuario</label>
        <input type="text" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value })} />
      </div>
      {!editMode && (
        <div className="form-group">
          <label>Contraseña</label>
          <input type="password" value={formData.contraseña_hash} onChange={e => setFormData({ ...formData, contraseña_hash: e.target.value })} />
        </div>
      )}

      <div className="form-group">
        <button className="btn btn-primary" onClick={onSubmit}>
          {editMode ? 'Guardar Cambios' : 'Registrar Donante'}
        </button>
      </div>
    </Modal>
  );
}

export default DonorFormModal;
