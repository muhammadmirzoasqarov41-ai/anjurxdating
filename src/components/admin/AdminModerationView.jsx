import { useState, useMemo, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
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
  Flag,
  UserCheck,
  Lock,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import {
  logAdminAuditAction,
  updateReportStatus,
} from "../../lib/admin";

export default function AdminModerationView({
  queueItems = [],
  stats = {
    pendingCount: 0,
    reviewingCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
    reportedUsersCount: 0,
    suspendedUsersCount: 0,
    totalItems: 0,
  },
  loading = false,
  error = null,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("priority_high");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected item modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Filter & Search & Sort processing
  const filteredQueue = useMemo(() => {
    let list = [...queueItems];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const titleMatch = (item.title || "").toLowerCase().includes(q);
        const reasonMatch = (item.reason || "").toLowerCase().includes(q);
        const descMatch = (item.description || "").toLowerCase().includes(q);
        const targetNameMatch = (item.targetUser?.displayName || "")
          .toLowerCase()
          .includes(q);
        const targetEmailMatch = (item.targetUser?.email || "")
          .toLowerCase()
          .includes(q);
        const targetUidMatch = (item.targetUser?.uid || "")
          .toLowerCase()
          .includes(q);
        const initiatorNameMatch = (item.initiator?.displayName || "")
          .toLowerCase()
          .includes(q);

        return (
          titleMatch ||
          reasonMatch ||
          descMatch ||
          targetNameMatch ||
          targetEmailMatch ||
          targetUidMatch ||
          initiatorNameMatch
        );
      });
    }

    // 2. Filter Status
    if (filterStatus !== "all") {
      list = list.filter((i) => (i.status || "pending") === filterStatus);
    }

    // 3. Filter Priority
    if (filterPriority !== "all") {
      list = list.filter((i) => (i.priority || "medium") === filterPriority);
    }

    // 4. Sorting
    list.sort((a, b) => {
      if (sortBy === "priority_high") {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const wDiff =
          (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
        if (wDiff !== 0) return wDiff;
      }
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
      return 0;
    });

    return list;
  }, [queueItems, searchQuery, filterStatus, filterPriority, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredQueue.length / pageSize));
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQueue.slice(start, start + pageSize);
  }, [filteredQueue, currentPage, pageSize]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, filterPriority, sortBy, pageSize]);

  // Copy helper
  const handleCopy = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open detail modal
  const handleOpenDetail = (item) => {
    setSelectedItem(item);
    setActionSuccess(null);

    logAdminAuditAction({
      action: "VIEW_MODERATION_ITEM",
      targetUid: item.id,
      details: {
        title: item.title,
        priority: item.priority,
        targetUser: item.targetUser?.uid,
      },
    });
  };

  // Status Change Handler
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedItem) return;
    setIsUpdating(true);
    setActionSuccess(null);

    try {
      if (selectedItem.type === "report" && selectedItem.originalId) {
        await updateReportStatus(selectedItem.originalId, newStatus);
      }

      setSelectedItem((prev) => ({
        ...prev,
        status: newStatus,
        reviewedAt: new Date(),
        reviewedBy: "luxaidevs@gmail.com",
      }));

      setActionSuccess(`Holat muvaffaqiyatli "${newStatus}" ga o'zgartirildi`);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Moderatsiya holatini yangilashda xatolik:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. MODERATSIYA STATISTIK KARTALARI */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Kutilayotganlar */}
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
              {loading ? "..." : stats.pendingCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Ko'rib chiqilishi kerak</p>
          </div>
        </div>

        {/* Jarayondagilar */}
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
              {loading ? "..." : stats.reviewingCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tekshirilmoqda</p>
          </div>
        </div>

        {/* Shikoyat tushgan foydalanuvchilar */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
              Shikoyatli Userlar
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flag size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-600">
              {loading ? "..." : stats.reportedUsersCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Nazoratdagi hisoblar</p>
          </div>
        </div>

        {/* Hal qilinganlar */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Hal Qilindi
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {loading ? "..." : stats.resolvedCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Yopilgan masalalar</p>
          </div>
        </div>

        {/* Cheklangan hisoblar */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Cheklangan
            </span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
              <Lock size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-700">
              {loading ? "..." : stats.suspendedUsersCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">To'xtatilgan akkauntlar</p>
          </div>
        </div>
      </div>

      {/* 2. QIDIRUV VA FILTER PANELI */}
      <div className="rounded-2xl bg-white shadow-card p-4 space-y-3 border border-gray-100/60">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Qidiruv */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Foydalanuvchi ismi, email, UID yoki sabab bo'yicha qidiruv..."
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

          {/* Filter & Sort */}
          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha holatlar ({queueItems.length})</option>
                <option value="pending">Kutilmoqda</option>
                <option value="reviewing">Jarayonda</option>
                <option value="resolved">Hal qilindi</option>
                <option value="dismissed">Rad etildi</option>
              </select>
              <Filter
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Priority Filter */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha muhimlik</option>
                <option value="high">Yuqori (High)</option>
                <option value="medium">O'rtacha (Medium)</option>
                <option value="low">Past (Low)</option>
              </select>
              <AlertTriangle
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="priority_high">Muhimlik (Yuqori)</option>
                <option value="newest">Yangi kelganlar</option>
                <option value="oldest">Eskilar</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Natijalar ko'rsatkichi */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            <span>
              Navbatda: <strong className="text-gray-800">{filteredQueue.length}</strong> ta moderatsiya elementi
            </span>
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

      {/* 3. MODERATSIYA NAVBATI (QUEUE) */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden border border-gray-100/60">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
              <ShieldCheck size={28} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Moderatsiya navbati toza
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Ayni paytda tekshirishni talab qiluvchi shikoyat yoki qoidabuzarliklar mavjud emas.
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Jadval */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Ob'ekt / Mavzu</th>
                    <th className="p-3">Tekshiriluvchi Foydalanuvchi</th>
                    <th className="p-3">Tashabbuskor</th>
                    <th className="p-3 text-center">Muhimlik</th>
                    <th className="p-3 text-center">Holat</th>
                    <th className="p-3">Sana</th>
                    <th className="p-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((item) => {
                    const statusClass =
                      item.status === "pending"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : item.status === "reviewing"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : item.status === "resolved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-gray-100 text-gray-600 border-gray-200";

                    const priorityClass =
                      item.priority === "high"
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : item.priority === "low"
                        ? "bg-slate-100 text-slate-700 border-slate-200"
                        : "bg-orange-50 text-orange-700 border-orange-200";

                    return (
                      <tr
                        key={item.id}
                        onClick={() => handleOpenDetail(item)}
                        className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                      >
                        {/* Ob'ekt */}
                        <td className="p-3">
                          <span className="font-bold text-gray-900 block">
                            {item.title}
                          </span>
                          {item.description && (
                            <span className="text-[11px] text-gray-400 truncate max-w-[200px] block">
                              "{item.description}"
                            </span>
                          )}
                        </td>

                        {/* Target User */}
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-rose-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-rose-200">
                              {item.targetUser?.avatar ? (
                                <img
                                  src={item.targetUser.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={14} className="text-rose-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-rose-950 truncate block">
                                {item.targetUser?.displayName || "Noma'lum"}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono truncate block">
                                {item.targetUser?.uid?.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Initiator */}
                        <td className="p-3">
                          <span className="font-medium text-gray-700 truncate block">
                            {item.initiator?.displayName || "Tizim"}
                          </span>
                          {item.initiator?.email && (
                            <span className="text-[10px] text-gray-400 truncate block">
                              {item.initiator.email}
                            </span>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${priorityClass}`}
                          >
                            {item.priority === "high"
                              ? "Yuqori"
                              : item.priority === "low"
                              ? "Past"
                              : "O'rtacha"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}`}
                          >
                            {item.status === "pending"
                              ? "Kutilmoqda"
                              : item.status === "reviewing"
                              ? "Jarayonda"
                              : item.status === "resolved"
                              ? "Hal qilindi"
                              : "Rad etildi"}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="p-3 text-gray-500 text-[11px]">
                          {formatTime(item.createdAt)}
                        </td>

                        {/* Action */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenDetail(item)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-600 transition-colors"
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

            {/* Mobile Kartalar */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item)}
                  className="p-3.5 space-y-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-900 truncate">
                      {item.title}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : item.status === "reviewing"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {item.targetUser?.avatar ? (
                        <img
                          src={item.targetUser.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={14} className="text-rose-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-rose-950 truncate">
                        {item.targetUser?.displayName}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Tashabbuskor: {item.initiator?.displayName || "Tizim"}
                      </p>
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-[11px] text-gray-600 italic bg-gray-50 p-2 rounded-lg truncate">
                      "{item.description}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>{formatTime(item.createdAt)}</span>
                    <span className="text-flame-start font-semibold">Ko'rib chiqish →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredQueue.length} ta)
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

      {/* 4. MODERATSIYA DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1">
                  <ShieldAlert size={12} /> Moderatsiya Ishi
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 font-semibold">
                  {selectedItem.priority === "high"
                    ? "Yuqori muhimlik"
                    : selectedItem.priority === "low"
                    ? "Past muhimlik"
                    : "O'rtacha muhimlik"}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-white">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Kelib tushgan: {formatTime(selectedItem.createdAt)}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto thin-scroll text-xs">
              {actionSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Ma'lumotlar */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Holat:</span>
                  <span className="font-bold text-gray-800 uppercase">
                    {selectedItem.status}
                  </span>
                </div>
                {selectedItem.description && (
                  <div>
                    <span className="text-gray-500 block text-[10px] mb-1">Izoh / Tafsilot:</span>
                    <p className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 italic">
                      "{selectedItem.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Target User */}
              <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                <span className="font-bold text-rose-800 text-[11px] uppercase tracking-wider block">
                  Shikoyat qilingan foydalanuvchi
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-rose-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-rose-200">
                    {selectedItem.targetUser?.avatar ? (
                      <img
                        src={selectedItem.targetUser.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={18} className="text-rose-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {selectedItem.targetUser?.displayName}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {selectedItem.targetUser?.email || "Email mavjud emas"}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono truncate">
                      UID: {selectedItem.targetUser?.uid}
                    </p>
                  </div>
                </div>
              </div>

              {/* Moderatsiya Harakatlari */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-flame-start" /> Super Admin Qarori
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateStatus("reviewing")}
                    disabled={isUpdating || selectedItem.status === "reviewing"}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 font-bold transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                  >
                    <ShieldAlert size={14} /> Jarayonga olish
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("resolved")}
                    disabled={isUpdating || selectedItem.status === "resolved"}
                    className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 size={14} /> Hal qilindi
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("dismissed")}
                    disabled={isUpdating || selectedItem.status === "dismissed"}
                    className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                  >
                    <XCircle size={14} /> Rad etish (Asossiz)
                  </button>

                  <button
                    onClick={() => handleUpdateStatus("pending")}
                    disabled={isUpdating || selectedItem.status === "pending"}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-700 font-bold transition-colors disabled:opacity-50 text-xs flex items-center justify-center gap-1"
                  >
                    <Clock size={14} /> Kutilmoqda qilish
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedItem(null)}
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
