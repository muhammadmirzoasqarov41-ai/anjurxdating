import create from "zustand";
import {
  addFavorite,
  removeFavorite,
  getFavorites,
} from "../lib/firestore";

export const useFavoritesStore = create((set, get) => ({
  favorites: [],
  favoriteIds: new Set(),
  loading: false,
  error: null,

  loadFavorites: async (uid) => {
    if (!uid) return;
    set({ loading: true, error: null });
    try {
      const items = await getFavorites(uid);
      const ids = new Set(items.map((item) => item.uid));
      set({ favorites: items, favoriteIds: ids, loading: false });
    } catch (err) {
      console.error("Favorites load error:", err);
      set({ loading: false, error: "Saqlanganlarni yuklab bo'lmadi" });
    }
  },

  toggleFavorite: async (uid, profile) => {
    if (!uid || !profile) return false;
    const { favorites, favoriteIds } = get();
    const targetUid = profile.uid || profile.id;
    const exists = favoriteIds.has(targetUid);

    if (exists) {
      // Optimistic remove
      const updatedFavorites = favorites.filter((f) => f.uid !== targetUid);
      const updatedIds = new Set(favoriteIds);
      updatedIds.delete(targetUid);
      set({ favorites: updatedFavorites, favoriteIds: updatedIds });

      try {
        await removeFavorite(uid, targetUid);
        return false;
      } catch (err) {
        console.error("removeFavorite error:", err);
        // revert on error
        set({ favorites, favoriteIds });
        return true;
      }
    } else {
      // Optimistic add
      const favItem = {
        uid: targetUid,
        targetUid,
        displayName: profile.displayName || "Foydalanuvchi",
        photo: profile.photos?.[0] || profile.photo || null,
        photos: profile.photos || [],
        age: profile.age || null,
        city: profile.city || "",
        job: profile.job || "",
        bio: profile.bio || "",
        datingIntention: profile.datingIntention || "",
        interests: profile.interests || [],
        languages: profile.languages || [],
        verified: Boolean(profile.verified || profile.isVerified),
        createdAt: new Date(),
      };

      const updatedFavorites = [favItem, ...favorites];
      const updatedIds = new Set(favoriteIds);
      updatedIds.add(targetUid);
      set({ favorites: updatedFavorites, favoriteIds: updatedIds });

      try {
        await addFavorite(uid, profile);
        return true;
      } catch (err) {
        console.error("addFavorite error:", err);
        // revert on error
        set({ favorites, favoriteIds });
        return false;
      }
    }
  },

  remove: async (uid, targetUid) => {
    if (!uid || !targetUid) return;
    const { favorites, favoriteIds } = get();
    const updatedFavorites = favorites.filter((f) => f.uid !== targetUid);
    const updatedIds = new Set(favoriteIds);
    updatedIds.delete(targetUid);
    set({ favorites: updatedFavorites, favoriteIds: updatedIds });

    try {
      await removeFavorite(uid, targetUid);
    } catch (err) {
      console.error("remove error:", err);
      set({ favorites, favoriteIds });
    }
  },
}));
