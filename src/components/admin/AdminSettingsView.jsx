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
  AlertTriangle,
  FileText,
  Clock,
  RefreshCw,
  Info,
  Sliders,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import { getAdminAuditLogs } from "../../lib/admin";

export default function AdminSettingsView() {
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
      {/* 1. Header */}
      <div className="rounded-2xl bg-white shadow-card p-4 border border-gray-100/60 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-flame-start" /> Tizim Sozlamalari va Xavfsizlik
          </h2>
          <p className="text-xs text-gray-400">
            AnjurXdating Super Admin boshqaruv konfiguratsiyasi
          </p>
        </div>

        <button
          onClick={loadLogs}
          disabled={logsLoading}
          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={logsLoading ? "animate-spin" : ""} />
          <span>Auditni yangilash</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* A) SUPER ADMIN PROFILI */}
        <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-flame-start flex items-center justify-center">
              <User size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Super Admin Profili
              </h3>
              <p className="text-xs text-gray-400">Boshqaruvchi hisobi ma'lumotlari</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Elektron pochta:</span>
              <span className="font-bold text-gray-900 font-mono">
                luxaidevs@gmail.com
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Roli & Huquqlari:</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-flame-start font-bold text-[11px]">
                Super Admin (Cheklovsiz)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Autentifikatsiya holati:</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <CheckCircle2 size={13} /> Tasdiqlangan
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Admin Panelga kirish:</span>
              <span className="text-gray-700 font-medium">
                AdminRoute + Firestore Security Rules
              </span>
            </div>
          </div>
        </div>

        {/* B) ILOVA VA TIZIM STATUSI */}
        <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Server size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Ilova va Tizim Konfiguratsiyasi
              </h3>
              <p className="text-xs text-gray-400">Server va arxitektura ko'rsatkichlari</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Ilova nomi:</span>
              <span className="font-bold text-gray-900">AnjurXdating</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Muhit (Environment):</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                Production / Live
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Ma'lumotlar bazasi:</span>
              <span className="font-medium text-gray-800">
                Google Firebase Firestore
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
              <span className="text-gray-500">Xavfsiz rejim:</span>
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <ShieldCheck size={13} /> Faol (Destructive harakatlar himoyalangan)
              </span>
            </div>
          </div>
        </div>

        {/* C) XAVFSIZLIK VA RUHSATLAR */}
        <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Xavfsizlik & Kirish Qoidalari
              </h3>
              <p className="text-xs text-gray-400">Security Rules va himoya darajalari</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-gray-700">
            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">
                  Firestore Security Rules faol
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Barcha maxfiy admin kolleksiyalari (`reports`, `admin_logs`) faqat `luxaidevs@gmail.com` uchun ochiq.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5">
              <Lock size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">
                  Case-Insensitive Email Verification
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Regex orqali kichik va katta harflardagi loginlar xavfsiz filtrlanadi.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2.5">
              <Activity size={16} className="text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-gray-900">
                  Avtomatik Audit Qaydnomasi
                </p>
                <p className="text-[11px] text-gray-600 mt-0.5">
                  Har bir admin harakati (prevyu ochish, status o'zgartirish) xavfsizlik jurnaliga yoziladi.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* D) MODERATSIYA PARAMETRLARI */}
        <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Moderatsiya Arxitekturasi
              </h3>
              <p className="text-xs text-gray-400">Ish oqimlari va kategoriyalar</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block">
              Shikoyat kategoriyalari:
            </span>
            <div className="flex flex-wrap gap-1.5">
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
                  className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-mono font-medium text-[11px]"
                >
                  {c}
                </span>
              ))}
            </div>

            <span className="font-bold text-gray-500 uppercase tracking-wider text-[10px] block pt-2">
              Holat zanjiri (Status flow):
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-700 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                pending
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                reviewing
              </span>
              <span>→</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                resolved
              </span>
              <span>/</span>
              <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                dismissed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. RECENT AUDIT LOGS (REAL FIRESTORE DATA) */}
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
  );
}
