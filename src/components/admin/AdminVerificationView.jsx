import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Star,
  Lock,
  ChevronRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import {
  approveVerificationRequest,
  rejectVerificationRequest,
  VERIFICATION_GESTURES,
} from "../../lib/verification";

const REJECTION_REASONS = [
  "Suratda yuz aniq ko'rinmagan",
  "Talab qilingan imo-ishora (gesture) bajarilmagan",
  "Surat profil rasmidagi shaxs bilan mos kelmadi",
  "Surat sifati juda past yoki xiralashgan",
  "Yuz qisman yoki to'liq to'silgan (ko'zoynak/niqob)",
  "Boshqa sabab",
];

export default function AdminVerificationView({
  requests = [],
  stats = { total: 0, pending: 0, approved: 0, rejected: 0 },
  loading = false,
  error = null,
  onRefresh,
  adminPrivileges,
}) {
  const isAuthorized =
    adminPrivileges?.isSuperAdmin ||
    adminPrivileges?.roles?.includes("verification_manager") ||
    adminPrivileges?.permissions?.includes("verification:view") ||
    adminPrivileges?.permissions?.includes("*");

  const canAction =
    adminPrivileges?.isSuperAdmin ||
    adminPrivileges?.roles?.includes("verification_manager") ||
    adminPrivileges?.permissions?.includes("verification:approve") ||
    adminPrivileges?.permissions?.includes("*");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // default show pending
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REJECTION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");

  // Filter and sort items
  const filteredRequests = useMemo(() => {
    let list = [...requests];

    if (statusFilter !== "all") {
      list = list.filter((r) => (r.status || "pending") === statusFilter);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => {
        const name = (r.userProfile?.displayName || "").toLowerCase();
        const uid = (r.uid || "").toLowerCase();
        const reqId = (r.requestId || r.id || "").toLowerCase();
        return name.includes(q) || uid.includes(q) || reqId.includes(q);
      });
    }

    list.sort((a, b) => {
      const timeA =
        a.createdAt?.toMillis?.() ||
        (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
        0;
      const timeB =
        b.createdAt?.toMillis?.() ||
        (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
        0;

      if (sortBy === "oldest") return timeA - timeB;
      if (sortBy === "status") {
        const order = { pending: 0, rejected: 1, approved: 2 };
        const diff = (order[a.status] || 0) - (order[b.status] || 0);
        if (diff !== 0) return diff;
      }
      return timeB - timeA;
    });

    return list;
  }, [requests, statusFilter, search, sortBy]);

  const totalPages = Math.ceil(filteredRequests.length / pageSize) || 1;
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle Approve
  const handleApprove = async () => {
    if (!selectedRequest || !canAction) return;
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await approveVerificationRequest({
        requestId: selectedRequest.requestId || selectedRequest.id,
        uid: selectedRequest.uid,
        adminEmail: adminPrivileges?.email || "luxaidevs@gmail.com",
      });

      setActionSuccess("Foydalanuvchi muvaffaqiyatli tasdiqlandi!");
      setTimeout(() => {
        setSelectedRequest(null);
        if (onRefresh) onRefresh();
      }, 700);
    } catch (err) {
      console.error("Approve error:", err);
      setActionError(err.message || "Tasdiqlashda xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject
  const handleReject = async () => {
    if (!selectedRequest || !canAction) return;
    const finalReason =
      selectedReason === "Boshqa sabab"
        ? customReason.trim() || "Talabga mos kelmadi"
        : selectedReason;

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    try {
      await rejectVerificationRequest({
        requestId: selectedRequest.requestId || selectedRequest.id,
        uid: selectedRequest.uid,
        adminEmail: adminPrivileges?.email || "luxaidevs@gmail.com",
        reason: finalReason,
      });

      setActionSuccess("So'rov rad etildi va foydalanuvchiga bildirishnoma bordi.");
      setTimeout(() => {
        setShowRejectDialog(false);
        setSelectedRequest(null);
        if (onRefresh) onRefresh();
      }, 700);
    } catch (err) {
      console.error("Reject error:", err);
      setActionError(err.message || "Rad etishda xatolik yuz berdi");
    } finally {
      setActionLoading(false);
    }
  };

  // Access Denied screen
  if (!isAuthorized) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 shadow-card">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center mb-3">
          <Lock size={32} />
        </div>
        <h3 className="text-lg font-black text-gray-900">Kirish Cheklangan</h3>
        <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
          Sizda Verification so'rovlarini ko'rish uchun ruxsat mavjud emas. Super Admin bilan bog'laning.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Jami so'rovlar</span>
            <span className="p-1.5 rounded-lg bg-gray-100 text-gray-700">
              <ShieldCheck size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{stats.total || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Kutilmoqda
            </span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-2">{stats.pending || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Tasdiqlangan</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{stats.approved || 0}</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Rad etilgan</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
              <XCircle size={16} />
            </span>
          </div>
          <p className="text-2xl font-black text-rose-600 mt-2">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* 2. Search, Filter and Actions Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-gray-100 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Foydalanuvchi ismi, UID yoki so'rov ID bo'yicha qidiruv..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-flame-start"
            />
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Yangilash</span>
          </button>
        </div>

        {/* Filter Chips & Sorting */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "pending", label: "Kutilmoqda", badge: stats.pending },
              { id: "approved", label: "Tasdiqlangan", badge: stats.approved },
              { id: "rejected", label: "Rad etilgan", badge: stats.rejected },
              { id: "all", label: "Barchasi", badge: stats.total },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? "flame-bg text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === tab.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value="newest">Eng yangilar</option>
              <option value="oldest">Eng eskilar</option>
              <option value="status">Holati bo'yicha</option>
            </select>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none"
            >
              <option value={25}>25 tadan</option>
              <option value={50}>50 tadan</option>
              <option value={100}>100 tadan</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Requests Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-flame-start" />
            So'rovlar yuklanmoqda...
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div className="p-12 text-center text-xs text-gray-400">
            <ShieldCheck size={36} className="mx-auto mb-2 text-gray-300" />
            Hozircha tanlangan mezon bo'yicha so'rovlar topilmadi.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Holat</th>
                  <th className="py-3 px-4">Ishora / Tur</th>
                  <th className="py-3 px-4">Yuborilgan sana</th>
                  <th className="py-3 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {paginatedRequests.map((req) => {
                  const gesture = VERIFICATION_GESTURES.find(
                    (g) => g.id === req.gestureType
                  );
                  return (
                    <tr
                      key={req.id || req.requestId}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              req.userProfile?.photoUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop"
                            }
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="font-extrabold text-gray-900 block truncate">
                              {req.userProfile?.displayName || "Noma'lum"}
                              {req.userProfile?.age ? `, ${req.userProfile.age}` : ""}
                            </span>
                            <span className="text-[10px] text-gray-400 block truncate font-mono">
                              UID: {req.uid?.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {req.status === "approved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            <CheckCircle2 size={12} /> Tasdiqlangan
                          </span>
                        ) : req.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
                            <XCircle size={12} /> Rad etilgan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200 animate-pulse">
                            <Clock size={12} /> Kutilmoqda
                          </span>
                        )}
                      </td>

                      {/* Gesture */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-gray-700 text-xs">
                          <span>{gesture?.emoji || "✌️"}</span>
                          <span>{gesture?.label || req.gestureType || "Selfie"}</span>
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-gray-500 text-[11px]">
                        {formatTime(req.createdAt)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="px-3 py-1.5 rounded-xl flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-2xs inline-flex items-center gap-1"
                        >
                          <Eye size={13} />
                          <span>Ko'rish</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Jami: {filteredRequests.length} ta (Sahifa {currentPage} / {totalPages})
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Oldingi
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Keyingi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. DETAIL REVIEW MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                    Verification So'rovini Ko'rib Chiqish
                  </h3>
                  <p className="text-[11px] text-gray-400 font-mono">
                    ID: {selectedRequest.requestId || selectedRequest.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedRequest(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Notification Messages inside modal */}
            {actionError && (
              <div className="mx-5 mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={15} />
                <span>{actionError}</span>
              </div>
            )}
            {actionSuccess && (
              <div className="mx-5 mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Body: Side-by-side comparison */}
            <div className="p-5 overflow-y-auto thin-scroll space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Profile photo */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-700 block">
                    1. Joriy Profil Rasmi:
                  </span>
                  <div className="rounded-2xl overflow-hidden border border-gray-200 aspect-3/4 bg-gray-900 relative">
                    <img
                      src={
                        selectedRequest.userProfile?.photoUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop"
                      }
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-black/80 to-transparent text-white text-xs">
                      <span className="font-bold block">
                        {selectedRequest.userProfile?.displayName}
                        {selectedRequest.userProfile?.age ? `, ${selectedRequest.userProfile.age}` : ""}
                      </span>
                      <span className="text-[10px] text-white/80 block">
                        {selectedRequest.userProfile?.city || "Hudud ko'rsatilmagan"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Verification Selfie */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 block">
                      2. Tekshiruv Surati (Selfie):
                    </span>
                    <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                      {selectedRequest.gestureType || "peace_sign"}
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border-2 border-sky-300 aspect-3/4 bg-gray-900 relative">
                    {selectedRequest.photoUrl ? (
                      <img
                        src={selectedRequest.photoUrl}
                        alt="Verification Selfie"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        Surat yuklanmagan
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User details & note */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/70 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <div>
                    <span className="text-[10px] text-gray-400 block">Foydalanuvchi UID:</span>
                    <span className="font-mono text-gray-800 break-all">{selectedRequest.uid}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block">Yuborilgan sana:</span>
                    <span className="font-medium text-gray-800">
                      {formatTime(selectedRequest.createdAt)}
                    </span>
                  </div>
                </div>

                {selectedRequest.note && (
                  <div className="pt-2 border-t border-gray-200/60">
                    <span className="text-[10px] text-gray-400 block">Foydalanuvchi izohi:</span>
                    <p className="text-gray-700 italic">"{selectedRequest.note}"</p>
                  </div>
                )}

                {selectedRequest.rejectionReason && (
                  <div className="pt-2 border-t border-gray-200/60 text-rose-600">
                    <span className="text-[10px] text-rose-400 block">Rad etish sababi:</span>
                    <p className="font-bold">"{selectedRequest.rejectionReason}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Yopish
              </button>

              {canAction && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5"
                  >
                    <XCircle size={15} />
                    <span>Rad etish</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={15} />
                    <span>Tasdiqlash (Approve)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. REJECTION REASON PROMPT MODAL */}
      {showRejectDialog && selectedRequest && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-sm text-gray-900 flex items-center gap-1.5 text-rose-600">
                <AlertCircle size={18} /> Rad etish sababini tanlang
              </h4>
              <button
                onClick={() => setShowRejectDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedReason === reason
                      ? "bg-rose-50 border-rose-200 text-rose-900 font-bold"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium"
                  }`}
                >
                  <span>{reason}</span>
                  <input
                    type="radio"
                    name="rejectionReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="accent-rose-600"
                  />
                </label>
              ))}
            </div>

            {selectedReason === "Boshqa sabab" && (
              <textarea
                placeholder="Rad etish sababini aniq yozing..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-rose-500"
              />
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowRejectDialog(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                {actionLoading ? "Yuklanmoqda..." : "Rad etishni tasdiqlash"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
