import React, { useState, useEffect } from 'react';
import axios from '../axios';
import '../styles/Login.css';
import '../styles/FadeOverlay.css';
import { useSecurity } from '../hooks/useSecurity';
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
  // Eliminado conteo de intentos y bloqueo de cuenta
  
  const { logActivity } = useSecurity();
  const { modalState, showAlert } = useConfirmModal();

  // Obtener los almacenes al montar el componente
  useEffect(() => {
    const fetchAlmacenes = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/almacenes');
        setAlmacenes(response.data);
      } catch (err) {
        console.error('Error al cargar almacenes', err);
        setError('No se pudieron cargar los almacenes');
      }
    };
    fetchAlmacenes();
  }, []);

  const handleLogin = async () => {
    // Validaciones básicas simples
    if (!ci || ci.trim() === '') {
      await showAlert({ 
        title: 'Campo requerido', 
        message: 'Debe ingresar su número de cédula', 
        type: 'alert', 
        confirmText: 'Entendido' 
      });
      return;
    }

    if (!contrasena || contrasena.trim() === '') {
      await showAlert({ 
        title: 'Campo requerido', 
        message: 'Debe ingresar su contraseña', 
        type: 'alert', 
        confirmText: 'Entendido' 
      });
      return;
    }

    if (contrasena.length < 12) {
      await showAlert({ 
        title: 'Contraseña inválida', 
        message: 'La contraseña debe tener al menos 12 caracteres', 
        type: 'alert', 
        confirmText: 'Entendido' 
      });
      return;
    }

    if (!almacenSeleccionado) {
      await showAlert({ 
        title: 'Almacén requerido', 
        message: 'Debe seleccionar un almacén', 
        type: 'alert', 
        confirmText: 'Entendido' 
      });
      return;
    }

    try {
      // Datos simples para enviar
      const loginData = {
        ci: ci.trim(),
        contrasena: contrasena.trim(),
        almacen_id: almacenSeleccionado
      };
      
      console.log('Enviando datos de login:', loginData);
      
      const response = await axios.post('/auth/login', loginData);

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
        localStorage.setItem('ci', loginData.ci);
        
        if (usuario.rol === 2) {
          localStorage.setItem('almacen', 'Almacen Rapido');
          localStorage.setItem('id_almacen', '');
        } else {
          localStorage.setItem('almacen', almacenSeleccionado);
          // Buscar el id_almacen correspondiente al nombre seleccionado
          const almacenObj = almacenes.find(a => a.nombre_almacen === almacenSeleccionado);
          if (almacenObj) {
            localStorage.setItem('id_almacen', almacenObj.id_almacen);
          } else {
            localStorage.setItem('id_almacen', '');
          }
        }

        setValidationErrors({});
        setError('');

        setAnimando(true);
        setTimeout(() => {
          onLogin(usuario);
        }, 2500);
      }
    } catch (error) {
      console.error('Error completo en login:', error);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      let errorMessage = 'Error en el login';
      let alertTitle = 'Error de Login';
      
      // Verificar si hay respuesta del servidor
      if (error.response?.data) {
        const serverData = error.response.data;
        console.log('Datos del servidor:', serverData);
        
        // Buscar mensaje de error en diferentes campos posibles
        const serverMessage = serverData.error || serverData.message || serverData.detail || '';
        console.log('Mensaje del servidor:', serverMessage);
        
        // Convertir a minúsculas para comparación
        const messageLower = serverMessage.toLowerCase();
        
        if (messageLower.includes('usuario no encontrado') || 
            messageLower.includes('user not found') ||
            messageLower.includes('no existe') ||
            messageLower.includes('not found')) {
          errorMessage = 'Usuario no encontrado. Verifique su número de cédula.';
          alertTitle = 'Usuario No Encontrado';
        } else if (messageLower.includes('contraseña incorrecta') || 
                   messageLower.includes('password incorrect') ||
                   messageLower.includes('wrong password')) {
          errorMessage = 'Contraseña incorrecta. Verifique su contraseña.';
          alertTitle = 'Contraseña Incorrecta';
        } else if (messageLower.includes('credenciales incorrectas') || 
                   messageLower.includes('invalid credentials') ||
                   messageLower.includes('credenciales')) {
          errorMessage = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
          alertTitle = 'Credenciales Incorrectas';
        } else if (serverMessage) {
          // Si hay mensaje del servidor, usarlo
          errorMessage = serverMessage;
          alertTitle = 'Error del Servidor';
        }
      } else if (error.response?.status) {
        // Manejar por código de estado HTTP
        switch (error.response.status) {
          case 401:
            errorMessage = 'Credenciales incorrectas. Verifique su usuario y contraseña.';
            alertTitle = 'Acceso Denegado';
            break;
          case 404:
            errorMessage = 'Usuario no encontrado. Verifique su número de cédula.';
            alertTitle = 'Usuario No Encontrado';
            break;
          case 403:
            errorMessage = 'Acceso denegado. Contacte al administrador.';
            alertTitle = 'Acceso Denegado';
            break;
          case 500:
            errorMessage = 'Error del servidor. Intente más tarde.';
            alertTitle = 'Error del Servidor';
            break;
          default:
            errorMessage = `Error del servidor (${error.response.status})`;
            alertTitle = 'Error del Servidor';
        }
      } else if (error.message) {
        errorMessage = error.message;
        alertTitle = 'Error de Conexión';
      }
      
      setError(errorMessage);
      await showAlert({ 
        title: alertTitle, 
        message: errorMessage, 
        type: 'alert', 
        confirmText: 'Entendido' 
      });
    }
  };

  return (
    <div className="login-page" >
      <div className="login-card" style={{ marginRight: '220px'}}>
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
          >
            Iniciar Sesión
          </button>
          
          {/* Indicador de intentos fallidos removido a solicitud */}
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
