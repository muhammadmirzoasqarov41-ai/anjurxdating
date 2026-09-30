import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Briefcase,
  MapPin,
  Mail,
  Heart,
  Flag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  X,
  UserCheck,
  Bot,
  AlertCircle,
  FileText,
  RotateCcw,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import {
  logAdminAuditAction,
  updateUserAdminStatus,
} from "../../lib/admin";

export default function AdminUsersView({
  users = [],
  loading = false,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Bulk selection state
  const [selectedUids, setSelectedUids] = useState(new Set());

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [copiedUid, setCopiedUid] = useState(null);

  // Admin note and verify states in modal
  const [adminNote, setAdminNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(false);

  // Search & Filter & Sort processing
  const filteredUsers = useMemo(() => {
    let list = [...users];

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((u) => {
        const nameMatch = (u.displayName || "").toLowerCase().includes(q);
        const emailMatch = (u.email || "").toLowerCase().includes(q);
        const uidMatch = (u.uid || "").toLowerCase().includes(q);
        const jobMatch = (u.profile?.job || "").toLowerCase().includes(q);
        const bioMatch = (u.profile?.bio || "").toLowerCase().includes(q);
        return nameMatch || emailMatch || uidMatch || jobMatch || bioMatch;
      });
    }

    // 2. Status filter
    if (filterStatus === "with_profile") {
      list = list.filter((u) => u.hasProfile);
    } else if (filterStatus === "without_profile") {
      list = list.filter((u) => !u.hasProfile);
    } else if (filterStatus === "active") {
      list = list.filter((u) => u.matchesCount > 0 || u.lastLoginAt);
    } else if (filterStatus === "reported") {
      list = list.filter((u) => u.reportsCount > 0);
    } else if (filterStatus === "bots") {
      list = list.filter((u) => u.isBot);
    } else if (filterStatus === "real") {
      list = list.filter((u) => !u.isBot);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        const timeA =
          a.createdAt?.toMillis?.() ||
          (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
          a.lastLoginAt?.toMillis?.() ||
          0;
        const timeB =
          b.createdAt?.toMillis?.() ||
          (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
          b.lastLoginAt?.toMillis?.() ||
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
      if (sortBy === "name_asc") {
        return (a.displayName || "").localeCompare(b.displayName || "");
      }
      if (sortBy === "name_desc") {
        return (b.displayName || "").localeCompare(a.displayName || "");
      }
      if (sortBy === "matches") {
        return (b.matchesCount || 0) - (a.matchesCount || 0);
      }
      if (sortBy === "activity") {
        const timeA =
          a.lastLoginAt?.toMillis?.() ||
          (a.lastLoginAt?.seconds ? a.lastLoginAt.seconds * 1000 : 0) ||
          0;
        const timeB =
          b.lastLoginAt?.toMillis?.() ||
          (b.lastLoginAt?.seconds ? b.lastLoginAt.seconds * 1000 : 0) ||
          0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [users, searchQuery, filterStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedUids(new Set());
  }, [searchQuery, filterStatus, sortBy, pageSize]);

  // Bulk selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const next = new Set(selectedUids);
      currentUsers.forEach((u) => next.add(u.uid));
      setSelectedUids(next);
    } else {
      const next = new Set(selectedUids);
      currentUsers.forEach((u) => next.delete(u.uid));
      setSelectedUids(next);
    }
  };

  const handleToggleSelect = (uid) => {
    const next = new Set(selectedUids);
    if (next.has(uid)) {
      next.delete(uid);
    } else {
      next.add(uid);
    }
    setSelectedUids(next);
  };

  const isAllCurrentSelected =
    currentUsers.length > 0 &&
    currentUsers.every((u) => selectedUids.has(u.uid));

  // Copy UID helper
  const handleCopyUid = (uid, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Open User Detail Modal
  const handleOpenDetail = (userItem) => {
    setSelectedUser(userItem);
    setAdminNote(userItem.adminNote || "");
    setNoteSuccess(false);

    // Record audit log
    logAdminAuditAction({
      action: "VIEW_USER_PROFILE",
      targetUid: userItem.uid,
      targetEmail: userItem.email,
      details: { displayName: userItem.displayName },
    });
  };

  // Save Admin Note
  const handleSaveNote = async () => {
    if (!selectedUser) return;
    setIsSavingNote(true);
    try {
      await updateUserAdminStatus(selectedUser.uid, {
        adminNote: adminNote.trim(),
      });
      setSelectedUser((prev) => ({
        ...prev,
        adminNote: adminNote.trim(),
      }));
      setNoteSuccess(true);
      setTimeout(() => setNoteSuccess(false), 2500);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Eslatma saqlashda xatolik:", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Toggle verified status
  const handleToggleVerified = async () => {
    if (!selectedUser) return;
    const nextVal = !selectedUser.verified;
    try {
      await updateUserAdminStatus(selectedUser.uid, {
        verified: nextVal,
      });
      setSelectedUser((prev) => ({
        ...prev,
        verified: nextVal,
      }));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Tasdiq holatini o'zgartirishda xatolik:", err);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Qidiruv va Filter paneli */}
      <div className="rounded-2xl bg-white shadow-card p-4 space-y-3 border border-gray-100/60">
        <div className="flex flex-col sm:flex-row gap-3">
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
              placeholder="Ism, email, UID yoki kasb bo'yicha qidiruv..."
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

          {/* Filter dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha foydalanuvchilar ({users.length})</option>
                <option value="with_profile">Profili to'ldirilganlar</option>
                <option value="without_profile">Profil to'ldirilmaganlar</option>
                <option value="active">Faol (match/kirganlar)</option>
                <option value="reported">Shikoyat tushganlar</option>
                <option value="real">Haqiqiy insonlar</option>
                <option value="bots">Botlar</option>
              </select>
              <Filter
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="newest">Yangi ro'yxatdan o'tganlar</option>
                <option value="oldest">Eski ro'yxatdan o'tganlar</option>
                <option value="name_asc">Ism (A-Z)</option>
                <option value="name_desc">Ism (Z-A)</option>
                <option value="matches">Matchlar soni bo'yicha</option>
                <option value="activity">Oxirgi faoliyat bo'yicha</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Natijalar ko'rsatkichi va tezkor teglari */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            <span>
              Topildi: <strong className="text-gray-800">{filteredUsers.length}</strong> ta foydalanuvchi
            </span>
            {searchQuery && (
              <span className="ml-1.5 text-gray-400">
                ("{searchQuery}" bo'yicha)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Sahifada:</span>
            {[10, 25, 50].map((sz) => (
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

      {/* 2. Bulk Actions Bar (Agar 1 yoki undan ko'p tanlangan bo'lsa) */}
      {selectedUids.size > 0 && (
        <div className="p-3 rounded-xl flame-bg text-white shadow-card flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} />
            <span>{selectedUids.size} ta foydalanuvchi tanlandi</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] opacity-90">
              Kelajakdagi amallar uchun tayyorlangan
            </span>
            <button
              onClick={() => setSelectedUids(new Set())}
              className="px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold transition-colors"
            >
              Tanlovni bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* 3. Foydalanuvchilar ro'yxati / Jadvali */}
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
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Search size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Foydalanuvchilar topilmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Qidiruv shartlarini o'zgartiring yoki filtrlarni tozalang.
            </p>
            {(searchQuery || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                }}
                className="mt-3 px-3 py-1.5 rounded-full flame-bg text-white text-xs font-semibold"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table ko'rinishi */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentSelected}
                        onChange={handleSelectAll}
                        className="rounded accent-flame-start cursor-pointer"
                        title="Sahifadagilarni tanlash"
                      />
                    </th>
                    <th className="p-3">Foydalanuvchi</th>
                    <th className="p-3">Email & UID</th>
                    <th className="p-3">Profil holati</th>
                    <th className="p-3 text-center">Match / Shikoyat</th>
                    <th className="p-3">Faoliyat</th>
                    <th className="p-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentUsers.map((u) => {
                    const isSuperAdmin =
                      u.email?.toLowerCase() === "luxaidevs@gmail.com";
                    const isSelected = selectedUids.has(u.uid);

                    return (
                      <tr
                        key={u.uid}
                        onClick={() => handleOpenDetail(u)}
                        className={`hover:bg-rose-50/20 transition-colors cursor-pointer ${
                          isSelected ? "bg-rose-50/40" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="p-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(u.uid)}
                            className="rounded accent-flame-start cursor-pointer"
                          />
                        </td>

                        {/* Foydalanuvchi avatar va ism */}
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                              {u.profile?.photos?.[0] ? (
                                <img
                                  src={u.profile.photos[0]}
                                  alt={u.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="font-bold text-gray-400 text-xs">
                                  {u.displayName?.[0]?.toUpperCase() || "U"}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-gray-900 truncate">
                                  {u.displayName || "Nomsiz"}
                                </span>
                                {u.profile?.age && (
                                  <span className="text-gray-500 font-normal">
                                    , {u.profile.age}
                                  </span>
                                )}
                                {isSuperAdmin && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <ShieldCheck size={10} /> Admin
                                  </span>
                                )}
                                {u.isBot && (
                                  <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Bot size={10} /> Bot
                                  </span>
                                )}
                                {u.verified && (
                                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <CheckCircle2 size={10} />
                                  </span>
                                )}
                              </div>
                              {u.profile?.job && (
                                <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                                  <Briefcase size={11} /> {u.profile.job}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email & UID */}
                        <td className="p-3">
                          <p className="font-medium text-gray-700 truncate max-w-[180px]">
                            {u.email || <span className="text-gray-400 italic">Mavjud emas</span>}
                          </p>
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 font-mono">
                            <span className="truncate max-w-[120px]" title={u.uid}>
                              {u.uid}
                            </span>
                            <button
                              onClick={(e) => handleCopyUid(u.uid, e)}
                              className="text-gray-400 hover:text-flame-start transition-colors"
                              title="UID dan nusxa olish"
                            >
                              {copiedUid === u.uid ? (
                                <Check size={12} className="text-emerald-500" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Profil holati */}
                        <td className="p-3">
                          {u.hasProfile ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                              <UserCheck size={12} /> To'ldirilgan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
                              <AlertCircle size={12} /> Chala
                            </span>
                          )}
                          {u.profile?.photos?.length > 0 && (
                            <span className="block text-[11px] text-gray-400 mt-0.5">
                              {u.profile.photos.length} ta rasm
                            </span>
                          )}
                        </td>

                        {/* Match & Shikoyat */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <span
                              className="flex items-center gap-1 text-gray-700 font-semibold"
                              title="Matchlar soni"
                            >
                              <Heart size={13} className="text-rose-500" />
                              {u.matchesCount}
                            </span>
                            <span
                              className={`flex items-center gap-1 font-semibold ${
                                u.reportsCount > 0
                                  ? "text-rose-600"
                                  : "text-gray-400"
                              }`}
                              title="Shikoyatlar soni"
                            >
                              <Flag size={13} />
                              {u.reportsCount}
                            </span>
                          </div>
                        </td>

                        {/* Faoliyat */}
                        <td className="p-3">
                          <span className="text-gray-600 block">
                            {formatTime(u.lastLoginAt || u.createdAt)}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            Ro'yxat: {formatTime(u.createdAt)}
                          </span>
                        </td>

                        {/* Amallar */}
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-600 transition-colors"
                            title="Batafsil ma'lumot"
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

            {/* Mobil qurilmalar uchun moslashuvchan Card ro'yxati */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentUsers.map((u) => {
                const isSuperAdmin =
                  u.email?.toLowerCase() === "luxaidevs@gmail.com";
                const isSelected = selectedUids.has(u.uid);

                return (
                  <div
                    key={u.uid}
                    onClick={() => handleOpenDetail(u)}
                    className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                      isSelected ? "bg-rose-50/40" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(u.uid)}
                            className="rounded accent-flame-start cursor-pointer"
                          />
                        </div>

                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                          {u.profile?.photos?.[0] ? (
                            <img
                              src={u.profile.photos[0]}
                              alt={u.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-gray-400 text-xs">
                              {u.displayName?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-gray-900 truncate">
                              {u.displayName || "Nomsiz"}
                            </h4>
                            {u.profile?.age && (
                              <span className="text-gray-500 text-xs font-normal">
                                , {u.profile.age}
                              </span>
                            )}
                            {isSuperAdmin && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                                Admin
                              </span>
                            )}
                            {u.isBot && (
                              <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded-full">
                                Bot
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 truncate">
                            {u.email || "Email yo'q"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {u.hasProfile ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Profil to'ldirilgan" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-400" title="Profil chala" />
                        )}
                        <Eye size={16} className="text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart size={12} className="text-rose-500" /> {u.matchesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flag size={12} className={u.reportsCount > 0 ? "text-rose-500" : "text-gray-400"} />{" "}
                          {u.reportsCount}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {formatTime(u.lastLoginAt || u.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredUsers.length} ta)
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

      {/* 4. USER DETAILS MODAL (AnjurXdating dizayn tizimida) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-xs"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/20 border-2 border-white flex-shrink-0 flex items-center justify-center shadow-sm">
                  {selectedUser.profile?.photos?.[0] ? (
                    <img
                      src={selectedUser.profile.photos[0]}
                      alt={selectedUser.displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-extrabold text-white text-xl">
                      {selectedUser.displayName?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>

                <div className="min-w-0 pr-8">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white truncate">
                      {selectedUser.displayName || "Nomsiz foydalanuvchi"}
                    </h3>
                    {selectedUser.profile?.age && (
                      <span className="text-white/80 text-sm">
                        {selectedUser.profile.age} yosh
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/85 truncate">
                    {selectedUser.email || "Email mavjud emas"}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto thin-scroll text-xs">
              {/* Account section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-flame-start" /> Hisob Ma'lumotlari (Account)
                </h4>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Firebase UID:</span>
                    <div className="flex items-center gap-1.5 font-mono text-gray-800">
                      <span className="truncate max-w-[200px]">{selectedUser.uid}</span>
                      <button
                        onClick={(e) => handleCopyUid(selectedUser.uid, e)}
                        className="text-gray-400 hover:text-flame-start"
                        title="Nusxa olish"
                      >
                        {copiedUid === selectedUser.uid ? (
                          <Check size={13} className="text-emerald-500" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Elektron pochta:</span>
                    <span className="font-medium text-gray-800">
                      {selectedUser.email || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Ro'yxatdan o'tgan sana:</span>
                    <span className="text-gray-700">
                      {formatTime(selectedUser.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Oxirgi login faoliyati:</span>
                    <span className="text-gray-700">
                      {formatTime(selectedUser.lastLoginAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-200/50">
                    <span className="text-gray-500">Holat (Status):</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {selectedUser.status === "active" ? "Faol" : selectedUser.status}
                      </span>
                      {selectedUser.isBot && (
                        <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                          Bot
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Details section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck size={14} className="text-flame-start" /> Profil Tafsilotlari (Profile)
                </h4>
                {selectedUser.profile ? (
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-400 block text-[10px]">Kasb / Mashg'ulot</span>
                        <span className="font-semibold text-gray-800">
                          {selectedUser.profile.job || "Ko'rsatilmagan"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[10px]">Masofa</span>
                        <span className="font-semibold text-gray-800">
                          {typeof selectedUser.profile.distanceKm === "number"
                            ? `${selectedUser.profile.distanceKm} km`
                            : "Ko'rsatilmagan"}
                        </span>
                      </div>
                    </div>

                    {selectedUser.profile.bio && (
                      <div>
                        <span className="text-gray-400 block text-[10px] mb-0.5">Bio (Haqida)</span>
                        <p className="p-2 rounded-lg bg-white border border-gray-100 text-gray-700 leading-relaxed italic">
                          "{selectedUser.profile.bio}"
                        </p>
                      </div>
                    )}

                    {/* Qiziqishlar */}
                    {selectedUser.profile.interests?.length > 0 && (
                      <div>
                        <span className="text-gray-400 block text-[10px] mb-1">Qiziqishlar</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedUser.profile.interests.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full bg-rose-50 text-flame-start font-medium text-[10px]"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rasmlar */}
                    {selectedUser.profile.photos?.length > 0 && (
                      <div>
                        <span className="text-gray-400 block text-[10px] mb-1.5">
                          Yuklangan rasmlar ({selectedUser.profile.photos.length} ta)
                        </span>
                        <div className="grid grid-cols-4 gap-2">
                          {selectedUser.profile.photos.map((src, idx) => (
                            <div
                              key={idx}
                              className="relative aspect-square rounded-xl overflow-hidden bg-gray-200 border border-gray-200 shadow-2xs"
                            >
                              <img
                                src={src}
                                alt={`Foto ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {idx === 0 && (
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 py-0.2 rounded font-medium">
                                  Asosiy
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-gray-400">
                    Ushbu foydalanuvchi hali profilini to'ldirmagan (Onboarding bosqichida).
                  </div>
                )}
              </div>

              {/* Activity Section */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Heart size={14} className="text-flame-start" /> Haqiqiy Faoliyat (Activity)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 block text-[11px]">Jami Matchlar</span>
                    <p className="text-xl font-black text-rose-500 mt-0.5">
                      {selectedUser.matchesCount} ta
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <span className="text-gray-500 block text-[11px]">Kelib tushgan shikoyatlar</span>
                    <p className={`text-xl font-black mt-0.5 ${selectedUser.reportsCount > 0 ? "text-rose-600" : "text-gray-700"}`}>
                      {selectedUser.reportsCount} ta
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Moderation Architecture & Note */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <FileText size={14} className="text-flame-start" /> Admin Eslatmasi & Tekshiruv
                  </h4>
                  <button
                    onClick={handleToggleVerified}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors flex items-center gap-1 ${
                      selectedUser.verified
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {selectedUser.verified ? "Tasdiqlangan" : "Tasdiqlanmagan"}
                  </button>
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Super Admin maxfiy eslatmasi (foydalanuvchiga ko'rinmaydi)..."
                    className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:border-flame-start transition-colors"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">
                      Amallar Firebase Audit Logida saqlanadi
                    </span>
                    <div className="flex items-center gap-2">
                      {noteSuccess && (
                        <span className="text-[11px] text-emerald-600 font-semibold animate-in fade-in">
                          Saqlandi!
                        </span>
                      )}
                      <button
                        onClick={handleSaveNote}
                        disabled={isSavingNote}
                        className="px-3 py-1.5 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isSavingNote ? "Saqlanmoqda..." : "Eslatmani saqlash"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedUser(null)}
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
