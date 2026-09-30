import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import GoogleIcon from "../components/GoogleIcon";

export default function Login() {
  const [mode, setMode] = useState("login"); // login | register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const {
    user,
    profile,
    initializing,
    loginEmail,
    registerEmail,
    loginGoogle,
    error,
    busy,
    clearError,
  } = useAuthStore();

  // si ya hay sesion, no tiene sentido quedarse en el login: redirige segun si
  // el perfil ya esta creado o no. esto evita el "se queda cargado".
  if (!initializing && user) {
    return <Navigate to={profile ? "/" : "/onboarding"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (mode === "login") await loginEmail(email, password);
      else await registerEmail(name, email, password);
    } catch (_) {
      // el error se muestra desde el store
    }
  }

  function switchMode() {
    clearError();
    setMode(mode === "login" ? "register" : "login");
  }

  return (
    <div className="min-h-screen flame-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2 mb-8 text-white">
          <Flame size={34} fill="currentColor" />
          <span className="font-extrabold text-3xl">AnjurXdating</span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {mode === "login" ? "Xush kelibsiz" : "Hisob yarating"}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            {mode === "login"
              ? "Surishda davom etish uchun tizimga kiring"
              : "Ro'yxatdan o'ting va yangi insonlar bilan tanishing"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <input
                type="text"
                placeholder="Ismingiz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-flame-start"
              />
            )}
            <input
              type="email"
              placeholder="Elektron pochta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-flame-start"
            />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 outline-none focus:border-flame-start"
            />

            {error && <p className="text-nope text-sm">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-full flame-bg text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy
                ? "Yuklanmoqda..."
                : mode === "login"
                ? "Kirish"
                : "Ro'yxatdan o'tish"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">yoki</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={() => loginGoogle().catch(() => {})}
            disabled={busy}
            className="w-full py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <GoogleIcon size={18} /> Google orqali davom etish
          </button>

          <p className="text-sm text-center text-gray-500 mt-6">
            {mode === "login" ? "Hisobingiz yo'qmi?" : "Hisobingiz bormi?"}{" "}
            <button
              onClick={switchMode}
              className="text-flame-start font-semibold hover:underline"
            >
              {mode === "login" ? "Ro'yxatdan o'ting" : "Tizimga kiring"}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-white/80 mt-5 leading-relaxed px-2">
          Bu dasturlashni mashq qilish uchun yaratilgan shaxsiy loyiha. U Tinder
          yoki Match Group bilan aloqador emas, bog'liq emas va ular tomonidan
          qo'llab-quvvatlanmaydi.
        </p>
      </motion.div>
    </div>
  );
}
