import React, { useState } from 'react';
import axios from '../axios';
import '../styles/Login.css';
import '../styles/FadeOverlay.css';

function Login({ onLogin }) {
  const [ci, setCi] = useState('');
  const [contrasena, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [animando, setAnimando] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post('/auth/login', {
        ci,
        contrasena,
      });
      if (response.status === 200) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('rol', response.data.usuario.rol);
        localStorage.setItem('correo', response.data.usuario.correo);
        localStorage.setItem('nombres', response.data.usuario.nombres);
        localStorage.setItem('apellidos', response.data.usuario.apellido_paterno + ' ' + response.data.usuario.apellido_materno);
        localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        localStorage.setItem('id', response.data.usuario.id);
        localStorage.setItem('cambiarPassword', response.data.cambiarPassword ? 'true' : 'false');
        localStorage.setItem('ci', ci);
        setAnimando(true);
        setTimeout(() => {
          onLogin(response.data.user);
        }, 2500);
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
