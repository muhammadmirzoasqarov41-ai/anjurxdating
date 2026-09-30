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
  Calendar,
  Clock,
  UserCheck,
  AlertCircle,
  Bot,
  X,
  LayoutGrid,
  List,
  Image as ImageIcon,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Heart,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import { logAdminAuditAction } from "../../lib/admin";

export default function AdminProfilesView({
  profiles = [],
  loading = false,
  onRefresh,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  // Selected profile for deep preview modal
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [copiedUid, setCopiedUid] = useState(null);

  // Search & Filter & Sort calculation
  const filteredProfiles = useMemo(() => {
    let list = [...profiles];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => {
        const nameMatch = (p.displayName || "").toLowerCase().includes(q);
        const usernameMatch = (p.username || "").toLowerCase().includes(q);
        const uidMatch = (p.uid || "").toLowerCase().includes(q);
        const emailMatch = (p.userEmail || "").toLowerCase().includes(q);
        const jobMatch = (p.job || "").toLowerCase().includes(q);
        const bioMatch = (p.bio || "").toLowerCase().includes(q);
        return (
          nameMatch ||
          usernameMatch ||
          uidMatch ||
          emailMatch ||
          jobMatch ||
          bioMatch
        );
      });
    }

    // 2. Filter
    if (filterType === "complete") {
      list = list.filter((p) => p.isComplete);
    } else if (filterType === "incomplete") {
      list = list.filter((p) => !p.isComplete);
    } else if (filterType === "has_photos") {
      list = list.filter((p) => p.photos && p.photos.length > 0);
    } else if (filterType === "multi_photos") {
      list = list.filter((p) => p.photos && p.photos.length > 1);
    } else if (filterType === "recently_updated") {
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((p) => {
        const time =
          p.updatedAt?.toMillis?.() ||
          (p.updatedAt?.seconds ? p.updatedAt.seconds * 1000 : 0) ||
          0;
        return time > oneWeekAgo;
      });
    } else if (filterType === "real") {
      list = list.filter((p) => !p.isBot);
    } else if (filterType === "bots") {
      list = list.filter((p) => p.isBot);
    }

    // 3. Sorting
    list.sort((a, b) => {
      if (sortBy === "newest") {
        const timeA =
          a.createdAt?.toMillis?.() ||
          (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0) ||
          a.updatedAt?.toMillis?.() ||
          0;
        const timeB =
          b.createdAt?.toMillis?.() ||
          (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0) ||
          b.updatedAt?.toMillis?.() ||
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
      if (sortBy === "recently_updated") {
        const timeA =
          a.updatedAt?.toMillis?.() ||
          (a.updatedAt?.seconds ? a.updatedAt.seconds * 1000 : 0) ||
          0;
        const timeB =
          b.updatedAt?.toMillis?.() ||
          (b.updatedAt?.seconds ? b.updatedAt.seconds * 1000 : 0) ||
          0;
        return timeB - timeA;
      }
      if (sortBy === "photos_count") {
        return (b.photos?.length || 0) - (a.photos?.length || 0);
      }
      return 0;
    });

    return list;
  }, [profiles, searchQuery, filterType, sortBy]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const currentProfiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProfiles.slice(start, start + pageSize);
  }, [filteredProfiles, currentPage, pageSize]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, sortBy, pageSize]);

  // Copy UID
  const handleCopyUid = (uid, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  // Open Preview Modal
  const handleOpenPreview = (p) => {
    setSelectedProfile(p);
    setActivePhotoIdx(0);

    // Audit log
    logAdminAuditAction({
      action: "VIEW_PROFILE_PREVIEW",
      targetUid: p.uid,
      targetEmail: p.userEmail,
      details: {
        displayName: p.displayName,
        photosCount: p.photos?.length || 0,
        isBot: p.isBot,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* 1. Qidiruv, Filter va Boshqaruv paneli */}
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
              placeholder="Ism, username, email, UID yoki kasb bo'yicha qidiruv..."
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

          {/* Filter & Sort & View toggle */}
          <div className="flex items-center gap-2">
            {/* Filter select */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="all">Barcha profillar ({profiles.length})</option>
                <option value="complete">To'liq profillar</option>
                <option value="incomplete">Chala anketalar</option>
                <option value="has_photos">Rasmli profillar</option>
                <option value="multi_photos">Ko'p rasmli (2+)</option>
                <option value="recently_updated">Yaqinda yangilangan</option>
                <option value="real">Haqiqiy insonlar</option>
                <option value="bots">Botlar</option>
              </select>
              <Filter
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Sort select */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none pl-8 pr-7 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-700 outline-none focus:border-flame-start cursor-pointer transition-colors"
              >
                <option value="newest">Yangi profillar</option>
                <option value="oldest">Eski profillar</option>
                <option value="name_asc">Ism (A-Z)</option>
                <option value="name_desc">Ism (Z-A)</option>
                <option value="recently_updated">Oxirgi yangilangan</option>
                <option value="photos_count">Rasmlar soni bo'yicha</option>
              </select>
              <ArrowUpDown
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-flame-start shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                title="Karta ko'rinishi"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-white text-flame-start shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
                title="Jadval ko'rinishi"
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Natijalar ko'rsatkichi va Pagination tanlovi */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <div>
            <span>
              Jami profillar: <strong className="text-gray-800">{filteredProfiles.length}</strong> ta
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

      {/* 2. Profillar ro'yxati (Grid yoki Table) */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden border border-gray-100/60 p-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-gray-50 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <ImageIcon size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Profillar topilmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Qidiruv shartlarini o'zgartiring yoki filtrlarni tozalang.
            </p>
            {(searchQuery || filterType !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("all");
                }}
                className="mt-3 px-3 py-1.5 rounded-full flame-bg text-white text-xs font-semibold"
              >
                Filtrlarni tozalash
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          /* ANJURXDATING CARD GRID KO'RINISHI */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentProfiles.map((p) => {
              const photoUrl = p.photos?.[0];

              return (
                <div
                  key={p.uid}
                  onClick={() => handleOpenPreview(p)}
                  className="group relative rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-xs hover:shadow-card transition-all cursor-pointer flex flex-col justify-between"
                >
                  {/* Foto qismi */}
                  <div className="relative aspect-4/3 w-full bg-gray-100 overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={p.displayName}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full items-center justify-center bg-gradient-to-br from-rose-50 to-orange-50 text-flame-start ${
                        photoUrl ? "hidden" : "flex"
                      }`}
                    >
                      <span className="font-extrabold text-3xl">
                        {p.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>

                    {/* Rasmlar soni nishoni */}
                    {p.photos?.length > 0 && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs flex items-center gap-1">
                        <ImageIcon size={11} /> {p.photos.length}
                      </span>
                    )}

                    {/* Bot / Admin / Holat nishonlari */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {p.isBot && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-600/90 text-white text-[10px] font-bold shadow-xs flex items-center gap-0.5">
                          <Bot size={11} /> Bot
                        </span>
                      )}
                      {p.isComplete ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold shadow-xs">
                          To'liq
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/90 text-white text-[10px] font-bold shadow-xs">
                          Chala
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Profil ma'lumotlari */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-gray-900 truncate">
                          {p.displayName || "Nomsiz"}
                          {p.age ? `, ${p.age}` : ""}
                        </h4>
                        {typeof p.distanceKm === "number" && (
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                            <MapPin size={11} /> {p.distanceKm} km
                          </span>
                        )}
                      </div>

                      {p.job && (
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                          <Briefcase size={12} className="text-gray-400" /> {p.job}
                        </p>
                      )}

                      {p.bio ? (
                        <p className="text-[11px] text-gray-600 line-clamp-2 mt-1.5 italic">
                          "{p.bio}"
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 mt-1.5 italic">
                          Bio kiritilmagan
                        </p>
                      )}
                    </div>

                    {/* Footer: User Email & Actions */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span className="truncate max-w-[150px]">
                        {p.userEmail || "Email yo'q"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPreview(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-700 font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye size={12} /> Ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* JADVAL (TABLE) KO'RINISHI */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3">Profil</th>
                  <th className="p-3">Bog'langan hisob</th>
                  <th className="p-3">Kasb & Masofa</th>
                  <th className="p-3">Rasmlar</th>
                  <th className="p-3">Holat</th>
                  <th className="p-3">Yangilangan</th>
                  <th className="p-3 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentProfiles.map((p) => (
                  <tr
                    key={p.uid}
                    onClick={() => handleOpenPreview(p)}
                    className="hover:bg-rose-50/20 transition-colors cursor-pointer"
                  >
                    {/* Profil fotosi va ismi */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                          {p.photos?.[0] ? (
                            <img
                              src={p.photos[0]}
                              alt={p.displayName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-bold text-gray-400 text-xs">
                              {p.displayName?.[0]?.toUpperCase() || "U"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-gray-900 truncate block">
                            {p.displayName || "Nomsiz"}
                            {p.age ? `, ${p.age}` : ""}
                          </span>
                          {p.username && (
                            <span className="text-[10px] text-gray-400 block">
                              @{p.username}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bog'langan hisob */}
                    <td className="p-3">
                      <p className="font-medium text-gray-700 truncate max-w-[160px]">
                        {p.userEmail || <span className="text-gray-400 italic">Mavjud emas</span>}
                      </p>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5 font-mono">
                        <span className="truncate max-w-[120px]" title={p.uid}>
                          {p.uid}
                        </span>
                        <button
                          onClick={(e) => handleCopyUid(p.uid, e)}
                          className="text-gray-400 hover:text-flame-start transition-colors"
                          title="UID dan nusxa olish"
                        >
                          {copiedUid === p.uid ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Kasb & Masofa */}
                    <td className="p-3 text-gray-600">
                      <span className="block truncate max-w-[140px]">
                        {p.job || "—"}
                      </span>
                      {typeof p.distanceKm === "number" && (
                        <span className="text-[10px] text-gray-400 block">
                          {p.distanceKm} km
                        </span>
                      )}
                    </td>

                    {/* Rasmlar soni */}
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold text-[11px]">
                        <ImageIcon size={11} /> {p.photos?.length || 0} ta
                      </span>
                    </td>

                    {/* Holat */}
                    <td className="p-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {p.isComplete ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                            To'liq
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
                            Chala
                          </span>
                        )}
                        {p.isBot && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
                            Bot
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Yangilangan */}
                    <td className="p-3 text-gray-500 text-[11px]">
                      {formatTime(p.updatedAt || p.createdAt)}
                    </td>

                    {/* Amallar */}
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenPreview(p)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 hover:text-flame-start text-gray-600 transition-colors"
                        title="Batafsil preview"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {filteredProfiles.length > 0 && (
          <div className="p-3 mt-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Sahifa <strong>{currentPage}</strong> / {totalPages} (jami {filteredProfiles.length} ta profil)
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
        )}
      </div>

      {/* 3. PROFIL PREVIEW MODAL (AnjurXdating Native Format) */}
      {selectedProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal yopish tugmasi */}
            <button
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-xs"
            >
              <X size={18} />
            </button>

            {/* Rasm Karusel / Prevyu qismi */}
            <div className="relative aspect-3/4 w-full bg-gray-900 overflow-hidden">
              {selectedProfile.photos?.[activePhotoIdx] ? (
                <img
                  src={selectedProfile.photos[activePhotoIdx]}
                  alt={selectedProfile.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center flame-bg text-white">
                  <span className="font-extrabold text-5xl">
                    {selectedProfile.displayName?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="text-xs text-white/80 mt-2">Rasm yuklanmagan</span>
                </div>
              )}

              {/* Rasm indikatori chiziqlari (Tinder style) */}
              {selectedProfile.photos?.length > 1 && (
                <div className="absolute top-3 left-3 right-14 flex items-center gap-1.5 z-10">
                  {selectedProfile.photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIdx(idx)}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        idx === activePhotoIdx ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Rasm ustidagi gradient qorong'ulatish */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

              {/* Rasm ustidagi asosiy ma'lumotlar */}
              <div className="absolute bottom-4 left-4 right-4 text-white z-10">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-black drop-shadow-sm">
                    {selectedProfile.displayName}
                    {selectedProfile.age ? `, ${selectedProfile.age}` : ""}
                  </h3>
                  {selectedProfile.isBot && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                      Bot
                    </span>
                  )}
                  {selectedProfile.isComplete ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      To'liq
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                      Chala
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-white/90 mt-1 font-medium">
                  {selectedProfile.job && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} /> {selectedProfile.job}
                    </span>
                  )}
                  {typeof selectedProfile.distanceKm === "number" && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {selectedProfile.distanceKm} km uzoqlikda
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Barcha rasmlar miniatyurasi (Thumbnails) */}
            {selectedProfile.photos?.length > 1 && (
              <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 overflow-x-auto thin-scroll">
                {selectedProfile.photos.map((src, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative w-12 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      idx === activePhotoIdx
                        ? "border-flame-start shadow-xs scale-105"
                        : "border-gray-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Profil tafsilotlari (Pastki qism) */}
            <div className="p-5 space-y-4 max-h-[45vh] overflow-y-auto thin-scroll text-xs">
              {/* Bio */}
              {selectedProfile.bio ? (
                <div className="space-y-1">
                  <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                    Bio (O'zi haqida)
                  </span>
                  <p className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-800 leading-relaxed text-xs">
                    {selectedProfile.bio}
                  </p>
                </div>
              ) : null}

              {/* Qiziqishlar (Interests) */}
              {selectedProfile.interests?.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">
                    Qiziqishlar
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProfile.interests.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-full bg-rose-50 text-flame-start font-semibold text-[11px]"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bog'langan Firebase User Hisobi */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-flame-start" /> Bog'langan Foydalanuvchi Hisobi
                </span>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Elektron pochta:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedProfile.userEmail || "Mavjud emas"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-gray-600 font-mono">
                  <span>Firebase UID:</span>
                  <div className="flex items-center gap-1.5 text-gray-800">
                    <span className="truncate max-w-[180px]">{selectedProfile.uid}</span>
                    <button
                      onClick={(e) => handleCopyUid(selectedProfile.uid, e)}
                      className="text-gray-400 hover:text-flame-start"
                      title="Nusxa olish"
                    >
                      {copiedUid === selectedProfile.uid ? (
                        <Check size={13} className="text-emerald-500" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Yaratilgan sana:</span>
                  <span>{formatTime(selectedProfile.createdAt)}</span>
                </div>

                <div className="flex items-center justify-between text-gray-600">
                  <span>Oxirgi tahrir:</span>
                  <span>{formatTime(selectedProfile.updatedAt)}</span>
                </div>
              </div>

              {/* Moderatsiya tizimi uchun xavfsiz tayyorgarlik */}
              <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-flame-start flex-shrink-0" />
                <p className="text-[11px] text-gray-600">
                  Ushbu profil ma'lumotlari haqiqiy Firestore bazasidan olindi va Super Admin ko'rigi uchun xavfsiz tarzda taqdim etildi.
                </p>
              </div>
            </div>

            {/* Modal pastki tugmasi */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setSelectedProfile(null)}
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
