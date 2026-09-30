import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Heart,
  UserCheck,
  Flag,
  MessageCircle,
  Calendar,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { getAdminComprehensiveStats } from "../../lib/admin";

const REASON_LABELS = {
  fake_profile: "Soxta profil",
  harassment: "Tazyiq / Haqorat",
  spam: "Spam / Reklama",
  inappropriate_content: "Nomaqbul kontent",
  scam: "Firibgarlik",
  other: "Boshqa",
};

export default function AdminStatisticsView() {
  const [timeRange, setTimeRange] = useState("30");
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async (range) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminComprehensiveStats(range);
      setStatsData(data);
    } catch (err) {
      console.error("Statistikani yuklashda xatolik:", err);
      setError("Statistik ma'lumotlarni yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats(timeRange);
  }, [timeRange]);

  const maxDailyValue = useMemo(() => {
    if (!statsData?.dailyDistribution?.length) return 1;
    return Math.max(
      ...statsData.dailyDistribution.map((d) => Math.max(d.users, d.matches, d.reports, 1))
    );
  }, [statsData]);

  return (
    <div className="space-y-4">
      {/* 1. Yuqori Filtr va Boshqaruv */}
      <div className="rounded-2xl bg-white shadow-card p-4 border border-gray-100/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 size={18} className="text-flame-start" /> Platforma Statistikasi va Tahlil
          </h2>
          <p className="text-xs text-gray-400">
            Real vaqtdagi Firebase Firestore ma'lumotlari asosida
          </p>
        </div>

        {/* Vaqt Oralig'i Tanlovi */}
        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: "1", label: "Bugun" },
            { id: "7", label: "7 kun" },
            { id: "30", label: "30 kun" },
            { id: "90", label: "90 kun" },
            { id: "all", label: "Barchasi" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeRange(t.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === t.id
                  ? "bg-white text-flame-start shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            onClick={() => loadStats(timeRange)}
            className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors ml-1"
            title="Yangilash"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Xatolik xabari */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadStats(timeRange)}
            className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {loading || !statsData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white shadow-card animate-pulse p-4" />
          ))}
        </div>
      ) : (
        <>
          {/* 2. ASOSIY METRIKALAR KARTALARI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Foydalanuvchilar */}
            <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                  Foydalanuvchilar
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {statsData.users.total}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <span className="text-emerald-600 font-bold">
                    +{statsData.users.newInRange}
                  </span>{" "}
                  <span>davr ichida</span>
                </div>
              </div>
            </div>

            {/* Profillar */}
            <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Anketalar
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={16} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {statsData.profiles.total}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <span className="text-emerald-600 font-bold">
                    {statsData.profiles.total > 0
                      ? Math.round(
                          (statsData.profiles.complete / statsData.profiles.total) * 100
                        )
                      : 0}
                    %
                  </span>{" "}
                  <span>to'liq to'ldirilgan</span>
                </div>
              </div>
            </div>

            {/* Mosliklar */}
            <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  Matchlar
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart size={16} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {statsData.matches.total}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <span className="text-rose-600 font-bold">
                    +{statsData.matches.newInRange}
                  </span>{" "}
                  <span>yangi mosliklar</span>
                </div>
              </div>
            </div>

            {/* Suhbatlar nisbati */}
            <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">
                  Chat Aloqasi
                </span>
                <div className="w-8 h-8 rounded-xl bg-orange-50 text-flame-start flex items-center justify-center">
                  <MessageCircle size={16} />
                </div>
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">
                  {statsData.matches.withChat}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-1">
                  <span className="text-flame-start font-bold">
                    {statsData.matches.total > 0
                      ? Math.round(
                          (statsData.matches.withChat / statsData.matches.total) * 100
                        )
                      : 0}
                    %
                  </span>{" "}
                  <span>suhbat boshlangan</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. KUNLIK FAOLLIK GRAFIGI (CHART) */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-flame-start" /> Kunlik Faollik Dinamikasi
                </h3>
                <p className="text-xs text-gray-400">
                  Yangi foydalanuvchilar va mosliklar taqsimoti
                </p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-blue-500" />
                  <span className="text-gray-600">Users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-rose-500" />
                  <span className="text-gray-600">Matches</span>
                </div>
              </div>
            </div>

            {statsData.dailyDistribution.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Ushbu davr uchun ma'lumotlar mavjud emas
              </div>
            ) : (
              <div className="pt-4 flex items-end justify-between gap-2 h-44 border-b border-gray-100">
                {statsData.dailyDistribution.map((d, idx) => {
                  const userHeightPercent = Math.max(
                    8,
                    Math.round((d.users / maxDailyValue) * 100)
                  );
                  const matchHeightPercent = Math.max(
                    8,
                    Math.round((d.matches / maxDailyValue) * 100)
                  );

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] p-1.5 rounded-lg whitespace-nowrap z-20 pointer-events-none shadow-md">
                        {d.dateLabel}: {d.users} foydalanuvchi, {d.matches} match
                      </div>

                      {/* Bar columns */}
                      <div className="w-full flex items-end justify-center gap-0.5 h-full">
                        <div
                          style={{ height: `${userHeightPercent}%` }}
                          className="w-1.5 sm:w-3 bg-blue-500/80 hover:bg-blue-600 rounded-t-sm transition-all"
                        />
                        <div
                          style={{ height: `${matchHeightPercent}%` }}
                          className="w-1.5 sm:w-3 bg-rose-500/80 hover:bg-rose-600 rounded-t-sm transition-all"
                        />
                      </div>

                      {/* Date label */}
                      <span className="text-[10px] text-gray-400 mt-2 truncate w-full text-center">
                        {d.dateLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. TAQSIMOTLAR VA SHIKOYATLAR TAHLILI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shikoyat Sabablari Taqsimoti */}
            <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Flag size={16} className="text-rose-500" /> Shikoyat Sabablari Taqsimoti
              </h3>
              <p className="text-xs text-gray-400">
                Kelib tushgan shikoyatlarning asosiy kategoriyalari
              </p>

              <div className="space-y-2.5 pt-2">
                {Object.entries(statsData.reports.byReason).map(([key, count]) => {
                  const percent =
                    statsData.reports.total > 0
                      ? Math.round((count / statsData.reports.total) * 100)
                      : 0;

                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 font-medium">
                          {REASON_LABELS[key] || key}
                        </span>
                        <span className="font-bold text-gray-900">
                          {count} ta ({percent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className="h-full rounded-full flame-bg transition-all"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profil va Hisob Holati Taqsimoti */}
            <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60 space-y-3">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> Hisob va Profil Strukturasi
              </h3>
              <p className="text-xs text-gray-400">
                Platformadagi foydalanuvchilar holati tahlili
              </p>

              <div className="space-y-3 pt-2 text-xs">
                {/* To'liq vs Chala anketalar */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">To'liq anketalar</p>
                    <p className="text-[11px] text-gray-400">Rasm, ism va yoshi to'liq</p>
                  </div>
                  <span className="text-sm font-black text-emerald-600">
                    {statsData.profiles.complete} ta
                  </span>
                </div>

                {/* Haqiqiy vs Bot */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">Bot profillari</p>
                    <p className="text-[11px] text-gray-400">Tizim simulyatorlari</p>
                  </div>
                  <span className="text-sm font-black text-purple-600">
                    {statsData.profiles.bots} ta
                  </span>
                </div>

                {/* Faol hisoblar */}
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">Faol hisoblar nisbati</p>
                    <p className="text-[11px] text-gray-400">Bloklanmagan real foydalanuvchilar</p>
                  </div>
                  <span className="text-sm font-black text-blue-600">
                    {statsData.users.active} ta
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
