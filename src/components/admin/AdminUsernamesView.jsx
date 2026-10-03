import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AtSign,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  User,
  Shield,
  Send,
  ExternalLink,
  RefreshCw,
  Filter,
  Check,
  X,
  FileText,
  Bookmark,
  Award,
} from "lucide-react";
import {
  getAdminUsernameRequests,
  reviewUsernameRequest,
  getReservedUsernamesList,
  addReservedUsername,
  removeReservedUsername,
  getAllUsernames,
  adminAssignUsername,
  validateUsernameFormat,
  checkUsernameAvailability,
  DEFAULT_RESERVED_USERNAMES,
} from "../../lib/username";
import { formatTime } from "../../pages/Admin";

export default function AdminUsernamesView({ adminEmail, isSuperAdmin }) {
  const [activeTab, setActiveTab] = useState("requests"); // "requests" | "reserved" | "all" | "assign"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Requests state
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState("pending"); // "all" | "pending" | "approved" | "rejected"
  const [requestSearch, setRequestSearch] = useState("");
  const [reviewModal, setReviewModal] = useState(null); // { request, action: 'approve' | 'reject' }
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // Reserved state
  const [reservedList, setReservedList] = useState([]);
  const [reservedSearch, setReservedSearch] = useState("");
  const [reservedTypeFilter, setReservedTypeFilter] = useState("all");
  const [showAddReservedModal, setShowAddReservedModal] = useState(false);
  const [newReservedUsername, setNewReservedUsername] = useState("");
  const [newReservedType, setNewReservedType] = useState("custom");
  const [newReservedReason, setNewReservedReason] = useState("");
  const [addingReserved, setAddingReserved] = useState(false);

  // All usernames state
  const [allUsernames, setAllUsernames] = useState([]);
  const [allSearch, setAllSearch] = useState("");

  // Assign state
  const [assignUid, setAssignUid] = useState("");
  const [assignUsername, setAssignUsername] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState(null);

  // Feedback notifications
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      const [reqs, resList, allList] = await Promise.all([
        getAdminUsernameRequests({ status: "all", limitCount: 100 }),
        getReservedUsernamesList(),
        getAllUsernames({ limitCount: 150 }),
      ]);
      setRequests(reqs);
      setReservedList(resList);
      setAllUsernames(allList);
    } catch (err) {
      console.error("Admin usernames data load error:", err);
      showFeedback("error", "Ma'lumotlarni yuklashda xatolik yuz berdi.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesFilter =
        requestFilter === "all" ? true : r.status === requestFilter;
      const term = requestSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.requestedUsername?.toLowerCase().includes(term) ||
        r.userDisplayName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        r.uid?.includes(term) ||
        r.reason?.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [requests, requestFilter, requestSearch]);

  const pendingRequestsCount = useMemo(() => {
    return requests.filter((r) => r.status === "pending").length;
  }, [requests]);

  // Filtered reserved
  const filteredReserved = useMemo(() => {
    return reservedList.filter((r) => {
      const matchesType =
        reservedTypeFilter === "all" ? true : r.type === reservedTypeFilter;
      const term = reservedSearch.toLowerCase().trim();
      const matchesSearch =
        !term ||
        r.username?.toLowerCase().includes(term) ||
        r.normalizedUsername?.includes(term) ||
        r.reason?.toLowerCase().includes(term);
      return matchesType && matchesSearch;
    });
  }, [reservedList, reservedTypeFilter, reservedSearch]);

  // Filtered all usernames
  const filteredAllUsernames = useMemo(() => {
    const term = allSearch.toLowerCase().trim();
    if (!term) return allUsernames;
    return allUsernames.filter(
      (u) =>
        u.username?.toLowerCase().includes(term) ||
        u.normalizedUsername?.includes(term) ||
        u.uid?.includes(term)
    );
  }, [allUsernames, allSearch]);

  // Handle Review action
  const handleConfirmReview = async () => {
    if (!reviewModal) return;
    const { request, action } = reviewModal;
    setReviewing(true);

    try {
      await reviewUsernameRequest(
        request.id,
        adminEmail || "luxaidevs@gmail.com",
        action,
        reviewNote
      );

      showFeedback(
        "success",
        action === "approve"
          ? `@${request.requestedUsername} muvaffaqiyatli tasdiqlandi va biriktirildi!`
          : `@${request.requestedUsername} so'rovi rad etildi.`
      );

      setReviewModal(null);
      setReviewNote("");
      await loadData();
    } catch (err) {
      console.error("Review request error:", err);
      showFeedback("error", err.message || "Amalni bajarishda xatolik");
    } finally {
      setReviewing(false);
    }
  };

  // Add Reserved Username
  const handleAddReserved = async (e) => {
    e.preventDefault();
    if (!newReservedUsername.trim()) return;

    setAddingReserved(true);
    try {
      await addReservedUsername(
        newReservedUsername.trim(),
        newReservedType,
        newReservedReason,
        adminEmail || "luxaidevs@gmail.com"
      );

      showFeedback(
        "success",
        `@${newReservedUsername} band qilingan nomlar ro'yxatiga qo'shildi.`
      );
      setNewReservedUsername("");
      setNewReservedReason("");
      setShowAddReservedModal(false);
      await loadData();
    } catch (err) {
      console.error("Add reserved error:", err);
      showFeedback("error", err.message || "Xatolik yuz berdi");
    } finally {
      setAddingReserved(false);
    }
  };

  // Remove Reserved Username
  const handleRemoveReserved = async (normalized) => {
    if (!window.confirm(`Haqiqatan ham @${normalized} bandligini bekor qilmoqchimisiz?`)) {
      return;
    }

    try {
      await removeReservedUsername(normalized, adminEmail || "luxaidevs@gmail.com");
      showFeedback("success", `@${normalized} band ro'yxatidan olib tashlandi.`);
      await loadData();
    } catch (err) {
      console.error("Remove reserved error:", err);
      showFeedback("error", "O'chirishda xatolik yuz berdi.");
    }
  };

  // Direct Assign Username
  const handleDirectAssign = async (e) => {
    e.preventDefault();
    if (!assignUid.trim() || !assignUsername.trim()) {
      setAssignMessage({ type: "error", text: "UID va username kiritilishi shart." });
      return;
    }

    setAssigning(true);
    setAssignMessage(null);

    try {
      await adminAssignUsername(
        assignUid.trim(),
        assignUsername.trim(),
        adminEmail || "luxaidevs@gmail.com"
      );
      setAssignMessage({
        type: "success",
        text: `@${assignUsername.trim()} foydalanuvchiga muvaffaqiyatli biriktirildi!`,
      });
      setAssignUsername("");
      setAssignUid("");
      await loadData();
    } catch (err) {
      console.error("Direct assign error:", err);
      setAssignMessage({ type: "error", text: err.message || "Biriktirishda xatolik" });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl border border-gray-100 p-4" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-2xl border border-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 border shadow-xs animate-in fade-in slide-in-from-top-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <AtSign className="text-flame-start" size={24} />
            <span>@Username Boshqaruvi va Moderatsiyasi</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Noyob identifikatorlar, rasmiy so'rovlar, himoyalangan nomlar va global qidiruv boshqaruvi
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Kutilayotgan So'rovlar
            </p>
            <p className="text-2xl font-black text-amber-600 mt-1">
              {pendingRequestsCount}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Tasdiqlash kutilmoqda</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Band Qilingan Nomlar
            </p>
            <p className="text-2xl font-black text-gray-800 mt-1">
              {reservedList.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              +{DEFAULT_RESERVED_USERNAMES.size} ta tizim himoyasi
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Shield size={20} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Faol Usernamelar
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1">
              {allUsernames.length}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Foydalanuvchilarga tegishli</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 pb-2 overflow-x-auto thin-scroll">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "requests"
              ? "bg-flame-start text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <FileText size={14} />
          <span>Username So'rovlari</span>
          {pendingRequestsCount > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "requests"
                  ? "bg-white text-flame-start"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reserved")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "reserved"
              ? "bg-flame-start text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Shield size={14} />
          <span>Band Qilingan Nomlar ({reservedList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "all"
              ? "bg-flame-start text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <AtSign size={14} />
          <span>Barcha Usernamelar ({allUsernames.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("assign")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === "assign"
              ? "bg-flame-start text-white shadow-xs"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <Award size={14} />
          <span>To'g'ridan-to'g'ri Biriktirish</span>
        </button>
      </div>

      {/* TAB 1: USERNAME REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                placeholder="Username, ism, email yoki UID bo'yicha qidirish..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "pending", label: "Kutilayotgan" },
                { id: "approved", label: "Tasdiqlangan" },
                { id: "rejected", label: "Rad etilgan" },
                { id: "all", label: "Barchasi" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRequestFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                    requestFilter === tab.id
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-2xs">
              <FileText className="mx-auto text-gray-300 mb-2" size={32} />
              <h4 className="text-sm font-bold text-gray-700">So'rovlar topilmadi</h4>
              <p className="text-xs text-gray-400 mt-1">
                Tanlangan filtr yoki qidiruv bo'yicha hech qanday username so'rovi yo'q.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredRequests.map((req) => {
                const isPending = req.status === "pending";
                const isApproved = req.status === "approved";
                const isRejected = req.status === "rejected";

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-base text-gray-900 bg-rose-50 text-flame-start px-2.5 py-0.5 rounded-lg border border-rose-100">
                          @{req.requestedUsername}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            isPending
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : isApproved
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {isPending
                            ? "Kutilmoqda"
                            : isApproved
                            ? "Tasdiqlangan"
                            : "Rad etilgan"}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {formatTime(req.createdAt)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-semibold text-gray-800">
                          Foydalanuvchi: {req.userDisplayName}
                        </span>
                        <span className="text-gray-400">({req.userEmail || "Email yo'q"})</span>
                        <span className="text-gray-400 font-mono text-[10px]">
                          UID: {req.uid}
                        </span>
                      </div>

                      {req.reason && (
                        <div className="p-2.5 rounded-xl bg-gray-50 text-xs text-gray-700 border border-gray-100">
                          <span className="font-bold text-gray-500 mr-1.5">Sabab:</span>
                          <span>{req.reason}</span>
                        </div>
                      )}

                      {req.adminNote && (
                        <p className="text-[11px] text-gray-500 italic">
                          Admin izohi: {req.adminNote} ({req.reviewedBy})
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setReviewModal({ request: req, action: "approve" })
                            }
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all"
                          >
                            <Check size={14} />
                            <span>Tasdiqlash</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setReviewModal({ request: req, action: "reject" })
                            }
                            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <X size={14} />
                            <span>Rad etish</span>
                          </button>
                        </>
                      )}

                      <a
                        href={`/profile`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/u/${req.requestedUsername}`, "_blank");
                        }}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        title="Profil havolasini ko'rish"
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESERVED USERNAMES */}
      {activeTab === "reserved" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={reservedSearch}
                onChange={(e) => setReservedSearch(e.target.value)}
                placeholder="Band qilingan nomlarni qidirish..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={reservedTypeFilter}
                onChange={(e) => setReservedTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
              >
                <option value="all">Barcha turlar</option>
                <option value="platform">Platforma</option>
                <option value="brand">Brend / Trademark</option>
                <option value="official">Rasmiy / Official</option>
                <option value="admin">Ma'muriyat</option>
                <option value="security">Xavfsizlik</option>
                <option value="system">Tizim</option>
                <option value="custom">Maxsus</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAddReservedModal(true)}
                className="px-4 py-2 rounded-xl bg-flame-start text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 active:scale-95 transition-all shrink-0"
              >
                <Plus size={15} />
                <span>Yangi band nom</span>
              </button>
            </div>
          </div>

          {/* Reserved Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredReserved.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-2xl p-3.5 border border-gray-100 shadow-2xs flex items-start justify-between gap-2.5 hover:border-gray-200 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-gray-900 truncate">
                      @{res.username || res.normalizedUsername}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase">
                      {res.type || "custom"}
                    </span>
                  </div>
                  {res.reason && (
                    <p className="text-[11px] text-gray-500 line-clamp-2">
                      {res.reason}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    Qo'shilgan: {formatTime(res.createdAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveReserved(res.normalizedUsername)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                  title="Bandlikni bekor qilish"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {filteredReserved.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center shadow-2xs">
              <Shield className="mx-auto text-gray-300 mb-2" size={32} />
              <h4 className="text-sm font-bold text-gray-700">Band nomlar topilmadi</h4>
              <p className="text-xs text-gray-400 mt-1">
                Yangi band nom qo'shish uchun yuqoridagi tugmadan foydalaning.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ALL USERNAMES */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              <input
                type="text"
                value={allSearch}
                onChange={(e) => setAllSearch(e.target.value)}
                placeholder="Username yoki UID bo'yicha qidirish..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 uppercase tracking-wider text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4 font-bold">Username</th>
                    <th className="py-3 px-4 font-bold">Foydalanuvchi UID</th>
                    <th className="py-3 px-4 font-bold">O'zgartirilgan</th>
                    <th className="py-3 px-4 font-bold">Biriktirgan</th>
                    <th className="py-3 px-4 font-bold text-right">Harakat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {filteredAllUsernames.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-black text-gray-900">
                        @{u.username}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {u.uid}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {formatTime(u.updatedAt || u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.assignedByAdmin ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                            Admin ({u.assignedByAdmin})
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Foydalanuvchi o'zi</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => window.open(`/u/${u.username}`, "_blank")}
                          className="inline-flex items-center gap-1 text-flame-start hover:underline font-bold text-[11px]"
                        >
                          <span>Profil</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAllUsernames.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        Hech qanday username topilmadi
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT ASSIGN */}
      {activeTab === "assign" && (
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 border border-gray-100 shadow-2xs space-y-5">
          <div>
            <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Award className="text-flame-start" size={20} />
              <span>Foydalanuvchiga To'g'ridan-to'g'ri Username Biriktirish</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Super Admin huquqi orqali istalgan tasdiqlangan yoki maxsus username'ni aniq UID'ga ega foydalanuvchiga majburiy biriktirishingiz mumkin.
            </p>
          </div>

          {assignMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 border ${
                assignMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-rose-50 text-rose-800 border-rose-200"
              }`}
            >
              {assignMessage.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{assignMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleDirectAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Foydalanuvchi UID (User ID)
              </label>
              <input
                type="text"
                value={assignUid}
                onChange={(e) => setAssignUid(e.target.value)}
                placeholder="Masalan: vB8d... yoki Foydalanuvchilar bo'limidan nusxa oling"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Biriktiriladigan @Username
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-400 font-bold text-sm">
                  @
                </span>
                <input
                  type="text"
                  value={assignUsername}
                  onChange={(e) => setAssignUsername(e.target.value.replace(/^@/, "").trim())}
                  placeholder="masalan: rasmiy_anjur"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                3-20 belgi, faqat lotin harflari, raqamlar va _
              </p>
            </div>

            <button
              type="submit"
              disabled={assigning}
              className="w-full py-3 rounded-2xl flame-bg text-white font-bold text-xs shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {assigning ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Biriktirilmoqda...</span>
                </>
              ) : (
                <>
                  <Award size={16} />
                  <span>Username'ni Biriktirish</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900">
                {reviewModal.action === "approve"
                  ? "So'rovni Tasdiqlash"
                  : "So'rovni Rad Etish"}
              </h3>
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-1">
              <p>
                <strong className="text-gray-900">So'ralgan username:</strong>{" "}
                <span className="font-bold text-flame-start">
                  @{reviewModal.request.requestedUsername}
                </span>
              </p>
              <p>
                <strong className="text-gray-900">Foydalanuvchi:</strong>{" "}
                {reviewModal.request.userDisplayName} ({reviewModal.request.userEmail})
              </p>
              {reviewModal.request.reason && (
                <p>
                  <strong className="text-gray-900">Foydalanuvchi sababi:</strong>{" "}
                  {reviewModal.request.reason}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                {reviewModal.action === "approve"
                  ? "Tasdiqlash izohi (ixtiyoriy)"
                  : "Rad etish sababi (foydalanuvchiga yuboriladi)"}
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  reviewModal.action === "approve"
                    ? "Masalan: Rasmiy brend vakili tasdiqlandi"
                    : "Masalan: Ushbu nom umumiy foydalanish uchun ajratilmagan"
                }
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={reviewing}
                className={`flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs ${
                  reviewModal.action === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {reviewing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : reviewModal.action === "approve" ? (
                  <Check size={14} />
                ) : (
                  <X size={14} />
                )}
                <span>
                  {reviewModal.action === "approve" ? "Tasdiqlash" : "Rad etish"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Reserved Username Modal */}
      {showAddReservedModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <Shield className="text-sky-600" size={18} />
                <span>Yangi Band Qilingan Nom Qo'shish</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddReservedModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddReserved} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Band qilinadigan @username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-xs">
                    @
                  </span>
                  <input
                    type="text"
                    value={newReservedUsername}
                    onChange={(e) =>
                      setNewReservedUsername(e.target.value.replace(/^@/, "").trim())
                    }
                    placeholder="masalan: bank_uz, yandex"
                    className="w-full pl-7 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Turi (Kategoriya)
                </label>
                <select
                  value={newReservedType}
                  onChange={(e) => setNewReservedType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700"
                >
                  <option value="platform">Platforma (AnjurX)</option>
                  <option value="brand">Brend / Tovar belgisi</option>
                  <option value="official">Rasmiy shaxs / Tashkilot</option>
                  <option value="admin">Ma'muriyat / Admin</option>
                  <option value="security">Xavfsizlik / Security</option>
                  <option value="system">Tizim nomi</option>
                  <option value="custom">Maxsus</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Band qilish sababi
                </label>
                <input
                  type="text"
                  value={newReservedReason}
                  onChange={(e) => setNewReservedReason(e.target.value)}
                  placeholder="Masalan: Tashkilot himoyasi yoki xavfsizlik"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddReservedModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={addingReserved}
                  className="flex-1 py-2.5 rounded-xl flame-bg text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:opacity-95"
                >
                  {addingReserved ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  <span>Qo'shish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
