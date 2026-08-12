import axios from 'axios';
import { toast } from 'react-toastify';
import {
  getPermissionDeniedMessage,
  PERMISSION_DENIED_TITLE,
} from './errorHandler';

let interceptorsInstalled = false;

/**
 * Intercepteurs Axios globaux :
 * - attache le JWT à TOUTES les requêtes axios (pages Compétences / Carrières / Org, etc.)
 * - toasts / événements pour 401 et 403
 *
 * Beaucoup d'écrans utilisent `axios` brut (pas apiClient) ; sans ce header,
 * FallbackPolicy côté API renvoie 401 « session expirée ».
 */
export function setupGlobalAuthErrorHandling() {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  axios.interceptors.request.use(
    (config) => {
      // Ne pas écraser un Authorization déjà fourni explicitement
      if (!config.headers?.Authorization && !config.headers?.authorization) {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403 && data?.error !== 'license_invalid') {
        const message = getPermissionDeniedMessage(error);
        // Évite les toasts en rafale sur la même requête
        if (!error.config?.__permissionToastShown) {
          error.config = error.config || {};
          error.config.__permissionToastShown = true;
          toast.error(`${PERMISSION_DENIED_TITLE} : ${message}`, {
            toastId: 'permission-denied',
            autoClose: 7000,
          });
        }
        window.dispatchEvent(
          new CustomEvent('app:permission-denied', {
            detail: { title: PERMISSION_DENIED_TITLE, message, data },
          })
        );
      }

      if (status === 401 && data?.error === 'unauthorized') {
        window.dispatchEvent(
          new CustomEvent('app:auth-expired', {
            detail: { message: data?.message || 'Session expirée' },
          })
        );
      }

      return Promise.reject(error);
    }
  );
}
