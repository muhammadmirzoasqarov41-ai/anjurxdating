import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDeckStore } from "../store/deckStore";
import SwipeCard from "../components/SwipeCard";
import ActionButtons from "../components/ActionButtons";
import MatchModal from "../components/MatchModal";
import EmptyState from "../components/EmptyState";

export default function Discover() {
  const { user, profile } = useAuthStore();
  const { cards, index, loading, error, lastMatch, load, swipe, clearMatch } =
    useDeckStore();

  useEffect(() => {
    if (user) load(user.uid);
  }, [user, load]);

  // me arma el objeto de perfil propio que necesito para crear matches
  const me = { uid: user.uid, ...profile };

  const remaining = cards.slice(index);
  const noMore = !loading && remaining.length === 0;

  return (
    <div className="max-w-md mx-auto px-4 py-4">
      <div className="relative w-full" style={{ height: "70vh" }}>
        {loading && (
          <div className="absolute inset-0 rounded-2xl bg-gray-100 animate-pulse" />
        )}

        {error && (
          <EmptyState
            icon={Flame}
            title="Xatolik yuz berdi"
            subtitle={error}
          />
        )}

        {noMore && (
          <EmptyState
            icon={Flame}
            title="Hozircha hech kim yo'q"
            subtitle="Keyinroq qaytib ko'ring, albatta yangi insonlar paydo bo'ladi."
          />
        )}

        {/* solo renderizo las dos primeras cartas para no recargar el DOM */}
        {!loading &&
          remaining
            .slice(0, 2)
            .reverse()
            .map((card, i, arr) => {
              const isTop = i === arr.length - 1;
              return (
                <SwipeCard
                  key={card.uid}
                  profile={card}
                  isTop={isTop}
                  onSwipe={(dir) => swipe(me, dir)}
                />
              );
            })}
      </div>

      {!noMore && !error && (
        <div className="mt-5">
          <ActionButtons
            disabled={loading || remaining.length === 0}
            onNope={() => swipe(me, "nope")}
            onLike={() => swipe(me, "like")}
          />
        </div>
      )}

      <AnimatePresence>
        {lastMatch && (
          <MatchModal me={me} target={lastMatch} onClose={clearMatch} />
        )}
      </AnimatePresence>
    </div>
  );
}
