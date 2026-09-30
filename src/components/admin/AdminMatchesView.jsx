import { useState, useMemo, useEffect } from "react";
import {
  Heart,
  MessageCircle,
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
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  Bot,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Star,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import {
  logAdminAuditAction,
  getAdminMatchMessages,
} from "../../lib/admin";

export default function AdminMatchesView({
  matches = [],
  stats = { total: 0, today: 0, thisWeek: 0, thisMonth: 0, withChat: 0 },
  loading = false,
  error = null,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Chat Inspector Modal State
  const [chatMatch, setChatMatch] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Profile Preview Sub-modal State
  const [inspectedUserProfile, setInspectedUserProfile] = useState(null);

  // Filter & Search & Sort calculation
  const filteredMatches = useMemo(() => {
    let list = [...matches];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const idMatch = (m.id || "").toLowerCase().includes(q);
        const u1Name = (m.user1?.displayName || "").toLowerCase().includes(q);
        const u2Name = (m.user2?.displayName || "").toLowerCase().includes(q);
        const u1Username = (m.user1?.username || "").toLowerCase().includes(q);
        const u2Username = (m.user2?.username || "").toLowerCase().includes(q);
        const u1Uid = (m.user1?.uid || "").toLowerCase().includes(q);
        const u2Uid = (m.user2?.uid || "").toLowerCase().includes(q);
        const lastMsg = (m.lastMessage || "").toLowerCase().includes(q);

        return (
          idMatch ||
          u1Name ||
          u2Name ||
          u1Username ||
          u2Username ||
          u1Uid ||
          u2Uid ||
          lastMsg
        );
      });
    }

    // 2. Status Filter
    if (filterStatus === "active") {
      list = list.filter((m) => m.hasChat);
    } else if (filterStatus === "inactive") {
      list = list.filter((m) => !m.hasChat);
    } else if (filterStatus === "real") {
      list = list.filter((m) => !m.isBot);
    } else if (filterStatus === "bots") {
      list = list.filter((m) => m.isBot);
    }

    // 3. Sorting
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
      if (sortBy === "last_active") {
        const timeA =
          a.lastMessageAt?.toMillis?.() ||
          (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0) ||
          a.createdAt?.toMillis?.() ||
          0;
        const timeB =
          b.lastMessageAt?.toMillis?.() ||
          (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0) ||
          b.createdAt?.toMillis?.() ||
          0;
        return timeB - timeA;
      }
      return 0;
    });

    return list;
  }, [matches, searchQuery, filterStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredMatches.length / pageSize));
  const currentMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredMatches.slice(start, start + pageSize);
  }, [filteredMatches, currentPage, pageSize]);

  // Reset pagination on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus, sortBy, pageSize]);

  // Copy helper
  const handleCopy = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Detail Modal
  const handleOpenDetail = (match) => {
    setSelectedMatch(match);

    logAdminAuditAction({
      action: "VIEW_MATCH_DETAIL",
      targetUid: match.id,
      details: {
        users: match.users,
        isBot: match.isBot,
        hasChat: match.hasChat,
      },
    });
  };

  // Open Chat Inspector Modal
  const handleOpenChat = async (match, e) => {
    if (e) e.stopPropagation();
    setChatMatch(match);
    setChatLoading(true);
    setChatMessages([]);

    try {
      const messages = await getAdminMatchMessages(match.id);
      setChatMessages(messages);
    } catch (err) {
      console.error("Chat xabarlarini yuklashda xatolik:", err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. REAL STATISTIK KARTALAR */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Jami Matches */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Jami Mosliklar
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Heart size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-500">
              {loading ? "..." : stats.total}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Barcha o'zaro matchlar</p>
          </div>
        </div>

        {/* Bugungi Matches */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Bugungi
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600">
              {loading ? "..." : stats.today}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">So'nggi 24 soatda</p>
          </div>
        </div>

        {/* Shu haftadagi Matches */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Shu Haftada
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {loading ? "..." : stats.thisWeek}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Oxirgi 7 kun ichida</p>
          </div>
        </div>

        {/* Shu oydagi Matches */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Shu Oyda
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Star size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-purple-600">
              {loading ? "..." : stats.thisMonth}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Oxirgi 30 kun ichida</p>
          </div>
        </div>

        {/* Faol suhbatlar */}
        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-flame-start uppercase tracking-wider">
              Faol Suhbatlar
            </span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-flame-start flex items-center justify-center">
              <MessageCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-flame-start">
              {loading ? "..." : stats.withChat}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Xabar yozilganlar</p>
          </div>
        </div>
      </div>

      {/* 2. QIDIRUV VA FILTER PANELI */}
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
              placeholder="Match ID, ism, username, UID yoki xabar matni bo'yicha qidiruv..."
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
                <option value="all">Barcha mosliklar ({matches.length})</option>
                <option value="active">Faol suhbatlar (chat bor)</option>
                <option value="inactive">Suhbatsiz (chat yo'q)</option>
                <option value="real">Haqiqiy foydalanuvchilar</option>
                <option value="bots">Bot ishtirokidagi</option>
              </select>
              <Filter
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
                <option value="newest">Yangi mosliklar</option>
                <option value="oldest">Eski mosliklar</option>
                <option value="last_active">Oxirgi xabar vaqti bo'yicha</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Natijalar ko'rsatkichi va pagination tanlovi */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            <span>
              Topildi: <strong className="text-gray-800">{filteredMatches.length}</strong> ta moslik
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

      {/* 3. MATCHES RO'YXATI / JADVALI */}
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
        ) : filteredMatches.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-14 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <Heart size={26} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Mosliklar topilmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Hozircha tizimda mosliklar qayd etilmagan yoki qidiruv parametrlari bo'yicha natija chiqmadi.
            </p>
            {(searchQuery || filterStatus !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
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
                    <th className="p-3">Match ID</th>
                    <th className="p-3">User 1 (Tashabbuskor)</th>
                    <th className="p-3">User 2 (Qabul qiluvchi)</th>
                    <th className="p-3">Holat & Chat</th>
                    <th className="p-3">Moslik sanasi</th>
                    <th className="p-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentMatches.map((m) => (
                    <tr
                      key={m.id}
                      onClick={() => handleOpenDetail(m)}
                      className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                    >
                      {/* Match ID */}
                      <td className="p-3 font-mono text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[100px]" title={m.id}>
                            {m.id.slice(0, 8)}...
                          </span>
                          <button
                            onClick={(e) => handleCopy(m.id, e)}
                            className="text-gray-400 hover:text-flame-start"
                            title="Match ID dan nusxa olish"
                          >
                            {copiedId === m.id ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* User 1 */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                            {m.user1.avatar ? (
                              <img
                                src={m.user1.avatar}
                                alt={m.user1.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-gray-400 text-xs">
                                {m.user1.displayName?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-gray-900 truncate">
                                {m.user1.displayName}
                              </span>
                              {m.user1.age && (
                                <span className="text-gray-400">, {m.user1.age}</span>
                              )}
                              {m.user1.isBot && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1 rounded">
                                  Bot
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 truncate block font-mono">
                              {m.user1.uid?.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* User 2 */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-rose-50 overflow-hidden flex-shrink-0 flex items-center justify-center border border-rose-200">
                            {m.user2.avatar ? (
                              <img
                                src={m.user2.avatar}
                                alt={m.user2.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-bold text-flame-start text-xs">
                                {m.user2.displayName?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-rose-950 truncate">
                                {m.user2.displayName}
                              </span>
                              {m.user2.age && (
                                <span className="text-gray-400">, {m.user2.age}</span>
                              )}
                              {m.user2.isBot && (
                                <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1 rounded">
                                  Bot
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 truncate block font-mono">
                              {m.user2.uid?.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Holat & Chat */}
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            {m.hasChat ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                                <MessageCircle size={10} /> Faol suhbat
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium text-[10px] border border-gray-200">
                                Xabarsiz
                              </span>
                            )}
                            {m.isBot && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[10px]">
                                <Bot size={10} /> Bot
                              </span>
                            )}
                          </div>
                          {m.lastMessage && (
                            <span className="text-[11px] text-gray-500 truncate max-w-[180px] block italic">
                              "{m.lastMessage}"
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Moslik sanasi */}
                      <td className="p-3 text-gray-600 text-[11px]">
                        <span>{formatTime(m.createdAt)}</span>
                        {m.lastMessageAt && (
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            Oxirgi xabar: {formatTime(m.lastMessageAt)}
                          </span>
                        )}
                      </td>

                      {/* Amallar */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {m.hasChat && (
                            <button
                              onClick={(e) => handleOpenChat(m, e)}
                              className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-flame-start font-semibold text-[11px] transition-colors flex items-center gap-1"
                              title="Chat xabarlarini ko'rish"
                            >
                              <MessageCircle size={12} /> Chat
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenDetail(m)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-600 transition-colors"
                            title="Batafsil ko'rish"
                          >
                            <Eye size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Kartalar ko'rinishi */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentMatches.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleOpenDetail(m)}
                  className="p-3.5 space-y-2.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Header: ID va holat */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-400">
                      #{m.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {m.hasChat ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Faol suhbat
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px]">
                          Xabarsiz
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ikki foydalanuvchi bog'lanishi (Dating Match Style) */}
                  <div className="flex items-center justify-between bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100">
                    {/* User 1 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0 flex items-center justify-center">
                        {m.user1.avatar ? (
                          <img
                            src={m.user1.avatar}
                            alt={m.user1.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {m.user1.displayName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {m.user1.uid?.slice(0, 6)}...
                        </p>
                      </div>
                    </div>

                    {/* Markaziy Heart */}
                    <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0 mx-2 shadow-2xs">
                      <Heart size={14} className="fill-rose-500" />
                    </div>

                    {/* User 2 */}
                    <div className="flex items-center gap-2 min-w-0 flex-1 justify-end text-right">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {m.user2.displayName}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">
                          {m.user2.uid?.slice(0, 6)}...
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-rose-100 border border-rose-200 flex-shrink-0 flex items-center justify-center">
                        {m.user2.avatar ? (
                          <img
                            src={m.user2.avatar}
                            alt={m.user2.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-rose-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {m.lastMessage && (
                    <p className="text-[11px] text-gray-600 italic bg-white p-2 rounded-xl border border-gray-100 truncate">
                      "{m.lastMessage}"
                    </p>
                  )}

                  {/* Pastki qism */}
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                    <span>{formatTime(m.createdAt)}</span>
                    <div className="flex items-center gap-2">
                      {m.hasChat && (
                        <button
                          onClick={(e) => handleOpenChat(m, e)}
                          className="text-flame-start font-semibold hover:underline"
                        >
                          Chat →
                        </button>
                      )}
                      <span className="text-gray-600 font-semibold">Tafsilotlar →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredMatches.length} ta)
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

      {/* 4. MATCH DETAIL MODAL */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setSelectedMatch(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-xs"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1">
                  <Heart size={12} className="fill-white" /> Moslik #{selectedMatch.id.slice(0, 8)}
                </span>
                {selectedMatch.hasChat ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/80 font-semibold">
                    Faol suhbat
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/20 font-semibold">
                    Suhbat boshlanmagan
                  </span>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-white">
                {selectedMatch.user1.displayName} & {selectedMatch.user2.displayName}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Mos kelgan vaqti: {formatTime(selectedMatch.createdAt)}
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto thin-scroll text-xs">
              {/* Match ID Info */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                    Firebase Match ID
                  </span>
                  <span className="font-mono text-gray-800 text-xs font-medium">
                    {selectedMatch.id}
                  </span>
                </div>
                <button
                  onClick={(e) => handleCopy(selectedMatch.id, e)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:text-flame-start flex items-center gap-1 font-semibold"
                >
                  {copiedId === selectedMatch.id ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>Nusxa</span>
                </button>
              </div>

              {/* Side-by-Side Foydalanuvchilar kartasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* USER 1 */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Foydalanuvchi 1
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border-2 border-white shadow-xs flex-shrink-0 flex items-center justify-center">
                        {selectedMatch.user1.avatar ? (
                          <img
                            src={selectedMatch.user1.avatar}
                            alt={selectedMatch.user1.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {selectedMatch.user1.displayName}
                          {selectedMatch.user1.age ? `, ${selectedMatch.user1.age}` : ""}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {selectedMatch.user1.job || "Kasb ko'rsatilmagan"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1 text-[11px] text-gray-600">
                      <p className="truncate">
                        <span className="text-gray-400">Email:</span>{" "}
                        {selectedMatch.user1.email || "Mavjud emas"}
                      </p>
                      <p className="font-mono truncate">
                        <span className="text-gray-400">UID:</span>{" "}
                        {selectedMatch.user1.uid}
                      </p>
                    </div>

                    {selectedMatch.user1.bio && (
                      <p className="mt-2 p-2 rounded-xl bg-white border border-gray-100 text-[11px] text-gray-700 italic">
                        "{selectedMatch.user1.bio}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setInspectedUserProfile(selectedMatch.user1)}
                    className="w-full mt-2 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-colors flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Eye size={12} /> Profilni to'liq ko'rish
                  </button>
                </div>

                {/* USER 2 */}
                <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2.5 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block mb-2">
                      Foydalanuvchi 2
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-rose-100 border-2 border-white shadow-xs flex-shrink-0 flex items-center justify-center">
                        {selectedMatch.user2.avatar ? (
                          <img
                            src={selectedMatch.user2.avatar}
                            alt={selectedMatch.user2.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-rose-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {selectedMatch.user2.displayName}
                          {selectedMatch.user2.age ? `, ${selectedMatch.user2.age}` : ""}
                        </h4>
                        <p className="text-[11px] text-gray-500 truncate">
                          {selectedMatch.user2.job || "Kasb ko'rsatilmagan"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1 text-[11px] text-gray-600">
                      <p className="truncate">
                        <span className="text-gray-400">Email:</span>{" "}
                        {selectedMatch.user2.email || "Mavjud emas"}
                      </p>
                      <p className="font-mono truncate">
                        <span className="text-gray-400">UID:</span>{" "}
                        {selectedMatch.user2.uid}
                      </p>
                    </div>

                    {selectedMatch.user2.bio && (
                      <p className="mt-2 p-2 rounded-xl bg-white border border-rose-100 text-[11px] text-gray-700 italic">
                        "{selectedMatch.user2.bio}"
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setInspectedUserProfile(selectedMatch.user2)}
                    className="w-full mt-2 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-800 font-semibold transition-colors flex items-center justify-center gap-1 text-[11px]"
                  >
                    <Eye size={12} /> Profilni to'liq ko'rish
                  </button>
                </div>
              </div>

              {/* Chat Inspector Harakati */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">
                    Suhbat Tarixi (Chat)
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    {selectedMatch.hasChat
                      ? `Oxirgi xabar: "${selectedMatch.lastMessage}"`
                      : "Foydalanuvchilar o'rtasida hali xabar almashilmagan"}
                  </p>
                </div>

                <button
                  onClick={(e) => handleOpenChat(selectedMatch, e)}
                  disabled={!selectedMatch.hasChat}
                  className="px-3.5 py-1.5 rounded-xl flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-1.5"
                >
                  <MessageCircle size={14} /> Suhbatni ko'rish
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedMatch(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CHAT INSPECTOR MODAL */}
      {chatMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[650px] max-h-[85vh]">
            {/* Chat Header */}
            <div className="flame-bg p-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-200">
                    {chatMatch.user1.avatar ? (
                      <img
                        src={chatMatch.user1.avatar}
                        alt={chatMatch.user1.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                        {chatMatch.user1.displayName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-rose-200">
                    {chatMatch.user2.avatar ? (
                      <img
                        src={chatMatch.user2.avatar}
                        alt={chatMatch.user2.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-700">
                        {chatMatch.user2.displayName?.[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">
                    {chatMatch.user1.displayName} & {chatMatch.user2.displayName}
                  </h4>
                  <p className="text-[10px] text-white/80">
                    Admin Chat Nazorati
                  </p>
                </div>
              </div>

              <button
                onClick={() => setChatMatch(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
              {chatLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-flame-start border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 text-xs">Xabarlar yuklanmoqda...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-1">
                  <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">Xabarlar mavjud emas</p>
                  <p className="text-[11px]">Ushbu matchda xabarlar almashilmagan</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isUser1 = msg.senderUid === chatMatch.user1.uid;
                  const sender = isUser1 ? chatMatch.user1 : chatMatch.user2;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${
                        isUser1 ? "justify-start" : "justify-end"
                      }`}
                    >
                      {isUser1 && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-gray-300 flex-shrink-0 flex items-center justify-center">
                          {sender.avatar ? (
                            <img
                              src={sender.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-bold">
                              {sender.displayName?.[0]}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[75%] p-2.5 rounded-2xl shadow-2xs ${
                          isUser1
                            ? "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                            : "flame-bg text-white rounded-br-none"
                        }`}
                      >
                        <p className="text-[10px] font-bold opacity-75 mb-0.5">
                          {sender.displayName}
                        </p>
                        <p className="text-xs leading-relaxed break-words">
                          {msg.text}
                        </p>
                        <span
                          className={`text-[9px] block text-right mt-1 ${
                            isUser1 ? "text-gray-400" : "text-white/80"
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>

                      {!isUser1 && (
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-rose-200 border border-rose-300 flex-shrink-0 flex items-center justify-center">
                          {sender.avatar ? (
                            <img
                              src={sender.avatar}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-bold text-rose-800">
                              {sender.displayName?.[0]}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Footer */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck size={13} className="text-flame-start" /> Read-only nazorat
              </span>
              <button
                onClick={() => setChatMatch(null)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. USER PROFILE SUB-MODAL */}
      {inspectedUserProfile && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setInspectedUserProfile(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-4/5 w-full bg-gray-900 overflow-hidden">
              {inspectedUserProfile.photos?.[0] || inspectedUserProfile.avatar ? (
                <img
                  src={inspectedUserProfile.photos?.[0] || inspectedUserProfile.avatar}
                  alt={inspectedUserProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center flame-bg text-white">
                  <span className="font-extrabold text-5xl">
                    {inspectedUserProfile.displayName?.[0]?.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-bold">
                  {inspectedUserProfile.displayName}
                  {inspectedUserProfile.age ? `, ${inspectedUserProfile.age}` : ""}
                </h3>
                {inspectedUserProfile.job && (
                  <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
                    <Briefcase size={12} /> {inspectedUserProfile.job}
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {inspectedUserProfile.bio && (
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold mb-1">
                    Bio
                  </span>
                  <p className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 italic">
                    "{inspectedUserProfile.bio}"
                  </p>
                </div>
              )}

              <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1 font-mono text-[11px] text-gray-600">
                <p className="truncate">UID: {inspectedUserProfile.uid}</p>
                {inspectedUserProfile.email && (
                  <p className="font-sans truncate">Email: {inspectedUserProfile.email}</p>
                )}
              </div>

              <button
                onClick={() => setInspectedUserProfile(null)}
                className="w-full py-2 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Orqaga qaytish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
