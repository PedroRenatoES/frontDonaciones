import axios from 'axios';

// Crea la instancia
const instance = axios.create({
  baseURL: 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token JWT en cada solicitud
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Asegúrate de que este sea el nombre correcto de tu token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default instance;
