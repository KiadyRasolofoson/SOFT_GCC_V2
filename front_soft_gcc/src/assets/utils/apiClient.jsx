import axios from 'axios';

// Configuration de base pour Axios
const apiClient = axios.create({
  baseURL: 'https://localhost:7082/api', // Assurez-vous que l'URL correspond à celle de votre backend
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
