import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Login.css';
import '../styles/FadeOverlay.css';

function Login({ onLogin }) {
  const [ci, setCi] = useState('');
  const [contrasena, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [almacenes, setAlmacenes] = useState([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState('');
  const [animando, setAnimando] = useState(false);

  // Obtener los almacenes al montar el componente
  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get('https://backenddonaciones.onrender.com/api/almacenes');
        setAlmacenes(response.data);
      } catch (err) {
        console.error('Error al cargar almacenes', err);
        setError('No se pudieron cargar los almacenes');
      }
    };
    fetchAlmacenes();
  }, []);

  const handleLogin = async () => {
    if (!almacenSeleccionado) {
      setError('Debe seleccionar un almacén.');
      return;
    }

    try {
      const response = await axios.post('/auth/login', {
        ci,
        contrasena,
      });

      if (response.status === 200) {
        const usuario = response.data.usuario;
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('rol', usuario.rol);
        localStorage.setItem('correo', usuario.correo);
        localStorage.setItem('nombres', usuario.nombres);
        localStorage.setItem('apellidos', usuario.apellido_paterno + ' ' + usuario.apellido_materno);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('id', usuario.id);
        localStorage.setItem('cambiarPassword', response.data.cambiarPassword ? 'true' : 'false');
        localStorage.setItem('ci', ci);
        localStorage.setItem('almacen', almacenSeleccionado); // Guardar nombre del almacén

        setAnimando(true);
        setTimeout(() => {
          onLogin(usuario);
        }, 2500);
        console.log(almacenSeleccionado);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setError(error.response.data.error);
      } else {
        setError('Hubo un problema al iniciar sesión');
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-image">
          <img src="/logo.png" alt="Login visual" />
        </div>
        <div className="login-form">
          <h2>ALAS CHIQUITANAS</h2>

          <div className="input-group">
            <label htmlFor="ci">USUARIO</label>
            <input
              type="input"
              id="ci"
              placeholder="Ingrese su usuario"
              value={ci}
              onChange={(e) => setCi(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">CONTRASEÑA</label>
            <input
              type="password"
              id="password"
              placeholder="Ingrese su contraseña"
              value={contrasena}
              onChange={(e) => setContraseña(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="almacen">ALMACÉN</label>
            <select
              id="almacen"
              value={almacenSeleccionado}
              onChange={(e) => setAlmacenSeleccionado(e.target.value)}
            >
              <option value="">Seleccione un almacén</option>
              {almacenes.map((almacen) => (
                <option key={almacen.id_almacen} value={almacen.nombre_almacen}>
                  {almacen.nombre_almacen}
                </option>
              ))}
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="login-button" onClick={handleLogin}>
            Iniciar Sesión
          </button>
        </div>
      </div>

      {animando && (
        <div className="fade-overlay">
          <img src="/logo.png" alt="Logo" className="fade-logo" />
        </div>
      )}
    </div>
  );
}

export default Login;
