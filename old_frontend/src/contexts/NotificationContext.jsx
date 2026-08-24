import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import { useUser } from '../pages/Authentification/UserContext';
import {
  connect,
  disconnect,
  onNotification,
  getNotifications,
  getUnreadCount,
  markAsRead as apiMarkAsRead,
  markAllAsRead as apiMarkAllAsRead,
} from '../services/notificationService';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;
  const initialFetchDone = useRef(false);

  // Récupérer les notifications depuis le REST
  const fetchNotifications = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      const data = await getNotifications(pageNum, pageSize);
      if (append) {
        setNotifications((prev) => [...prev, ...data]);
      } else {
        setNotifications(data);
      }
      setHasMore(data.length === pageSize);
      setPage(pageNum);
    } catch (err) {
      console.error('[Notifications] Erreur fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Récupérer le compteur non-lu
  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('[Notifications] Erreur unread count:', err);
    }
  }, []);

  // Connexion SignalR et chargement initial
  useEffect(() => {
    if (!user || initialFetchDone.current) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    initialFetchDone.current = true;

    const init = async () => {
      await fetchNotifications(1);
      await fetchUnreadCount();

      try {
        await connect(user.id, token);
      } catch (err) {
        console.error('[Notifications] Erreur connexion SignalR:', err);
      }
    };

    init();

    // Écouter les notifications temps réel
    const unsubscribe = onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Afficher un toast
      toast.info(
        <div>
          <strong>{notification.title}</strong>
          <br />
          <small>{notification.message}</small>
        </div>,
        {
          toastId: notification.id,
          autoClose: 5000,
        }
      );
    });

    return () => {
      unsubscribe();
    };
  }, [user, fetchNotifications, fetchUnreadCount]);

  // Nettoyage SignalR à la déconnexion
  useEffect(() => {
    if (!user) {
      disconnect();
      initialFetchDone.current = false;
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // Marquer une notification comme lue
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await apiMarkAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Erreur markAsRead:', err);
    }
  }, []);

  // Tout marquer comme lu
  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Erreur markAllAsRead:', err);
    }
  }, []);

  // Charger plus (pagination)
  const fetchMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, true);
    }
  }, [loading, hasMore, page, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    hasMore,
    markAsRead,
    markAllAsRead,
    fetchMore,
    refresh: () => {
      fetchNotifications(1);
      fetchUnreadCount();
    },
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
