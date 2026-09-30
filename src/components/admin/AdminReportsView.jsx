import { useState, useMemo, useEffect } from "react";
import {
  Flag,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  X,
  User,
  ShieldAlert,
  AlertOctagon,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import { logAdminAuditAction, updateReportStatus } from "../../lib/admin";

const REASON_LABELS = {
  fake_profile: "Soxta profil",
  harassment: "Tazyiq / Haqorat",
  spam: "Spam / Reklama",
  inappropriate_content: "Nomaqbul kontent",
  scam: "Firibgarlik",
  other: "Boshqa",
};

const STATUS_LABELS = {
  pending: "Kutilmoqda",
  reviewing: "Ko'rib chiqilmoqda",
  resolved: "Hal qilindi",
  dismissed: "Rad etildi",
};

const PRIORITY_LABELS = {
  high: "Yuqori",
  medium: "O'rtacha",
  low: "Past",
};

export default function AdminReportsView({
  reports = [],
  stats = { total: 0, pending: 0, reviewing: 0, resolved: 0, dismissed: 0 },
  loading = false,
  error = null,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterReason, setFilterReason] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedReport, setSelectedReport] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Search & Filter & Sort processing
  const filteredReports = useMemo(() => {
    let list = [...reports];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((r) => {
        const idMatch = (r.id || "").toLowerCase().includes(q);
        const reporterNameMatch = (r.reporterName || "")
          .toLowerCase()
          .includes(q);
        const reportedUserNameMatch = (r.reportedUserName || "")
          .toLowerCase()
          .includes(q);
        const reporterIdMatch = (r.reporterId || "").toLowerCase().includes(q);
        const reportedUserIdMatch = (r.reportedUserId || "")
          .toLowerCase()
          .includes(q);
        const reasonKeyMatch = (r.reason || "").toLowerCase().includes(q);
        const reasonLabelMatch = (REASON_LABELS[r.reason] || "")
          .toLowerCase()
          .includes(q);
        const descMatch = (r.description || "").toLowerCase().includes(q);

        return (
          idMatch ||
          reporterNameMatch ||
          reportedUserNameMatch ||
          reporterIdMatch ||
          reportedUserIdMatch ||
          reasonKeyMatch ||
          reasonLabelMatch ||
          descMatch
        );
      });
    }

    // 2. Status Filter
    if (filterStatus !== "all") {
      list = list.filter((r) => (r.status || "pending") === filterStatus);
    }

    // 3. Reason Filter
    if (filterReason !== "all") {
      list = list.filter((r) => (r.reason || "other") === filterReason);
    }

    // 4. Priority Filter
    if (filterPriority !== "all") {
      list = list.filter((r) => (r.priority || "medium") === filterPriority);
    }

    // 5. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        const timeA =
          a.createdAt?.toMillis?.() ||
          (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
          0;
        const timeB =
          b.createdAt?.toMillis?.() ||
          (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
          0;
        return timeB - timeA;
      }
      if (sortBy === "oldest") {
        const timeA =
          a.createdAt?.toMillis?.() ||
          (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
          0;
        const timeB =
          b.createdAt?.toMillis?.() ||
          (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
          0;
        return timeA - timeB;
      }
      if (sortBy === "priority_high") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 2;
        const weightB = priorityWeight[b.priority] || 2;
        return weightB - weightA;
      }
      if (sortBy === "priority_low") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 2;
        const weightB = priorityWeight[b.priority] || 2;
        return weightA - weightB;
      }
      return 0;
    });

    return list;
  }, [
    reports,
    searchQuery,
    filterStatus,
    filterReason,
    filterPriority,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredReports.length / pageSize));
  const currentReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterStatus,
    filterReason,
    filterPriority,
    sortBy,
    pageSize,
  ]);

  // Copy helper
  const handleCopy = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Detail Modal
  const handleOpenDetail = (report) => {
    setSelectedReport(report);
    setActionSuccess(null);

    // Audit log
    logAdminAuditAction({
      action: "VIEW_REPORT_DETAIL",
      targetUid: report.id,
      details: {
        reporterId: report.reporterId,
        reportedUserId: report.reportedUserId,
        reason: report.reason,
      },
    });
  };

  // Status Change Handler
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedReport) return;
    setIsUpdatingStatus(true);
    setActionSuccess(null);

    try {
      await updateReportStatus(selectedReport.id, newStatus);
      setSelectedReport((prev) => ({
        ...prev,
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: "luxaidevs@gmail.com",
      }));
      setActionSuccess(`Holat "${STATUS_LABELS[newStatus]}" ga o'zgartirildi`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Statusni yangilashda xatolik:", err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Yuqori Haqiqiy Statistik Kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Jami Reports */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Jami
            </span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Flag size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Kelib tushgan</p>
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Kutilmoqda
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-amber-600">
              {loading ? "..." : stats.pending}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ko'rilmagan</p>
          </div>
        </div>

        {/* Reviewing */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Jarayonda
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldAlert size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600">
              {loading ? "..." : stats.reviewing}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ko'rib chiqilmoqda</p>
          </div>
        </div>

        {/* Resolved */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Hal qilindi
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {loading ? "..." : stats.resolved}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Yopilgan</p>
          </div>
        </div>

        {/* Dismissed */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Rad etildi
            </span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
              <XCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-600">
              {loading ? "..." : stats.dismissed}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Asossiz</p>
          </div>
        </div>
      </div>

      {/* 2. Qidiruv va Filter paneli */}
      <div className="rounded-2xl bg-white shadow-card p-4 space-y-3 border border-gray-100/60">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Qidiruv input */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Report ID, ism, UID yoki sabab bo'yicha qidiruv..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:border-flame-start transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filterlar guruhi */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none pl-7 pr-6 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha holatlar</option>
                <option value="pending">Kutilmoqda</option>
                <option value="reviewing">Ko'rib chiqilmoqda</option>
                <option value="resolved">Hal qilindi</option>
                <option value="dismissed">Rad etildi</option>
              </select>
              <Filter
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Reason Filter */}
            <div className="relative">
              <select
                value={filterReason}
                onChange={(e) => setFilterReason(e.target.value)}
                className="w-full appearance-none pl-7 pr-6 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha sabablar</option>
                <option value="fake_profile">Soxta profil</option>
                <option value="harassment">Tazyiq / Haqorat</option>
                <option value="spam">Spam / Reklama</option>
                <option value="inappropriate_content">Nomaqbul kontent</option>
                <option value="scam">Firibgarlik</option>
                <option value="other">Boshqa</option>
              </select>
              <AlertTriangle
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full appearance-none pl-7 pr-6 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha muhimlik</option>
                <option value="high">Yuqori</option>
                <option value="medium">O'rtacha</option>
                <option value="low">Past</option>
              </select>
              <AlertOctagon
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort Filter */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-7 pr-6 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="newest">Yangi kelganlar</option>
                <option value="oldest">Eski shikoyatlar</option>
                <option value="priority_high">Muhimlik (Yuqori)</option>
                <option value="priority_low">Muhimlik (Past)</option>
              </select>
              <ArrowUpDown
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Natijalar ko'rsatkichi va sahifalash */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            <span>
              Topildi: <strong className="text-gray-800">{filteredReports.length}</strong> ta shikoyat
            </span>
            {searchQuery && (
              <span className="ml-1.5 text-gray-400">
                ("{searchQuery}" bo'yicha)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Sahifada:</span>
            {[25, 50, 100].map((sz) => (
              <button
                key={sz}
                onClick={() => setPageSize(sz)}
                className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                  pageSize === sz
                    ? "bg-flame-start text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Xatolik xabari bo'lsa */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={onRefresh}
            className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors"
          >
            Qayta urinish
          </button>
        </div>
      )}

      {/* 3. Reports Jadvali va Kartalari */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden border border-gray-100/60">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredReports.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-14 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Shikoyatlar topilmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Hozirda ko'rib chiqish uchun shikoyat mavjud emas yoki qidiruv bo'yicha natija topilmadi.
            </p>
            {(searchQuery ||
              filterStatus !== "all" ||
              filterReason !== "all" ||
              filterPriority !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setFilterReason("all");
                  setFilterPriority("all");
                }}
                className="mt-3.5 px-3.5 py-1.5 rounded-full flame-bg text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Jadval ko'rinishi */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Report ID</th>
                    <th className="p-3">Shikoyatchi (Reporter)</th>
                    <th className="p-3">Shikoyat qilingan (Reported)</th>
                    <th className="p-3">Sabab</th>
                    <th className="p-3 text-center">Muhimlik</th>
                    <th className="p-3 text-center">Holat</th>
                    <th className="p-3">Sana</th>
                    <th className="p-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentReports.map((r) => {
                    const statusClass =
                      r.status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : r.status === "reviewing"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : r.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200";

                    const priorityClass =
                      r.priority === "high"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : r.priority === "low"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-orange-50 text-orange-700 border-orange-200";

                    return (
                      <tr
                        key={r.id}
                        onClick={() => handleOpenDetail(r)}
                        className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                      >
                        {/* Report ID */}
                        <td className="p-3 font-mono text-gray-500">
                          <div className="flex items-center gap-1">
                            <span className="truncate max-w-[100px]" title={r.id}>
                              {r.id.slice(0, 8)}...
                            </span>
                            <button
                              onClick={(e) => handleCopy(r.id, e)}
                              className="text-gray-400 hover:text-flame-start"
                              title="ID dan nusxa olish"
                            >
                              {copiedId === r.id ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Reporter */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                              {r.reporterAvatar ? (
                                <img
                                  src={r.reporterAvatar}
                                  alt={r.reporterName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={12} className="text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-gray-900 truncate block">
                                {r.reporterName}
                              </span>
                              {r.reporterEmail && (
                                <span className="text-[10px] text-gray-400 truncate block">
                                  {r.reporterEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Reported User */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-rose-200">
                              {r.reportedUserAvatar ? (
                                <img
                                  src={r.reportedUserAvatar}
                                  alt={r.reportedUserName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={12} className="text-flame-start" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-rose-950 truncate block">
                                {r.reportedUserName}
                              </span>
                              {r.reportedUserEmail && (
                                <span className="text-[10px] text-gray-400 truncate block">
                                  {r.reportedUserEmail}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Reason */}
                        <td className="p-3">
                          <span className="font-semibold text-gray-800 block">
                            {REASON_LABELS[r.reason] || r.reason}
                          </span>
                          {r.description && (
                            <span className="text-[11px] text-gray-400 truncate max-w-[180px] block">
                              "{r.description}"
                            </span>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityClass}`}
                          >
                            {PRIORITY_LABELS[r.priority] || r.priority}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}
                          >
                            {STATUS_LABELS[r.status] || r.status}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="p-3 text-gray-500 text-[11px]">
                          {formatTime(r.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenDetail(r)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-600 transition-colors"
                            title="Batafsil ko'rish"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Kartalar ko'rinishi */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentReports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleOpenDetail(r)}
                  className="p-3.5 space-y-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-400">
                      #{r.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.priority === "high"
                            ? "bg-rose-50 text-rose-700"
                            : r.priority === "low"
                            ? "bg-slate-100 text-slate-700"
                            : "bg-orange-50 text-orange-700"
                        }`}
                      >
                        {PRIORITY_LABELS[r.priority] || r.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === "pending"
                            ? "bg-amber-50 text-amber-700"
                            : r.status === "reviewing"
                            ? "bg-blue-50 text-blue-700"
                            : r.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-gray-900 block">
                        {REASON_LABELS[r.reason] || r.reason}
                      </span>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        <strong className="text-gray-700">{r.reporterName}</strong> →{" "}
                        <strong className="text-rose-700">{r.reportedUserName}</strong>
                      </p>
                    </div>
                    <Eye size={16} className="text-gray-400" />
                  </div>

                  {r.description && (
                    <p className="text-[11px] text-gray-600 italic line-clamp-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                      "{r.description}"
                    </p>
                  )}

                  <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1">
                    <span>Vaqt: {formatTime(r.createdAt)}</span>
                    <span className="text-flame-start font-semibold">Tafsilotlar →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredReports.length} ta)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft size={14} /> Oldingi
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 font-medium disabled:opacity-40 hover:bg-gray-50 transition-colors flex items-center gap-1"
                >
                  Keyingi <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. REPORT DETAIL MODAL (AnjurXdating Dizaynida) */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setSelectedReport(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-xs"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1">
                  <Flag size={12} /> Shikoyat #{selectedReport.id.slice(0, 8)}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 font-semibold">
                  {PRIORITY_LABELS[selectedReport.priority] || selectedReport.priority} muhimlik
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white">
                {REASON_LABELS[selectedReport.reason] || selectedReport.reason}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Kelib tushgan: {formatTime(selectedReport.createdAt)}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto thin-scroll text-xs">
              {/* Bildirishnoma (Action Success) */}
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* REPORT INFORMATION */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Flag size={13} className="text-flame-start" /> Shikoyat Tafsilotlari (Report Info)
                </h4>
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">To'liq ID:</span>
                    <div className="flex items-center gap-1.5 font-mono text-gray-800">
                      <span className="truncate max-w-[200px]">{selectedReport.id}</span>
                      <button
                        onClick={(e) => handleCopy(selectedReport.id, e)}
                        className="text-gray-400 hover:text-flame-start"
                      >
                        {copiedId === selectedReport.id ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Joriy Holat:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                        selectedReport.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : selectedReport.status === "reviewing"
                          ? "bg-blue-100 text-blue-800"
                          : selectedReport.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {STATUS_LABELS[selectedReport.status] || selectedReport.status}
                    </span>
                  </div>

                  {selectedReport.description && (
                    <div className="pt-1">
                      <span className="text-gray-500 block text-[10px] mb-1">
                        Shikoyatchi yozgan izoh:
                      </span>
                      <p className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 leading-relaxed italic">
                        "{selectedReport.description}"
                      </p>
                    </div>
                  )}

                  {selectedReport.reviewedBy && (
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-200/50">
                      <span>Ko'rib chiquvchi:</span>
                      <span>{selectedReport.reviewedBy}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* TARAFLAR (Reporter va Reported User) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* REPORTER */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                  <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider block">
                    Shikoyat qiluvchi (Reporter)
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-300">
                      {selectedReport.reporterAvatar ? (
                        <img
                          src={selectedReport.reporterAvatar}
                          alt={selectedReport.reporterName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-gray-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {selectedReport.reporterName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {selectedReport.reporterEmail || "Email yo'q"}
                      </p>
                    </div>
                  </div>
                  {selectedReport.reporterId && (
                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      UID: {selectedReport.reporterId}
                    </div>
                  )}
                </div>

                {/* REPORTED USER */}
                <div className="p-3 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                  <span className="font-bold text-rose-800 text-[11px] uppercase tracking-wider block">
                    Shikoyat qilingan (Reported)
                  </span>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-rose-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-rose-200">
                      {selectedReport.reportedUserAvatar ? (
                        <img
                          src={selectedReport.reportedUserAvatar}
                          alt={selectedReport.reportedUserName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={16} className="text-rose-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {selectedReport.reportedUserName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {selectedReport.reportedUserEmail || "Email yo'q"}
                      </p>
                    </div>
                  </div>
                  {selectedReport.reportedUserId && (
                    <div className="text-[10px] font-mono text-gray-400 truncate">
                      UID: {selectedReport.reportedUserId}
                    </div>
                  )}
                </div>
              </div>

              {/* REPORTED USER PROFILE PREVIEW (agar anketasi bo'lsa) */}
              {selectedReport.reportedUserProfile && (
                <div className="space-y-2">
                  <span className="font-bold text-gray-700 text-[11px] uppercase tracking-wider block">
                    Shikoyat qilingan profil ma'lumotlari:
                  </span>
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Yosh:</span>
                      <span className="font-semibold">
                        {selectedReport.reportedUserProfile.age || "Ko'rsatilmagan"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700">
                      <span>Kasb:</span>
                      <span className="font-semibold">
                        {selectedReport.reportedUserProfile.job || "Ko'rsatilmagan"}
                      </span>
                    </div>
                    {selectedReport.reportedUserProfile.bio && (
                      <div>
                        <span className="text-gray-400 block text-[10px] mb-0.5">Bio:</span>
                        <p className="text-gray-600 italic bg-white p-2 rounded-lg border border-gray-100">
                          "{selectedReport.reportedUserProfile.bio}"
                        </p>
                      </div>
                    )}
                    {selectedReport.reportedUserProfile.photos?.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {selectedReport.reportedUserProfile.photos.map((src, idx) => (
                          <div
                            key={idx}
                            className="aspect-square rounded-lg overflow-hidden bg-gray-200 border border-gray-200"
                          >
                            <img
                              src={src}
                              alt="Profil foto"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MODERATSIYA HARAKATLARI (Status o'zgartirish) */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-flame-start" /> Moderatsiya Amallari
                </span>
                <p className="text-[11px] text-gray-500">
                  Ushbu shikoyat bo'yicha qaroringizni tanlang:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus("reviewing")}
                    disabled={isUpdatingStatus || selectedReport.status === "reviewing"}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100/80 text-blue-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <ShieldAlert size={14} /> Jarayonga olish
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={isUpdatingStatus || selectedReport.status === "resolved"}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 text-emerald-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <CheckCircle2 size={14} /> Hal qilindi
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("dismissed")}
                    disabled={isUpdatingStatus || selectedReport.status === "dismissed"}
                    className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <XCircle size={14} /> Rad etish (Asossiz)
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={isUpdatingStatus || selectedReport.status === "pending"}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-700 font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Clock size={14} /> Kutilmoqda qilish
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
