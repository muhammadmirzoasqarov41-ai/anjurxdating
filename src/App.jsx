import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useChatStore } from "./store/chatStore";
import { updateUserPresence } from "./lib/firestore";
import ProtectedRoute from "./components/ProtectedRoute";
import TopNav from "./components/TopNav";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Discover from "./pages/Discover";
import Favorites from "./pages/Favorites";
import Matches from "./pages/Matches";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  const { user, init, initializing } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    init();
  }, [init]);

  // App-wide presence and real-time message notifications
  useEffect(() => {
    if (user?.uid) {
      updateUserPresence(user.uid, true);
      useChatStore.getState().startListening(user.uid);

      const onFocus = () => updateUserPresence(user.uid, true);
      const onBlur = () => updateUserPresence(user.uid, false);
      window.addEventListener("focus", onFocus);
      window.addEventListener("blur", onBlur);

      return () => {
        window.removeEventListener("focus", onFocus);
        window.removeEventListener("blur", onBlur);
        updateUserPresence(user.uid, false);
      };
    } else {
      useChatStore.getState().stopListening();
    }
  }, [user?.uid]);

  if (initializing) {
    // pantalla breve mientras firebase resuelve si hay sesion
    return (
      <div className="min-h-screen flame-bg flex items-center justify-center">
        <span className="text-white font-extrabold text-2xl animate-pulse">
          AnjurXdating
        </span>
      </div>
    );
  }

  // la nav superior no va en login, onboarding ni dentro del chat
  const hideNav =
    location.pathname === "/login" ||
    location.pathname === "/onboarding" ||
    location.pathname.startsWith("/chat/");

  return (
    <div className="min-h-screen">
      {!hideNav && <TopNav />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireProfile={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Discover />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute>
              <Matches />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/:matchId"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminRoute>
                <Admin />
              </AdminRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}
