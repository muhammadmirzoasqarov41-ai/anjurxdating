import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Flame, MessageCircle, User, Shield, Star } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { isSuperAdminUser } from "./AdminRoute";

// Top navigation with real-time unread messages notification dot
export default function TopNav() {
  const { user } = useAuthStore();
  const { hasUnread, totalUnreadCount, startListening, stopListening } =
    useChatStore();

  useEffect(() => {
    if (user?.uid) {
      startListening(user.uid);
    } else {
      stopListening();
    }
  }, [user?.uid, startListening, stopListening]);

  const link = ({ isActive }) =>
    "relative flex items-center gap-1.5 px-2.5 py-2 rounded-full text-sm font-semibold transition-colors " +
    (isActive ? "text-flame-start" : "text-gray-400 hover:text-gray-600");

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100">
      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Flame className="text-flame-start" size={26} fill="currentColor" />
          <span className="font-extrabold text-lg flame-text">AnjurXdating</span>
        </div>

        <nav className="flex items-center gap-0.5">
          <NavLink to="/" end className={link} title="Kashf qilish" aria-label="Kashf qilish">
            <Flame size={18} />
          </NavLink>
          <NavLink to="/favorites" className={link} title="Saqlanganlar" aria-label="Saqlanganlar">
            <Star size={18} />
          </NavLink>
          <NavLink to="/matches" className={link} title="Xabarlar" aria-label="Xabarlar">
            <div className="relative flex items-center justify-center">
              <MessageCircle size={18} />
              {hasUnread && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse"
                  title={`${totalUnreadCount} ta o'qilmagan xabar`}
                />
              )}
            </div>
          </NavLink>
          <NavLink to="/profile" className={link} title="Profil" aria-label="Profil">
            <User size={18} />
          </NavLink>
          {isSuperAdminUser(user) && (
            <NavLink to="/admin" className={link} title="Admin Panel" aria-label="Admin Panel">
              <Shield size={18} />
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
