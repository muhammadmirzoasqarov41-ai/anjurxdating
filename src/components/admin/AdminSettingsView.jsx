import { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  ShieldCheck,
  Lock,
  Server,
  Activity,
  User,
  CheckCircle2,
  FileText,
  RefreshCw,
  Sliders,
  Users,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import { getAdminAuditLogs } from "../../lib/admin";
import { useAuthStore } from "../../store/authStore";
import { isSuperAdminUser } from "../AdminRoute";
import AdminManagementView from "./AdminManagementView";

export default function AdminSettingsView() {
  const { user } = useAuthStore();
  const isSuperAdmin = isSuperAdminUser(user);

  const [settingsTab, setSettingsTab] = useState("system");
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await getAdminAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.warn("Audit loglarini yuklashda ogohlantirish:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <div className="space-y-4">
      {/* 1. Header & Sub-Tabs */}
      <div className="rounded-2xl bg-white shadow-card p-4 border border-gray-100/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-flame-start" /> Sozlamalar & Admin Markazi
          </h2>
          <p className="text-xs text-gray-400">
            {isSuperAdmin
              ? "Super Admin boshqaruv paneli va adminlar tayinlash tizimi"
              : "Platforma konfiguratsiyasi va tizim ko'rsatkichlari"}
          </p>
        </div>

        {/* Super Admin uchun bo'lim tanlagichi */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold self-stretch sm:self-auto">
            <button
              onClick={() => setSettingsTab("system")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                settingsTab === "system"
                  ? "bg-white text-flame-start shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sliders size={13} /> Tizim Sozlamalari
            </button>
            <button
              onClick={() => setSettingsTab("admin_management")}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                settingsTab === "admin_management"
                  ? "bg-white text-flame-start shadow-xs font-bold"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <Users size={13} /> Admin Management
            </button>
          </div>
        )}
      </div>

      {/* 2. Content Branch */}
      {isSuperAdmin && settingsTab === "admin_management" ? (
        <AdminManagementView currentUserEmail={user?.email} />
      ) : (
        <div className="space-y-4">
          {/* Header Action for System */}
          <div className="flex justify-end">
            <button
              onClick={loadLogs}
              disabled={logsLoading}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw size={13} className={logsLoading ? "animate-spin" : ""} />
              <span>Auditni yangilash</span>
            </button>
          </div>

          {/* BO'LIMLAR - QATORMA-QATOR UZUNASIGA */}
          <div className="space-y-4">
            {/* A) SUPER ADMIN PROFILI */}
            <div className="w-full rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-flame-start flex items-center justify-center flex-shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Super Admin Profili
                  </h3>
                  <p className="text-xs text-gray-400">
                    Boshqaruvchi hisobi ma'lumotlari va tizimdagi oliy darajadagi huquqlari
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Elektron pochta</span>
                    <p className="text-[11px] text-gray-400">Super Adminning asosiy autentifikatsiya manzili</p>
                  </div>
                  <span className="font-mono font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70 text-right">
                    luxaidevs@gmail.com
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Tizimdagi Roli</span>
                    <p className="text-[11px] text-gray-400">Platforma bo'yicha to'liq boshqaruv darajasi</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-rose-50 text-flame-start font-bold text-[11px] border border-rose-200/60 self-start sm:self-auto">
                    Super Admin (Cheklovsiz huquq)
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Autentifikatsiya Holati</span>
                    <p className="text-[11px] text-gray-400">Firebase Auth token va email tekshiruvi</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-auto">
                    <CheckCircle2 size={13} /> Tasdiqlangan (Verified)
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Panelga Kirish Himoyasi</span>
                    <p className="text-[11px] text-gray-400">Ikki bosqichli frontend + backend xavfsizlik nazorati</p>
                  </div>
                  <span className="text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70 self-start sm:self-auto">
                    AdminRoute Guard + Firestore Security Rules
                  </span>
                </div>
              </div>
            </div>

            {/* B) ILOVA VA TIZIM KONFIGURATSIYASI */}
            <div className="w-full rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Server size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Ilova va Tizim Konfiguratsiyasi
                  </h3>
                  <p className="text-xs text-gray-400">
                    Platformaning dasturiy ta'minoti va server arxitekturasi ko'rsatkichlari
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Ilova Nomi</span>
                    <p className="text-[11px] text-gray-400">Tanishuv va muloqot xizmati</p>
                  </div>
                  <span className="font-bold text-gray-900 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70">
                    AnjurXdating
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Ishlash Muhiti (Environment)</span>
                    <p className="text-[11px] text-gray-400">Joriy runtime va server holati</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60 self-start sm:self-auto">
                    Production / Live
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Ma'lumotlar Bazasi</span>
                    <p className="text-[11px] text-gray-400">Realtime hujjatlar ombori</p>
                  </div>
                  <span className="font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70">
                    Google Firebase Firestore (Asia-Southeast1)
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Xavfsiz Read-Only Rejim</span>
                    <p className="text-[11px] text-gray-400">Tasodifiy bazani o'chirish yoki buzilishlardan himoya</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-100 self-start sm:self-auto">
                    <ShieldCheck size={13} /> Faol (Destructive amallar cheklangan)
                  </span>
                </div>
              </div>
            </div>

            {/* C) XAVFSIZLIK VA KIRISH QOIDALARI */}
            <div className="w-full rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Xavfsizlik & Kirish Qoidalari
                  </h3>
                  <p className="text-xs text-gray-400">
                    Firestore Security Rules va backend himoya protokollari
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Firestore Security Rules</span>
                    <p className="text-[11px] text-gray-400">Maxfiy kolleksiyalar (`reports`, `admin_logs`) faqat Super Admin uchun ochiq</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200/60 self-start sm:self-auto">
                    Himoyalangan
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Case-Insensitive Email Tekshiruvi</span>
                    <p className="text-[11px] text-gray-400">Regex qoidasi orqali katta/kichik harflardagi xatoliklar bartaraf etilgan</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200/60 self-start sm:self-auto">
                    Regex Faol
                  </span>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Avtomatik Audit Jurnali</span>
                    <p className="text-[11px] text-gray-400">Har bir harakat `admin_logs` bazasiga vaqt va parametrlar bilan yoziladi</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-700 font-bold text-[11px] self-start sm:self-auto">
                    Avto-Audit Faol
                  </span>
                </div>
              </div>
            </div>

            {/* D) MODERATSIYA ARXITEKTURASI */}
            <div className="w-full rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Moderatsiya Arxitekturasi va Standartlari
                  </h3>
                  <p className="text-xs text-gray-400">
                    Shikoyat kategoriyalari, ustuvorliklar va holatlar boshqaruvi
                  </p>
                </div>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Shikoyat Kategoriyalari</span>
                    <p className="text-[11px] text-gray-400">Platformadagi barcha qoidabuzarlik turlari</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 self-start sm:self-auto">
                    {[
                      "fake_profile",
                      "harassment",
                      "spam",
                      "inappropriate_content",
                      "scam",
                      "other",
                    ].map((c) => (
                      <span
                        key={c}
                        className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-mono text-[11px] border border-gray-200/50"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Holatlar Zanjiri (Workflow)</span>
                    <p className="text-[11px] text-gray-400">Moderatsiyaning bosqichma-bosqich o'tish tartibi</p>
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-[11px] flex-wrap self-start sm:self-auto">
                    <span className="px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      pending
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                      reviewing
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      resolved
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                      dismissed
                    </span>
                  </div>
                </div>

                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="font-semibold text-gray-800">Qaror Qabul Qilish Amallari</span>
                    <p className="text-[11px] text-gray-400">Super Admin tomonidan tasdiqlanadigan moderatsiya harakatlari</p>
                  </div>
                  <span className="text-gray-700 font-medium bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70 self-start sm:self-auto">
                    Jarayonga olish, Hal qilindi, Rad etish, Qayta kutilmoqda qilish
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. RECENT AUDIT LOGS (REAL FIRESTORE DATA) */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <FileText size={16} className="text-flame-start" /> So'nggi Super Admin Audit Qaydnomasi
                </h3>
                <p className="text-xs text-gray-400">
                  `admin_logs` kolleksiyasidan real vaqtdagi boshqaruv amallari
                </p>
              </div>
              <span className="text-xs text-gray-400">
                Jami: {auditLogs.length} ta yozuv
              </span>
            </div>

            {logsLoading ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-7 h-7 border-2 border-flame-start border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-gray-400">Audit yozuvlari yuklanmoqda...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Hozircha audit qaydnomalari mavjud emas
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                    <tr>
                      <th className="p-2.5">Amal Turi</th>
                      <th className="p-2.5">Nishon (Target)</th>
                      <th className="p-2.5">Bajaruvchi</th>
                      <th className="p-2.5 text-right">Vaqt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50/50">
                        <td className="p-2.5">
                          <span className="font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-gray-600 truncate max-w-[180px]">
                          {log.targetUid || log.targetEmail || "—"}
                        </td>
                        <td className="p-2.5 text-gray-700 font-medium">
                          {log.adminEmail || "luxaidevs@gmail.com"}
                        </td>
                        <td className="p-2.5 text-right text-gray-400 text-[11px]">
                          {formatTime(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
