import React, { useState, useEffect } from 'react';
import '../styles/Donors.css';
import axios from '../axios';
import Modal from 'react-modal';
import DonorFormModal from '../components/DonorFormModal';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';


Modal.setAppElement('#root');

function Donors() {
  const [donors, setDonors] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDonorId, setSelectedDonorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { modalState, showConfirm, showAlert } = useConfirmModal();
  const [filteredDonors, setFilteredDonors] = useState([]);

  const [formData, setFormData] = useState({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    correo: '',
    telefono: '',
    usuario: '',
    contraseña_hash: '',
  });

  useEffect(() => {
    fetchDonors();
  }, []);
const fetchDonors = async () => {
  try {
    const res = await axios.get('/donantes');
    setDonors(res.data);
    setFilteredDonors(res.data); // también carga los filtrados
  } catch (error) {
    console.error('Error al cargar donantes', error);
  }
};

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: "Eliminar Donante",
      message: "¿Estás seguro de eliminar este donante?",
      type: "alert"
    });

    if (!confirmed) return;

    try {
      await axios.delete(`/donantes/${id}`);
      await showAlert({
        title: "Éxito",
        message: "Donante eliminado correctamente",
        type: "success"
      });
      fetchDonors();
    } catch (error) {
      console.error('Error al eliminar donante', error);
      await showAlert({
        title: "Error",
        message: "No se pudo eliminar el donante",
        type: "error"
      });
    }
  };

  const handleCreate = async () => {
    try {
      await axios.post('/donantes', formData);
      setModalOpen(false);
      fetchDonors();
    } catch (error) {
      console.error('Error al crear donante', error);
    }
  };

  const handleEdit = async () => {
    try {
      await axios.put(`/donantes/${selectedDonorId}`, formData);
      setModalOpen(false);
      fetchDonors();
      setEditMode(false);
      setSelectedDonorId(null);
      await showAlert({
        title: 'Éxito',
        message: 'Donante editado con éxito',
        type: 'success',
        confirmText: 'Aceptar'
      });
    } catch (error) {
      console.error('Error al editar donante', error);
    }
  };

  const handleSearch = () => {
  const filtered = donors.filter(d => {
    const fullName = `${d.nombres} ${d.apellido_paterno} ${d.apellido_materno}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });
  setFilteredDonors(filtered);
};


  const openEditModal = (donor) => {
    setFormData({
      nombres: donor.nombres,
      apellido_paterno: donor.apellido_paterno,
      apellido_materno: donor.apellido_materno,
      correo: donor.correo,
      telefono: donor.telefono,
      usuario: donor.usuario,
      contraseña_hash: donor.contraseña_hash || '',
    });
    setSelectedDonorId(donor.id_donante);
    setEditMode(true);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      correo: '',
      telefono: '',
      usuario: '',
      contraseña_hash: '',
    });
    setEditMode(false);
    setModalOpen(true);
  };

  return (
    <div className="donors">
      <h1 className="donors-title">Donantes</h1>

      <div className="donors-header">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar donante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button onClick={handleSearch}>
            Buscar
          </button>
          <button className="btn-add-donor" onClick={openCreateModal}>
            + Agregar Donante
          </button>
        </div>
      </div>

      <table className="donors-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Usuario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
        {filteredDonors.map(d => (
          <tr key={d.id_donante}>
            <td>{`${d.nombres} ${d.apellido_paterno} ${d.apellido_materno}`}</td>
            <td>{d.telefono}</td>
            <td>{d.correo}</td>
            <td>{d.usuario}</td>
            <td>
              <button className="btn-edit" onClick={() => openEditModal(d)}>Editar</button>
              <button className="btn-delete" onClick={() => handleDelete(d.id_donante)}>Eliminar</button>
            </td>
          </tr>
        ))}

        </tbody>
      </table>

<DonorFormModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onSubmit={editMode ? handleEdit : handleCreate}
  formData={formData}
  setFormData={setFormData}
  editMode={editMode}
/>

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

    </div>
  );
}

export default Donors;
