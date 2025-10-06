import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Login.css';
import '../styles/FadeOverlay.css';
import { useSecurity } from '../hooks/useSecurity';
import { validateAndSanitize } from '../utils/security';
import { getSchema } from '../utils/validationSchemas';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';

function Login({ onLogin }) {
  const [ci, setCi] = useState('');
  const [contrasena, setContraseña] = useState('');
  const [error, setError] = useState('');
  const [almacenes, setAlmacenes] = useState([]);
  const [almacenSeleccionado, setAlmacenSeleccionado] = useState('');
  const [animando, setAnimando] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const { logActivity } = useSecurity();
  const { modalState, showAlert } = useConfirmModal();

  // Obtener los almacenes al montar el componente
  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/almacenes');
        setAlmacenes(response.data);
      } catch (err) {
        console.error('Error al cargar almacenes', err);
        setError('No se pudieron cargar los almacenes');
      }
    };
    fetchAlmacenes();
  }, []);

  const handleLogin = async () => {
    // Verificar si está bloqueado
    if (isBlocked) {
      await showAlert({
        title: "Cuenta Bloqueada",
        message: "Demasiados intentos fallidos. Intenta nuevamente en 15 minutos.",
        type: "error"
      });
      return;
    }

    // Validar datos de entrada
    const loginData = { ci, contrasena };
    const schema = getSchema('login');
    const validation = validateAndSanitize(loginData, schema);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      logActivity('LOGIN_VALIDATION_FAILED', { errors: validation.errors });
      return;
    }

    if (!almacenSeleccionado) {
      setError('Debe seleccionar un almacén.');
      return;
    }

    try {
      // Usar datos sanitizados
      const sanitizedData = validation.data;
      
      logActivity('LOGIN_ATTEMPT', { ci: sanitizedData.ci });
      
      const response = await axios.post('/auth/login', sanitizedData);

      if (response.status === 200) {
        const usuario = response.data.usuario;
        
        // Log de login exitoso
        logActivity('LOGIN_SUCCESS', { 
          userId: usuario.id, 
          role: usuario.rol,
          almacen: almacenSeleccionado 
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('rol', usuario.rol);
        localStorage.setItem('correo', usuario.correo);
        localStorage.setItem('nombres', usuario.nombres);
        localStorage.setItem('apellidos', usuario.apellido_paterno + ' ' + usuario.apellido_materno);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        localStorage.setItem('id', usuario.id);
        localStorage.setItem('cambiarPassword', response.data.cambiarPassword ? 'true' : 'false');
        localStorage.setItem('ci', sanitizedData.ci);
        
        if (usuario.rol === 2) {
          localStorage.setItem('almacen', 'Almacen Rapido');
        } else {
          localStorage.setItem('almacen', almacenSeleccionado);
        }

        // Resetear intentos fallidos
        setLoginAttempts(0);
        setIsBlocked(false);
        setValidationErrors({});
        setError('');

        setAnimando(true);
        setTimeout(() => {
          onLogin(usuario);
        }, 2500);
      }
    } catch (error) {
      // Incrementar intentos fallidos
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      // Bloquear después de 5 intentos
      if (newAttempts >= 5) {
        setIsBlocked(true);
        logActivity('LOGIN_BLOCKED', { 
          ci: sanitizedData.ci, 
          attempts: newAttempts 
        });
        
        // Desbloquear después de 15 minutos
        setTimeout(() => {
          setIsBlocked(false);
          setLoginAttempts(0);
        }, 15 * 60 * 1000);
      }
      
      logActivity('LOGIN_FAILED', { 
        ci: sanitizedData.ci, 
        attempts: newAttempts,
        error: error.response?.data?.error || 'Error desconocido'
      });
      
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
          
          {validationErrors.length > 0 && (
            <div className="error-message">
              <ul>
                {validationErrors.map((err, index) => (
                  <li key={index}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <button 
            className="login-button" 
            onClick={handleLogin}
            disabled={isBlocked}
          >
            {isBlocked ? 'Cuenta Bloqueada' : 'Iniciar Sesión'}
          </button>
          
          {loginAttempts > 0 && !isBlocked && (
            <div className="warning-message">
              Intentos fallidos: {loginAttempts}/5
            </div>
          )}
        </div>
      </div>

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

      {animando && (
        <div className="fade-overlay">
          <img src="/logo.png" alt="Logo" className="fade-logo" />
        </div>
      )}
    </div>
  );
}

export default Login;
