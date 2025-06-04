import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Users.css';
import UserModal from './UserModal';

function Users() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [inactiveUsers, setInactiveUsers] = useState([]);

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
    ci: '',
    foto_ci: '',
    licencia_conducir: '',
    foto_licencia: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchInactiveUsers();
  }, [estadoFiltro]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (estadoFiltro && estadoFiltro !== 'all') {
        params.estado = estadoFiltro;
      }
      const res = await axios.get('/users', { params });
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
      ci: '',
      foto_ci: '',
      licencia_conducir: '',
      foto_licencia: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...userData,
        id_rol: parseInt(userData.id_rol),
      };

      await axios.post('/users/', payload);

      fetchUsers();
      handleModalClose();
      alert('Usuario guardado con éxito');
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert('Error al guardar usuario');
    }
  };

  const handleActivate = async (id_usuario) => {
    try {
      const response = await axios.put(`/users/activar/${id_usuario}`);
      
      const nuevaContrasena = response.data?.password;
  
      if (nuevaContrasena) {
        await navigator.clipboard.writeText(nuevaContrasena);
        alert(`✅ Usuario activado.\nContraseña temporal "${nuevaContrasena}" copiada al portapapeles.`);
      } else {
        alert('✅ Usuario activado, pero no se recibió una contraseña.');
      }
  
      fetchUsers();
      fetchInactiveUsers();
      handleModalClose();
    } catch (error) {
      console.error('Error al activar usuario:', error);
      alert('❌ Error al activar usuario. Verifica la consola.');
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
      foto_ci: user.foto_ci || '',
      licencia_conducir: user.licencia_conducir || '',
      foto_licencia: user.foto_licencia || ''
    });

    setEditingUserId(user.id_usuario);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await axios.delete(`/users/${id}`);
        fetchUsers();
        fetchInactiveUsers();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  const handleRestore = (id) => {
    const user = inactiveUsers.find(u => u.id_usuario === id);
    if (!user) return;

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
      foto_ci: user.foto_ci || '',
      licencia_conducir: user.licencia_conducir || '',
      foto_licencia: user.foto_licencia || ''
    });

    setEditingUserId(user.id_usuario);
    setIsModalOpen(true);
  };

  const getRoleName = (idRol) => {
    switch (idRol) {
      case 1: return 'Administrador';
      case 2: return 'Usuario';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="users">
      <h1>Gestión de Usuarios</h1>

      <div className="users-controls">
        <input type="text" placeholder="Buscar usuario..." />
        <button>Buscar</button>
        <select>
          <option value="">Rol</option>
          <option value="admin">Administrador</option>
          <option value="operador">Usuario</option>
        </select>
        <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}>
          <option value="">Estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="all">Todos</option>
        </select>

        <button className="btn-add-user" onClick={handleModalOpen}>+ Agregar Usuario</button>
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
    </div>
  );
}

export default Users;
