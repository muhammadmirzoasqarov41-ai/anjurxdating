import { useState, useMemo, useEffect } from "react";
import {
  MessageCircle,
  MessageSquare,
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
  Clock,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Activity,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import { getAdminMatchMessages, logAdminAuditAction } from "../../lib/admin";

export default function AdminChatsView({
  conversations = [],
  stats = {
    totalConversations: 0,
    activeConversations: 0,
    todayConversations: 0,
    inactiveConversations: 0,
  },
  loading = false,
  error = null,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest_activity");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Selected chat inspector
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Search & Filter & Sort processing
  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const idMatch = (c.id || "").toLowerCase().includes(q);
        const u1Name = (c.user1?.displayName || "").toLowerCase().includes(q);
        const u2Name = (c.user2?.displayName || "").toLowerCase().includes(q);
        const u1Username = (c.user1?.username || "").toLowerCase().includes(q);
        const u2Username = (c.user2?.username || "").toLowerCase().includes(q);
        const u1Uid = (c.user1?.uid || "").toLowerCase().includes(q);
        const u2Uid = (c.user2?.uid || "").toLowerCase().includes(q);
        const lastMsg = (c.lastMessage || "").toLowerCase().includes(q);

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
      list = list.filter((c) => c.hasChat);
    } else if (filterStatus === "inactive") {
      list = list.filter((c) => !c.hasChat);
    } else if (filterStatus === "real") {
      list = list.filter((c) => !c.isBot);
    } else if (filterStatus === "bots") {
      list = list.filter((c) => c.isBot);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest_activity") {
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
      if (sortBy === "oldest_activity") {
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
        return timeA - timeB;
      }
      if (sortBy === "created_newest") {
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
      return 0;
    });

    return list;
  }, [conversations, searchQuery, filterStatus, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(
    1,
    Math.ceil(filteredConversations.length / pageSize)
  );
  const currentConversations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredConversations.slice(start, start + pageSize);
  }, [filteredConversations, currentPage, pageSize]);

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

  // Open Chat Inspector
  const handleOpenInspector = async (chat) => {
    setActiveChat(chat);
    setMessagesLoading(true);
    setMessages([]);

    try {
      const msgs = await getAdminMatchMessages(chat.id);
      setMessages(msgs);

      logAdminAuditAction({
        action: "VIEW_ADMIN_CHAT",
        targetUid: chat.id,
        details: { users: chat.users, messageCount: msgs.length },
      });
    } catch (err) {
      console.error("Chat xabarlarini yuklashda xatolik:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. STATISTIK KARTALAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Jami Suhbatlar */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Jami Kanallar
            </span>
            <div className="w-7 h-7 rounded-xl bg-orange-50 text-flame-start flex items-center justify-center">
              <MessageCircle size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">
              {loading ? "..." : stats.totalConversations}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Mavjud chat yo'laklari</p>
          </div>
        </div>

        {/* Faol Suhbatlar */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Faol Suhbatlar
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">
              {loading ? "..." : stats.activeConversations}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Xabar yozilganlar</p>
          </div>
        </div>

        {/* Bugungi Suhbatlar */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              Bugungi Faollik
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-blue-600">
              {loading ? "..." : stats.todayConversations}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">So'nggi 24 soatda yangilangan</p>
          </div>
        </div>

        {/* Xabarsiz / Yangi */}
        <div className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Xabarsiz
            </span>
            <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center">
              <Clock size={14} />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-600">
              {loading ? "..." : stats.inactiveConversations}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Hali yozishilmagan</p>
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
              placeholder="Ism, username, UID, kanal ID yoki xabar matni bo'yicha qidiruv..."
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
                <option value="all">Barcha suhbatlar ({conversations.length})</option>
                <option value="active">Faol (xabar almashilgan)</option>
                <option value="inactive">Xabarsiz kanallar</option>
                <option value="real">Haqiqiy insonlar</option>
                <option value="bots">Bot suhbatlari</option>
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
                <option value="newest_activity">Oxirgi faollik bo'yicha</option>
                <option value="oldest_activity">Eski faollik bo'yicha</option>
                <option value="created_newest">Yaratilgan vaqti (yangi)</option>
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
              Topildi: <strong className="text-gray-800">{filteredConversations.length}</strong> ta suhbat
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

      {/* 3. CONVERSATIONS RO'YXATI */}
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
        ) : filteredConversations.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="w-14 h-14 rounded-full bg-orange-50 text-flame-start flex items-center justify-center mx-auto mb-3 border border-orange-100">
              <MessageSquare size={26} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Suhbatlar topilmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Hozircha tizimda suhbat xabarlari mavjud emas yoki qidiruv natija bermadi.
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
            {/* Desktop Jadval */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-3">Kanal ID</th>
                    <th className="p-3">Suhbatdoshlar</th>
                    <th className="p-3">Oxirgi xabar</th>
                    <th className="p-3">Holat</th>
                    <th className="p-3">So'nggi faollik</th>
                    <th className="p-3 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentConversations.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => handleOpenInspector(c)}
                      className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                    >
                      {/* ID */}
                      <td className="p-3 font-mono text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[100px]" title={c.id}>
                            {c.id.slice(0, 8)}...
                          </span>
                          <button
                            onClick={(e) => handleCopy(c.id, e)}
                            className="text-gray-400 hover:text-flame-start"
                            title="Nusxa olish"
                          >
                            {copiedId === c.id ? (
                              <Check size={12} className="text-emerald-500" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Suhbatdoshlar */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-200 flex-shrink-0 flex items-center justify-center">
                              {c.user1.avatar ? (
                                <img
                                  src={c.user1.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={12} className="text-gray-500" />
                              )}
                            </div>
                            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-rose-100 flex-shrink-0 flex items-center justify-center">
                              {c.user2.avatar ? (
                                <img
                                  src={c.user2.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={12} className="text-rose-500" />
                              )}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">
                              {c.user1.displayName} & {c.user2.displayName}
                            </p>
                            <span className="text-[10px] text-gray-400 truncate block">
                              {c.isBot ? "Bot suhbati" : "Haqiqiy suhbat"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Oxirgi xabar */}
                      <td className="p-3">
                        {c.lastMessage ? (
                          <span className="text-gray-700 truncate max-w-[200px] block font-medium">
                            "{c.lastMessage}"
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            Xabarlar yo'q
                          </span>
                        )}
                      </td>

                      {/* Holat */}
                      <td className="p-3">
                        {c.hasChat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                            Faol suhbat
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium text-[10px]">
                            Xabarsiz
                          </span>
                        )}
                      </td>

                      {/* So'nggi faollik */}
                      <td className="p-3 text-gray-500 text-[11px]">
                        {formatTime(c.lastMessageAt || c.createdAt)}
                      </td>

                      {/* Amal */}
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleOpenInspector(c)}
                          className="px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-flame-start font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Ko'rish
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Kartalar */}
            <div className="md:hidden divide-y divide-gray-100">
              {currentConversations.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleOpenInspector(c)}
                  className="p-3.5 space-y-2 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-400">
                      #{c.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        c.hasChat
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.hasChat ? "Faol suhbat" : "Xabarsiz"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex -space-x-2">
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-gray-200">
                        {c.user1.avatar ? (
                          <img
                            src={c.user1.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                            {c.user1.displayName?.[0]}
                          </div>
                        )}
                      </div>
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-rose-200">
                        {c.user2.avatar ? (
                          <img
                            src={c.user2.avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-rose-700">
                            {c.user2.displayName?.[0]}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {c.user1.displayName} & {c.user2.displayName}
                      </p>
                      {c.lastMessage ? (
                        <p className="text-[11px] text-gray-600 truncate italic">
                          "{c.lastMessage}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          Xabarlar yo'q
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                    <span>{formatTime(c.lastMessageAt || c.createdAt)}</span>
                    <span className="text-flame-start font-semibold">Suhbatni ochish →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredConversations.length} ta)
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

      {/* 4. CHAT INSPECTOR MODAL */}
      {activeChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col h-[650px] max-h-[85vh]">
            {/* Header */}
            <div className="flame-bg p-4 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-gray-200">
                    {activeChat.user1.avatar ? (
                      <img
                        src={activeChat.user1.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                        {activeChat.user1.displayName?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-rose-200">
                    {activeChat.user2.avatar ? (
                      <img
                        src={activeChat.user2.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-rose-700">
                        {activeChat.user2.displayName?.[0]}
                      </div>
                    )}
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">
                    {activeChat.user1.displayName} & {activeChat.user2.displayName}
                  </h4>
                  <p className="text-[10px] text-white/80">
                    Kanal ID: {activeChat.id.slice(0, 10)}...
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveChat(null)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/50 text-xs">
              {messagesLoading ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-8 h-8 border-2 border-flame-start border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-gray-400 text-xs">Xabarlar yuklanmoqda...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16 text-center text-gray-400 space-y-1">
                  <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">Xabarlar mavjud emas</p>
                  <p className="text-[11px]">Ushbu suhbat kanalida hali xabarlar yozilmagan</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser1 = msg.senderUid === activeChat.user1.uid;
                  const sender = isUser1 ? activeChat.user1 : activeChat.user2;

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

            {/* Footer */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck size={13} className="text-flame-start" /> Read-only Super Admin nazorati
              </span>
              <button
                onClick={() => setActiveChat(null)}
                className="px-3.5 py-1.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
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
