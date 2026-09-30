import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Flag,
  Heart,
  MessageCircle,
  ShieldAlert,
  BarChart3,
  Settings,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Foydalanuvchilar", icon: Users },
  { id: "profiles", label: "Profillar", icon: UserCheck },
  { id: "reports", label: "Shikoyatlar", icon: Flag },
  { id: "matches", label: "Matchlar", icon: Heart },
  { id: "chats", label: "Suhbatlar", icon: MessageCircle },
  { id: "moderation", label: "Moderatsiya", icon: ShieldAlert },
  { id: "statistics", label: "Statistika", icon: BarChart3 },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

export default function Admin() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");

  const currentSection = SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];
  const Icon = currentSection.icon;

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-4">
      {/* Yuqori panel kartasi */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="h-28 flame-bg p-4 flex flex-col justify-between text-white">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              title="Ilovaga qaytish"
            >
              <ArrowLeft size={18} />
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1">
              <ShieldCheck size={14} /> Super Admin
            </span>
          </div>

          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Admin Panel</h1>
            <p className="text-xs text-white/85 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Bo'limlar navigatsiyasi */}
        <div className="p-2 border-b border-gray-100 overflow-x-auto thin-scroll flex items-center gap-1.5">
          {SECTIONS.map((sec) => {
            const TabIcon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all " +
                  (isActive
                    ? "flame-bg text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100")
                }
              >
                <TabIcon size={14} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tanlangan bo'lim arxitekturasi */}
      <div className="rounded-2xl bg-white shadow-card p-6">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-flame-start flex items-center justify-center">
            <Icon size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">{currentSection.label}</h2>
            <p className="text-xs text-gray-400">AnjurXdating boshqaruv tizimi</p>
          </div>
        </div>

        {activeTab === "dashboard" ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Boshqaruv holati</span>
                <p className="text-base font-bold text-emerald-600 mt-1">Faol</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-xs text-gray-500 font-medium">Kirish darajasi</span>
                <p className="text-base font-bold text-gray-800 mt-1">Super Admin</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Tizim arxitekturasi
              </p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>• 9 ta asosiy boshqaruv bo'limi tuzilmasi yaratilgan</li>
                <li>• Faqat luxaidevs@gmail.com uchun ruxsat berilgan</li>
                <li>• Firebase xavfsizlik qoidalari himoyasi o'rnatilgan</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Icon size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">{currentSection.label} bo'limi</h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Ushbu bo'limning arxitekturasi tayyorlangan. Keyingi bosqichlarda kerakli boshqaruv amallari bilan to'ldiriladi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
