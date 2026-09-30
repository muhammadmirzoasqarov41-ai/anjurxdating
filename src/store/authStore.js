import create from "zustand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { getProfile } from "../lib/firestore";

// paso los codigos crudos de firebase a mensajes que una persona entienda
function friendlyError(code, message) {
  const map = {
    "auth/invalid-email": "Elektron pochta manzili noto'g'ri.",
    "auth/user-not-found": "Bunday elektron pochtaga ega hisob topilmadi.",
    "auth/wrong-password": "Parol noto'g'ri.",
    "auth/invalid-credential": "Elektron pochta yoki parol noto'g'ri.",
    "auth/email-already-in-use": "Ushbu elektron pochta allaqachon ro'yxatdan o'tgan.",
    "auth/weak-password": "Parol kamida 6 ta belgidan iborat bo'lishi kerak.",
    "auth/popup-closed-by-user": "Oyna yakunlanishidan oldin yopildi.",
    "auth/popup-blocked": "Brauzer avtorizatsiya oynasini (popup) blokladi. Saytni yangi tabda oching yoki popupga ruxsat bering.",
    "auth/unauthorized-domain": "Ushbu domen Firebase Authorized Domains ro'yxatiga qo'shilmagan.",
    "auth/operation-not-allowed": "Firebase konsolida ushbu kirish usuli faollashtirilmagan.",
    "auth/network-request-failed": "Tarmoq xatosi yoki internet ulanishi uzildi.",
    "auth/too-many-requests": "Juda ko'p urinish bo'ldi. Birozdan so'ng qayta urinib ko'ring.",
    "auth/cancelled-popup-request": "Oldingi autentifikatsiya oynasi bekor qilindi.",
  };
  if (code && map[code]) return map[code];
  if (code) return `[${code}] ${message || "Xatolik yuz berdi, qaytadan urinib ko'ring."}`;
  return "Nimadir noto'g'ri ketdi, qaytadan urinib ko'ring.";
}

export const useAuthStore = create((set, get) => ({
  user: null, // usuario de firebase auth
  profile: null, // documento de tinder_profiles
  initializing: true,
  error: null,
  busy: false,

  init: () => {
    // si venimos de un login por redirect, recogemos el resultado. esto cubre
    // los navegadores que bloquean el popup (movil sobre todo).
    getRedirectResult(auth).catch((err) => {
      console.warn("Firebase getRedirectResult info/error:", err);
      if (err?.code && err.code !== "auth/null-user") {
        set({ error: friendlyError(err.code, err.message) });
      }
    });

    onAuthStateChanged(auth, async (user) => {
      let profile = null;
      if (user) {
        try {
          profile = await getProfile(user.uid);
        } catch (err) {
          console.error("No se pudo cargar el perfil", err);
        }
      }
      // al resolver la sesion ya no hay nada cargando
      set({ user, profile, initializing: false, busy: false });
    });
  },

  // se llama tras crear/editar el perfil para refrescar el estado
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return;
    const profile = await getProfile(user.uid);
    set({ profile });
  },

  loginEmail: async (email, password) => {
    set({ busy: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      set({ busy: false });
    } catch (err) {
      console.error("Firebase loginEmail error:", err);
      set({ busy: false, error: friendlyError(err.code, err.message) });
      throw err;
    }
  },

  registerEmail: async (name, email, password) => {
    set({ busy: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) await updateProfile(cred.user, { displayName: name });
      set({ busy: false });
    } catch (err) {
      console.error("Firebase registerEmail error:", err);
      set({ busy: false, error: friendlyError(err.code, err.message) });
      throw err;
    }
  },

  loginGoogle: async () => {
    set({ busy: true, error: null });
    try {
      await signInWithPopup(auth, googleProvider);
      // no apago busy aqui: onAuthStateChanged actualiza el user y la pantalla
      // de login redirige sola. asi no se ve un parpadeo del formulario.
    } catch (err) {
      console.error("Firebase loginGoogle error:", err);
      // si el navegador bloquea el popup, caemos a redirect (no falla en seco)
      if (
        err?.code === "auth/popup-blocked" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.code === "auth/operation-not-supported-in-environment"
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirErr) {
          console.error("Firebase signInWithRedirect error:", redirErr);
          set({ busy: false, error: friendlyError(redirErr.code, redirErr.message) });
          throw redirErr;
        }
      }
      set({ busy: false, error: friendlyError(err.code, err.message) });
      throw err;
    }
  },

  logout: async () => {
    await signOut(auth);
    set({ profile: null });
  },

  clearError: () => set({ error: null }),
}));
