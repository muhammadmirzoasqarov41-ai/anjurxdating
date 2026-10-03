import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  AtSign,
  User,
  Heart,
  Star,
  MapPin,
  Flame,
  Check,
  Copy,
  ExternalLink,
  X,
  Compass,
  AlertCircle,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDeckStore } from "../store/deckStore";
import { searchUsers } from "../lib/username";
import VerifiedBadge from "../components/VerifiedBadge";
import ProfileDetailModal from "../components/ProfileDetailModal";

const POPULAR_TAGS = [
  "sport",
  "musiqa",
  "dasturlash",
  "sayohat",
  "kitoblar",
  "kinolar",
  "fitnes",
  "san'at",
];

export default function Search() {
  const { user } = useAuthStore();
  const { swipeRight, superLike, isLiked, isSuperLiked } = useDeckStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState("all"); // "all" | "username" | "name" | "interests"
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [copiedUsername, setCopiedUsername] = useState(null);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    const timer = setTimeout(async () => {
      try {
        const found = await searchUsers(trimmed, user?.uid);
        setResults(found);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [query, user?.uid]);

  // Copy username feedback
  const handleCopyUsername = (username, e) => {
    e?.stopPropagation();
    if (!username) return;
    const clean = username.replace(/^@/, "");
    navigator.clipboard.writeText(`@${clean}`);
    setCopiedUsername(clean);
    setTimeout(() => setCopiedUsername(null), 2500);
  };

  // Filter results client-side based on filterMode
  const filteredResults = useMemo(() => {
    if (filterMode === "all") return results;
    if (filterMode === "username") {
      return results.filter(
        (r) =>
          r.isExactUsernameMatch ||
          (r.username &&
            r.username.toLowerCase().includes(query.replace(/^@/, "").toLowerCase()))
      );
    }
    if (filterMode === "name") {
      return results.filter((r) =>
        r.displayName?.toLowerCase().includes(query.toLowerCase())
      );
    }
    if (filterMode === "interests") {
      return results.filter(
        (r) =>
          r.matchedInterest ||
          r.interests?.some((i) =>
            i.toLowerCase().includes(query.toLowerCase())
          )
      );
    }
    return results;
  }, [results, filterMode, query]);

  const exactMatch = useMemo(() => {
    return results.find((r) => r.isExactUsernameMatch);
  }, [results]);

  return (
    <div className="max-w-md mx-auto px-4 py-4 min-h-[85vh] space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <SearchIcon className="text-flame-start" size={22} />
          <span>Foydalanuvchilarni Qidirish</span>
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          @username, ism yoki umumiy qiziqishlar orqali toping
        </p>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
          {query.startsWith("@") ? (
            <AtSign size={18} className="text-flame-start" />
          ) : (
            <SearchIcon size={18} />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="@username, ism yoki qiziqish yozing..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-gray-200 text-sm font-semibold placeholder:text-gray-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filter Mode Chips */}
      {query.trim().length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto thin-scroll pb-1">
          {[
            { id: "all", label: "Barchasi" },
            { id: "username", label: "@Username" },
            { id: "name", label: "Ismlar" },
            { id: "interests", label: "Qiziqishlar" },
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilterMode(chip.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                filterMode === chip.id
                  ? "bg-gray-900 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* Copied alert toast */}
      {copiedUsername && (
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-between shadow-2xs">
          <span className="flex items-center gap-1.5">
            <Check size={14} className="text-emerald-600" />
            <span>@{copiedUsername} buferga nusxalandi!</span>
          </span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3 pt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-white border border-gray-100 p-3 flex items-center gap-3 animate-pulse shadow-2xs"
            >
              <div className="w-14 h-14 rounded-full bg-gray-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-1/3 h-4 bg-gray-200 rounded" />
                <div className="w-1/4 h-3 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Initial State: Suggestions */}
      {!query && !loading && (
        <div className="py-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-3xl bg-rose-50 text-flame-start flex items-center justify-center mx-auto shadow-2xs">
            <AtSign size={26} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Tezkor va aniq qidiruv
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Instagram va Telegram uslubida do'stingizning @username identifikatorini yozib profilingizni toping.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Ommabop qiziqishlar bo'yicha qidiring:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:border-rose-300 hover:text-flame-start text-xs font-semibold text-gray-700 shadow-2xs transition-all active:scale-95"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No Results State */}
      {!loading && hasSearched && filteredResults.length === 0 && (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <User size={22} />
          </div>
          <h4 className="text-sm font-bold text-gray-800">Profil topilmadi</h4>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            "{query}" so'rovi bo'yicha hech kim topilmadi. Username imlosini tekshirib ko'ring yoki boshqa kalit so'z bilan qidiring.
          </p>
        </div>
      )}

      {/* Results List */}
      {!loading && filteredResults.length > 0 && (
        <div className="space-y-2.5 pb-12">
          {filteredResults.map((item) => {
            const isExact = item.isExactUsernameMatch;
            const photo = item.photos?.[0];

            return (
              <div
                key={item.uid}
                onClick={() => setSelectedProfile(item)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer shadow-2xs hover:shadow-xs group flex items-center justify-between gap-3 ${
                  isExact
                    ? "bg-gradient-to-r from-rose-50/80 to-amber-50/60 border-rose-200/90"
                    : "bg-white hover:bg-gray-50 border-gray-100"
                }`}
              >
                {/* Avatar with status */}
                <div className="relative w-14 h-14 min-w-[56px] max-w-[56px] min-h-[56px] max-h-[56px] rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200 shadow-2xs">
                  {photo ? (
                    <img
                      src={photo}
                      alt={item.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {item.displayName?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                  {item.online && (
                    <span
                      className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white"
                      title="Onlayn"
                    />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate">
                      {item.displayName}
                      {item.age ? `, ${item.age}` : ""}
                    </h3>
                    {item.verified && <VerifiedBadge size={14} />}
                    {isExact && (
                      <span className="px-1.5 py-0.5 rounded-md bg-flame-start text-white text-[10px] font-black uppercase tracking-wider">
                        Aniq moslik
                      </span>
                    )}
                  </div>

                  {item.username ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs font-semibold text-flame-start">
                        @{item.username}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyUsername(item.username, e)}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        title="Usernameni nusxalash"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400">Username o'rnatilmagan</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-[11px] text-gray-500">
                    {item.city && (
                      <span className="flex items-center gap-0.5">
                        <MapPin size={11} className="text-gray-400" />
                        {item.city}
                      </span>
                    )}
                    {item.job && <span className="truncate">{item.job}</span>}
                  </div>
                </div>

                {/* Direct Action */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    to={`/u/${item.username || item.uid}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
                    title="Profil sahifasini ochish"
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <ProfileDetailModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onLike={(p) => {
            swipeRight(p.uid);
            setSelectedProfile(null);
          }}
          onSuperLike={(p) => {
            superLike(p.uid);
            setSelectedProfile(null);
          }}
          isFavorited={false}
        />
      )}
    </div>
  );
}
