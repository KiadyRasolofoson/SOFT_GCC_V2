import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import api from '../helpers/api';

const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5189';

let connection = null;
let listeners = [];

/**
 * Établit la connexion SignalR au hub de notifications.
 * @param {number} userId - ID de l'utilisateur connecté
 * @param {string} token - JWT token
 */
export function connect(userId, token) {
  if (connection && connection.state === 'Connected') {
    return;
  }

  const hubUrl = `${VITE_API_URL.replace('/api', '')}/hubs/notification`;

  connection = new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => token,
    })
    .configureLogging(LogLevel.Warning)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .build();

  connection.on('ReceiveNotification', (notification) => {
    listeners.forEach((cb) => cb(notification));
  });

  connection.onreconnecting(() => {
    console.log('[SignalR] Reconnexion...');
  });

  connection.onreconnected(() => {
    console.log('[SignalR] Reconnecté');
  });

  connection.onclose(() => {
    console.log('[SignalR] Connexion fermée');
  });

  return connection.start().then(() => {
    console.log('[SignalR] Connecté au hub de notifications');
  });
}

/**
 * Ferme la connexion SignalR.
 */
export function disconnect() {
  if (connection) {
    connection.stop();
    connection = null;
  }
  listeners = [];
}

/**
 * Enregistre un callback pour les notifications entrantes.
 * @param {Function} callback - Fonction appelée avec la notification reçue
 * @returns {Function} Fonction pour se désabonner
 */
export function onNotification(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

/**
 * Vérifie si la connexion SignalR est active.
 */
export function isConnected() {
  return connection && connection.state === 'Connected';
}

// ─── REST API ───────────────────────────────────────────────

/**
 * Récupère les notifications paginées.
 */
export async function getNotifications(page = 1, pageSize = 20) {
  const response = await api.get(`/Notification?page=${page}&pageSize=${pageSize}`);
  return response.data;
}

/**
 * Récupère le nombre de notifications non lues.
 */
export async function getUnreadCount() {
  const response = await api.get('/Notification/unread-count');
  return response.data.count;
}

/**
 * Marque une notification comme lue.
 */
export async function markAsRead(notificationId) {
  await api.put(`/Notification/${notificationId}/read`);
}

/**
 * Marque toutes les notifications comme lues.
 */
export async function markAllAsRead() {
  await api.put('/Notification/read-all');
}
