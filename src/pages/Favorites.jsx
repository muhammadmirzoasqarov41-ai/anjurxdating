import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bookmark,
  Star,
  MapPin,
  Briefcase,
  Heart,
  Trash2,
  ShieldCheck,
  Flame,
  ArrowRight,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { useDeckStore } from "../store/deckStore";
import ProfileDetailModal from "../components/ProfileDetailModal";
import MatchModal from "../components/MatchModal";

export default function Favorites() {
  const { user, profile } = useAuthStore();
  const { favorites, loading, error, loadFavorites, remove } =
    useFavoritesStore();
  const { swipe, lastMatch, clearMatch } = useDeckStore();

  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    if (user?.uid) {
      loadFavorites(user.uid);
    }
  }, [user?.uid, loadFavorites]);

  const me = { uid: user?.uid, ...profile };

  const handleRemove = (e, targetUid) => {
    e.stopPropagation();
    if (user?.uid) {
      remove(user.uid, targetUid);
    }
  };

  const handleLikeFromModal = (target) => {
    swipe(me, "like", target);
    if (user?.uid) {
      remove(user.uid, target.uid);
    }
  };

  const handleSuperLikeFromModal = (target) => {
    swipe(me, "superlike", target);
    if (user?.uid) {
      remove(user.uid, target.uid);
    }
  };

  const handleNopeFromModal = (target) => {
    swipe(me, "nope", target);
    if (user?.uid) {
      remove(user.uid, target.uid);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-4 min-h-[85vh]">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Star className="text-superlike" size={22} fill="currentColor" />
            Saqlanganlar
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Keyinroq tanishish uchun saqlab qo'yilgan profillar
          </p>
        </div>

        {favorites.length > 0 && (
          <span className="px-2.5 py-1 rounded-full bg-sky-50 text-superlike font-bold text-xs border border-sky-100">
            {favorites.length} ta
          </span>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="aspect-3/4 rounded-2xl bg-white shadow-card p-3 animate-pulse flex flex-col justify-end"
            >
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && favorites.length === 0 && (
        <div className="rounded-3xl bg-white shadow-card p-8 text-center flex flex-col items-center justify-center my-8 border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-sky-50 text-superlike flex items-center justify-center mb-4">
            <Star size={32} fill="currentColor" />
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">
            Hozircha saqlangan profillar yo'q
          </h3>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-6">
            Discover lentasida o'zingizga yoqqan profillarni yulduzcha orqali saqlab qo'yishingiz mumkin.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-xs"
          >
            <span>Discover'ga o'tish</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Favorites Grid */}
      {!loading && favorites.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pb-8">
          {favorites.map((fav) => {
            const photo = fav.photo || fav.photos?.[0];
            return (
              <motion.div
                key={fav.uid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedProfile(fav)}
                className="group relative aspect-3/4 rounded-2xl overflow-hidden bg-gray-900 shadow-card cursor-pointer border border-gray-100 hover:shadow-lg transition-all"
              >
                {/* Photo */}
                {photo ? (
                  <img
                    src={photo}
                    alt={fav.displayName}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flame-bg" />
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, fav.uid)}
                  className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 hover:bg-rose-500 text-white flex items-center justify-center transition-colors shadow-xs z-10"
                  title="Saqlanganlardan o'chirish"
                >
                  <Trash2 size={13} />
                </button>

                {/* Gradient & Info */}
                <div className="absolute inset-x-0 bottom-0 p-3 pt-12 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm truncate">
                      {fav.displayName}
                    </h3>
                    {fav.age && (
                      <span className="text-xs font-semibold">{fav.age}</span>
                    )}
                    {fav.verified && (
                      <ShieldCheck size={14} className="text-blue-400 shrink-0" />
                    )}
                  </div>

                  {fav.city && (
                    <p className="flex items-center gap-1 text-[11px] text-white/80 mt-0.5">
                      <MapPin size={11} /> {fav.city}
                    </p>
                  )}

                  {fav.datingIntention && (
                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[9px] font-semibold text-white/90 mt-1.5 truncate max-w-full">
                      {fav.datingIntention}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetailModal
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onLike={handleLikeFromModal}
            onSuperLike={handleSuperLikeFromModal}
            onNope={handleNopeFromModal}
          />
        )}
      </AnimatePresence>

      {/* Match Modal if matched */}
      <AnimatePresence>
        {lastMatch && (
          <MatchModal me={me} target={lastMatch} onClose={clearMatch} />
        )}
      </AnimatePresence>
    </div>
  );
}
