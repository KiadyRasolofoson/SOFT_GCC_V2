import axios from 'axios';

// Configuration de base pour Axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5189/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter un token JWT si nécessaire
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Récupérez le token depuis localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
