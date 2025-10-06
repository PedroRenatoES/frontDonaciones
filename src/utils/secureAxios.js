import axios from 'axios';
import { validateSession, logSecurityEvent, sanitizeInput } from './security.js';

// Crear instancia segura de axios
const secureAxios = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 segundos timeout
});

// Interceptor de request para validaciones de seguridad
secureAxios.interceptors.request.use(
  (config) => {
    // Validar sesión antes de cada request
    if (!validateSession()) {
      logSecurityEvent('SESSION_EXPIRED', { url: config.url });
      localStorage.clear();
      window.location.href = '/login';
      return Promise.reject(new Error('Sesión expirada'));
    }

    // Agregar token de autorización
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Sanitizar parámetros de URL
    if (config.params) {
      for (const [key, value] of Object.entries(config.params)) {
        config.params[key] = sanitizeInput(value, 'string');
      }
    }

    // Sanitizar datos del body
    if (config.data && typeof config.data === 'object') {
      const sanitizedData = {};
      for (const [key, value] of Object.entries(config.data)) {
        if (typeof value === 'string') {
          sanitizedData[key] = sanitizeInput(value, 'string');
        } else {
          sanitizedData[key] = value;
        }
      }
      config.data = sanitizedData;
    }

    // Log de request para auditoría
    logSecurityEvent('API_REQUEST', {
      method: config.method?.toUpperCase(),
      url: config.url,
      hasAuth: !!token
    });

    return config;
  },
  (error) => {
    logSecurityEvent('REQUEST_ERROR', { error: error.message });
    return Promise.reject(error);
  }
);

// Interceptor de response para manejo de errores de seguridad
secureAxios.interceptors.response.use(
  (response) => {
    // Log de respuesta exitosa
    logSecurityEvent('API_RESPONSE_SUCCESS', {
      status: response.status,
      url: response.config.url
    });

    return response;
  },
  (error) => {
    const { response } = error;

    // Manejar diferentes tipos de errores de seguridad
    if (response) {
      switch (response.status) {
        case 401:
          logSecurityEvent('UNAUTHORIZED_ACCESS', {
            url: response.config.url,
            message: 'Token inválido o expirado'
          });
          localStorage.clear();
          window.location.href = '/login';
          break;

        case 403:
          logSecurityEvent('FORBIDDEN_ACCESS', {
            url: response.config.url,
            message: 'Acceso denegado - permisos insuficientes'
          });
          break;

        case 429:
          logSecurityEvent('RATE_LIMIT_EXCEEDED', {
            url: response.config.url,
            message: 'Demasiadas solicitudes'
          });
          break;

        case 500:
          logSecurityEvent('SERVER_ERROR', {
            url: response.config.url,
            message: 'Error interno del servidor'
          });
          break;

        default:
          logSecurityEvent('API_ERROR', {
            status: response.status,
            url: response.config.url,
            message: response.data?.message || 'Error desconocido'
          });
      }
    } else if (error.code === 'ECONNABORTED') {
      logSecurityEvent('REQUEST_TIMEOUT', {
        url: error.config?.url,
        message: 'Solicitud expirada'
      });
    } else {
      logSecurityEvent('NETWORK_ERROR', {
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

// Función para hacer requests seguros con validación adicional
export const secureRequest = async (method, url, data = null, options = {}) => {
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      ...options
    };

    if (data) {
      if (method.toLowerCase() === 'get') {
        config.params = data;
      } else {
        config.data = data;
      }
    }

    const response = await secureAxios(config);
    return response;
  } catch (error) {
    // Re-lanzar el error para que el componente pueda manejarlo
    throw error;
  }
};

// Funciones helper para métodos HTTP comunes
export const secureGet = (url, params = {}) => secureRequest('GET', url, params);
export const securePost = (url, data = {}) => secureRequest('POST', url, data);
export const securePut = (url, data = {}) => secureRequest('PUT', url, data);
export const secureDelete = (url, data = {}) => secureRequest('DELETE', url, data);

export default secureAxios;
