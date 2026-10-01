import create from "zustand";
import { getDeck, recordSwipe } from "../lib/firestore";

// maneja la pila de cartas del discover. el indice avanza a medida que swipeas.
export const useDeckStore = create((set, get) => ({
  cards: [],
  index: 0,
  loading: true,
  error: null,
  lastMatch: null, // perfil con el que acabas de hacer match (para el modal)
  filters: {},

  load: async (uid, myProfile = {}, filters = {}) => {
    set({ loading: true, error: null, filters });
    try {
      const cards = await getDeck(uid, myProfile, filters);
      set({ cards, index: 0, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false, error: "Boshqa odamlarni yuklab bo'lmadi." });
    }
  },

  // dir: "like" | "nope" | "superlike". me es el perfil propio (lo necesito para el match).
  swipe: async (me, dir, targetCard = null) => {
    const { cards, index } = get();
    const card = targetCard || cards[index];
    if (!card) return;

    // if swiping the current top card, advance index
    if (!targetCard || card.uid === cards[index]?.uid) {
      set({ index: index + 1 });
    } else {
      // if swiped from detail modal for a specific card
      set({
        cards: cards.filter((c) => c.uid !== card.uid),
      });
    }

    try {
      const isSuper = dir === "superlike";
      const isLiked = dir === "like" || isSuper;
      const matched = await recordSwipe(me, card, isLiked, isSuper);
      if (matched) set({ lastMatch: matched });
    } catch (err) {
      console.error("No se pudo registrar el swipe", err);
    }
  },

  clearMatch: () => set({ lastMatch: null }),
  reset: () => set({ cards: [], index: 0, loading: true, lastMatch: null }),
}));
