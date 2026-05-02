import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const lastFetchedId = useRef(null);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      const response = await axios.get('/notifications');
      const data = response.data.data;
      setNotifications(data);
      setUnreadCount(response.data.unreadCount);

      // Check for new notifications to show toast
      if (data.length > 0 && isSilent) {
        const newest = data[0];
        if (!newest.read && newest._id !== lastFetchedId.current) {
          if (newest.type === 'match_found') {
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-surface-50 dark:bg-surface-100 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-primary-500/20`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        🎉
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-bold text-surface-900 dark:text-white">
                        New Match Found!
                      </p>
                      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                        {newest.message}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-surface-100 dark:border-surface-800">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      window.location.href = '/dashboard?tab=matches';
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-500 focus:outline-none"
                  >
                    View
                  </button>
                </div>
              </div>
            ), { duration: 6000 });
          }
          lastFetchedId.current = newest._id;
        }
      } else if (data.length > 0) {
        lastFetchedId.current = data[0]._id;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(true), 15000); // Poll every 15s
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      lastFetchedId.current = null;
    }
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
