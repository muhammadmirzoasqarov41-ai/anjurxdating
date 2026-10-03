import { Link } from "react-router-dom";
import { MessageCircle, Star, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { formatMessageTime } from "../lib/firestore";
import EmptyState from "../components/EmptyState";
import VerifiedBadge from "../components/VerifiedBadge";

export default function Matches() {
  const { user } = useAuthStore();
  const { matches, unreadMatchIds, loading } = useChatStore();

  if (loading && matches.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!loading && matches.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <EmptyState
          icon={MessageCircle}
          title="Hali matchlaringiz yo'q"
          subtitle="Siz va boshqa inson bir-biringizga yoqsangiz, suhbatlashish uchun bu yerda paydo bo'ladi."
        />
        <div className="text-center mt-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-xs"
          >
            <span>Discover'ga o'tish</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 min-h-[85vh]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h1 className="font-extrabold text-lg text-gray-900">Xabarlar</h1>
        {unreadMatchIds.size > 0 && (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 font-bold text-xs border border-rose-100">
            {unreadMatchIds.size} ta yangi
          </span>
        )}
      </div>

      <div className="space-y-1.5 pb-8">
        {matches.map((m) => {
          const otherUid = m.users.find((u) => u !== user?.uid);
          const other = m.profiles?.[otherUid] || {};
          const isUnread = unreadMatchIds.has(m.id);
          const timeStr = formatMessageTime(m.lastMessageAt || m.createdAt);

          return (
            <Link
              key={m.id}
              to={`/chat/${m.id}`}
              className={`flex items-center gap-3 p-3 rounded-2xl transition-all border ${
                isUnread
                  ? "bg-rose-50/50 border-rose-100 shadow-2xs"
                  : "bg-white hover:bg-gray-50 border-gray-100 shadow-2xs"
              }`}
            >
              {/* Avatar with Super Like badge if applicable */}
              <div className="relative w-12 h-12 min-w-[48px] max-w-[48px] min-h-[48px] max-h-[48px] rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {other.photo ? (
                  <img
                    src={other.photo}
                    alt={other.displayName}
                    className="w-12 h-12 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span className="text-base font-bold text-gray-400">
                    {other.displayName?.[0]?.toUpperCase()}
                  </span>
                )}
                {m.isSuperLike && (
                  <div
                    className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-superlike text-white flex items-center justify-center shadow-xs"
                    title="Super Like orqali match"
                  >
                    <Star size={9} fill="currentColor" />
                  </div>
                )}
              </div>

              {/* Chat details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p
                      className={`truncate text-sm ${
                        isUnread
                          ? "font-black text-gray-900"
                          : "font-semibold text-gray-900"
                      }`}
                    >
                      {other.displayName}
                    </p>
                    {Boolean(other.verified || other.isVerified) && (
                      <VerifiedBadge size={13} />
                    )}
                    {other.username && (
                      <span className="text-[11px] font-semibold text-rose-500 shrink-0">
                        @{other.username}
                      </span>
                    )}
                    {m.isSuperLike && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-50 text-superlike font-bold border border-sky-100 shrink-0">
                        Super
                      </span>
                    )}
                  </div>

                  {timeStr && (
                    <span
                      className={`text-[11px] shrink-0 ${
                        isUnread
                          ? "text-rose-600 font-bold"
                          : "text-gray-400 font-medium"
                      }`}
                    >
                      {timeStr}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs truncate ${
                      isUnread
                        ? "text-gray-900 font-semibold"
                        : "text-gray-500"
                    }`}
                  >
                    {m.lastMessage ||
                      (m.isSuperLike
                        ? "Super Like orqali match bo'ldingiz!"
                        : "Match bo'ldingiz, birinchi salomni yo'llang")}
                  </p>

                  {/* Red dot if unread */}
                  {isUnread && (
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 ring-2 ring-rose-200" />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
