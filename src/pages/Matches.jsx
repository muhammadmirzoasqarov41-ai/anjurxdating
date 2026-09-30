import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { getMatches } from "../lib/firestore";
import EmptyState from "../components/EmptyState";

export default function Matches() {
  const { user } = useAuthStore();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMatches(user.uid)
      .then((m) => {
        // los mas recientes arriba
        m.sort((a, b) => {
          const ta = a.lastMessageAt?.seconds || a.createdAt?.seconds || 0;
          const tb = b.lastMessageAt?.seconds || b.createdAt?.seconds || 0;
          return tb - ta;
        });
        setMatches(m);
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="Hali matchlaringiz yo'q"
        subtitle="Siz va boshqa inson bir-biringizga yoqsangiz, suhbatlashish uchun bu yerda paydo bo'ladi."
      />
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <h1 className="font-extrabold text-lg mb-3">Xabarlar</h1>
      <div className="space-y-1">
        {matches.map((m) => {
          const otherUid = m.users.find((u) => u !== user.uid);
          const other = m.profiles?.[otherUid] || {};
          return (
            <Link
              key={m.id}
              to={`/chat/${m.id}`}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center">
                {other.photo ? (
                  <img
                    src={other.photo}
                    alt={other.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-400">
                    {other.displayName?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">
                  {other.displayName}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {m.lastMessage || "Match bo'ldingiz, bir-biringizga salom bering"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
