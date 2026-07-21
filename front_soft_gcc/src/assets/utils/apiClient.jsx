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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse – enrichit les erreurs avec des métadonnées utiles
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Enrichit l'erreur avec des infos standardisées pour errorHandler
    if (error.response) {
      const { status, data } = error.response;
      error.httpStatus = status;
      error.apiData = data;

      // Émet un événement global pour les erreurs critiques
      if (status === 401) {
        window.dispatchEvent(new CustomEvent('app:auth-expired', { detail: { message: data?.message || 'Session expirée' } }));
      } else if (status === 403 && data?.error === 'license_invalid') {
        window.dispatchEvent(new CustomEvent('app:license-invalid', { detail: { message: data?.message || 'Licence invalide' } }));
      }
    } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
      window.dispatchEvent(new CustomEvent('app:network-error', { detail: { message: 'Serveur injoignable' } }));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
