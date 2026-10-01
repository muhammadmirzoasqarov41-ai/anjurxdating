import create from "zustand";
import { listenUserMatches, markMatchAsRead } from "../lib/firestore";

export const useChatStore = create((set, get) => ({
  matches: [],
  unreadMatchIds: new Set(),
  totalUnreadCount: 0,
  hasUnread: false,
  loading: true,
  unsub: null,

  // Start real-time subscription for current user's matches & unread messages
  startListening: (uid) => {
    if (!uid) return;

    // If already listening, do not duplicate
    const currentUnsub = get().unsub;
    if (currentUnsub) {
      currentUnsub();
    }

    set({ loading: true });

    const unsub = listenUserMatches(uid, (matchesList) => {
      const unreadSet = new Set();

      matchesList.forEach((m) => {
        const isFromOther = m.lastSenderUid && m.lastSenderUid !== uid;
        const unreadList = Array.isArray(m.unreadBy) ? m.unreadBy : [];
        if (isFromOther && unreadList.includes(uid)) {
          unreadSet.add(m.id);
        }
      });

      const count = unreadSet.size;

      set({
        matches: matchesList,
        unreadMatchIds: unreadSet,
        totalUnreadCount: count,
        hasUnread: count > 0,
        loading: false,
      });
    });

    set({ unsub });
  },

  // Stop listening on logout
  stopListening: () => {
    const { unsub } = get();
    if (unsub) {
      unsub();
      set({ unsub: null, matches: [], unreadMatchIds: new Set(), totalUnreadCount: 0, hasUnread: false });
    }
  },

  // Mark match as read
  markAsRead: async (matchId, uid) => {
    if (!matchId || !uid) return;

    const { unreadMatchIds, matches } = get();
    if (unreadMatchIds.has(matchId)) {
      const newUnread = new Set(unreadMatchIds);
      newUnread.delete(matchId);
      set({
        unreadMatchIds: newUnread,
        totalUnreadCount: newUnread.size,
        hasUnread: newUnread.size > 0,
        matches: matches.map((m) =>
          m.id === matchId
            ? { ...m, unreadBy: (m.unreadBy || []).filter((u) => u !== uid) }
            : m
        ),
      });
    }

    await markMatchAsRead(matchId, uid);
  },
}));
