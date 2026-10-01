import { create } from "zustand";
import {
  listenNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../lib/firestore";

export const useNotificationStore = create((set, get) => {
  let unsubscribe = null;
  let activeUid = null;

  return {
    notifications: [],
    unreadCount: 0,
    loading: false,

    startListening: (uid) => {
      if (!uid) return;
      if (activeUid === uid && unsubscribe) return;

      if (unsubscribe) {
        unsubscribe();
      }

      activeUid = uid;
      set({ loading: true });

      unsubscribe = listenNotifications(uid, (items) => {
        const unreadCount = items.filter((n) => !n.read).length;
        set({
          notifications: items,
          unreadCount,
          loading: false,
        });
      });
    },

    stopListening: () => {
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
      activeUid = null;
      set({ notifications: [], unreadCount: 0, loading: false });
    },

    markAsRead: async (uid, notifId) => {
      if (!uid || !notifId) return;
      // Optimistic update
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === notifId ? { ...n, read: true } : n
        );
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
      await markNotificationAsRead(uid, notifId);
    },

    markAllAsRead: async (uid) => {
      if (!uid) return;
      const { notifications } = get();
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (!unreadIds.length) return;

      // Optimistic update
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));

      await markAllNotificationsAsRead(uid, unreadIds);
    },

    removeNotification: async (uid, notifId) => {
      if (!uid || !notifId) return;
      set((state) => {
        const updated = state.notifications.filter((n) => n.id !== notifId);
        return {
          notifications: updated,
          unreadCount: updated.filter((n) => !n.read).length,
        };
      });
      await deleteNotification(uid, notifId);
    },
  };
});
