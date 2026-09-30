import create from "zustand";
import { getDeck, recordSwipe } from "../lib/firestore";

// maneja la pila de cartas del discover. el indice avanza a medida que swipeas.
export const useDeckStore = create((set, get) => ({
  cards: [],
  index: 0,
  loading: true,
  error: null,
  lastMatch: null, // perfil con el que acabas de hacer match (para el modal)

  load: async (uid) => {
    set({ loading: true, error: null });
    try {
      const cards = await getDeck(uid);
      set({ cards, index: 0, loading: false });
    } catch (err) {
      console.error(err);
      set({ loading: false, error: "Boshqa odamlarni yuklab bo'lmadi." });
    }
  },

  // dir: "like" | "nope". me es el perfil propio (lo necesito para el match).
  swipe: async (me, dir) => {
    const { cards, index } = get();
    const card = cards[index];
    if (!card) return;

    // avanzo de inmediato para que la UI no se sienta trabada
    set({ index: index + 1 });

    try {
      const matched = await recordSwipe(me, card, dir === "like");
      if (matched) set({ lastMatch: matched });
    } catch (err) {
      console.error("No se pudo registrar el swipe", err);
    }
  },

  clearMatch: () => set({ lastMatch: null }),
  reset: () => set({ cards: [], index: 0, loading: true, lastMatch: null }),
}));
