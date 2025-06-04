import axios from 'axios';

const axiosPublic = axios.create({
  baseURL: '', // Puedes dejar vacío si usas URLs absolutas
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosPublic;
