import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Users.css';
import UserModal from './UserModal';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useSimpleSecurity } from '../hooks/useSimpleSecurity';

function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [inactiveUsers, setInactiveUsers] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { modalState, showConfirm, showAlert } = useConfirmModal();
  const { isAdmin, userRole, logActivity } = useSimpleSecurity();

  // Verificar acceso de admin
  useEffect(() => {
    if (userRole !== null && !isAdmin) {
      logActivity('ACCESS_DENIED_INSUFFICIENT_ROLE', { 
        requiredRole: 'admin',
        currentRole: userRole
      });
      window.location.href = '/dashboard';
    }
  }, [isAdmin, userRole, logActivity]);

  const [userData, setUserData] = useState({
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    direccion_domiciliaria: '',
    correo: '',
    contrasena: '',
    telefono: '',
    id_rol: '',
    estado: 'activo', // Default state set to 'activo'
  });

  useEffect(() => {
    fetchUsers();
    fetchInactiveUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : res.data.usuarios || []);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };

  const fetchInactiveUsers = async () => {
    try {
      const res = await axios.get('/users/inactive');
      setInactiveUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error('Error al obtener usuarios inactivos:', error);
    }
  };

  const handleModalOpen = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log('handleModalClose ejecutándose...');
    setIsModalOpen(false);
    setEditingUserId(null);
    setUserData({
      nombres: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_nacimiento: '',
      direccion_domiciliaria: '',
      correo: '',
      contrasena: '',
      telefono: '',
      id_rol: '',
      estado: 'activo', // Reset state to default
    });
    console.log('Modal cerrado y datos reseteados');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      console.log('Iniciando guardado de usuario...');
      const payload = {
        ...userData,
        id_rol: parseInt(userData.id_rol),
        estado: userData.estado === 'activo' ? 1 : 0, // Convert estado to number
      };

      console.log('Payload a enviar:', payload);
      await axios.post('/users/', payload);
      console.log('Usuario guardado exitosamente');

      // Mostrar mensaje de éxito y actualizar tabla
      setShowSuccessMessage(true);
      await fetchUsers();
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setToast({ show: true, message: 'Error al guardar usuario', type: 'error' });
    }
  };

  const handleActivate = async (id_usuario) => {
    try {
      const response = await axios.put(`/users/activar/${id_usuario}`);
      
      const nuevaContrasena = response.data?.password;
  
      if (nuevaContrasena) {
        await navigator.clipboard.writeText(nuevaContrasena);
        await showAlert({
          title: "Usuario Activado",
          message: `✅ Usuario activado.\nContraseña temporal "${nuevaContrasena}" copiada al portapapeles.`,
          type: "success"
        });
      } else {
        await showAlert({
          title: "Usuario Activado",
          message: "✅ Usuario activado, pero no se recibió una contraseña.",
          type: "success"
        });
      }

      fetchUsers();
      fetchInactiveUsers();
      handleModalClose();
    } catch (error) {
      console.error('Error al activar usuario:', error);
      await showAlert({
        title: "Error",
        message: "❌ Error al activar usuario. Verifica la consola.",
        type: "error"
      });
    }
  };
  
    
  
    
  const handleEdit = (user) => {
    setUserData({
      nombres: user.nombres || '',
      apellido_paterno: user.apellido_paterno || '',
      apellido_materno: user.apellido_materno || '',
      fecha_nacimiento: user.fecha_nacimiento || '',
      direccion_domiciliaria: user.direccion_domiciliaria || '',
      correo: user.correo || '',
      contrasena: '',
      telefono: user.telefono || '',
      id_rol: user.id_rol?.toString() || '',
      ci: user.ci || '',
    });

    setEditingUserId(user.id_usuario);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm({
      title: "Eliminar Usuario",
      message: "¿Estás seguro de eliminar este usuario?",
      type: "alert"
    });

    if (!confirmed) return;

    try {
      await axios.delete(`/users/${id}`);
      await showAlert({
        title: "Éxito",
        message: "Usuario eliminado correctamente",
        type: "success"
      });
      fetchUsers();
      fetchInactiveUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      await showAlert({
        title: "Error",
        message: "No se pudo eliminar el usuario",
        type: "error"
      });
    }
  };

  const getRoleName = (idRol) => {
    switch (idRol) {
      case 1: return 'Administrador';
      case 2: return 'Voluntario';
      case 3: return 'Almacenista';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="users">
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
      <h1>Gestión de Usuarios</h1>

      <div className="users-controls">
        <input type="text" placeholder="Buscar usuario..." />
        <button>Buscar</button>
        <select>
          <option value="">Rol</option>
          <option value="admin">Administrador</option>
          <option value="operador">Usuario</option>
        </select>


        {showSuccessMessage ? (
          <div style={{ 
            color: '#27ae60', 
            fontWeight: 'bold', 
            fontSize: '16px',
            padding: '10px',
            backgroundColor: '#d5f4e6',
            borderRadius: '5px',
            border: '1px solid #27ae60'
          }}>
            ✅ Se creó exitosamente
          </div>
        ) : (
          <button className="btn-add-user" onClick={handleModalOpen}>+ Agregar Usuario</button>
        )}
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Email</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(users) && users.length > 0 ? (
            users.map(user => (
              <tr key={user.id_usuario}>
                <td>{`${user.nombres} ${user.apellido_paterno} ${user.apellido_materno}`}</td>
                <td>{user.correo ? user.correo.split('@')[0] : 'N/A'}</td>
                <td>{user.correo || 'Sin correo'}</td>
                <td>{getRoleName(user.id_rol)}</td>
                <td><span className="status-badge activo">Activo</span></td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(user)}>Editar</button>
                  <button className="btn-delete" onClick={() => handleDelete(user.id_usuario)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No hay usuarios para mostrar</td>
            </tr>
          )}
        </tbody>
      </table>

      <UserModal
        isOpen={isModalOpen}
        userData={userData}
        onChange={handleChange}
        onClose={handleModalClose}
        onSave={handleSave}
        onActivate={handleActivate}
        isEditingInactive={!!editingUserId && inactiveUsers.some(u => u.id_usuario === editingUserId)}
      />

      <h2>Usuarios Inactivos</h2>
      <table className="users-table inactive-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {inactiveUsers.length > 0 ? (
            inactiveUsers.map((user, index) => (
              <tr key={index}>
                <td>{`${user.nombres} ${user.apellido_paterno || ''} ${user.apellido_materno || ''}`.trim()}</td>
                <td>{user.correo || 'Sin correo'}</td>
                <td>{user.telefono || 'Sin teléfono'}</td>
                <td>
                <button
                    className="btn-reset"
                    onClick={() => handleActivate(user.id_usuario)}
                  >
                    Activar
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(user.id_usuario)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No hay usuarios inactivos para mostrar</td>
            </tr>
          )}
        </tbody>
      </table>

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

export default Users;
