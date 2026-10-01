import { useEffect, useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Flame,
  SlidersHorizontal,
  RotateCcw,
  RefreshCw,
  Heart,
  X,
  Compass,
  MapPin,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDeckStore } from "../store/deckStore";
import { useFavoritesStore } from "../store/favoritesStore";
import { useLocationStore } from "../store/locationStore";
import SwipeCard from "../components/SwipeCard";
import ActionButtons from "../components/ActionButtons";
import MatchModal from "../components/MatchModal";
import EmptyState from "../components/EmptyState";
import ProfileDetailModal from "../components/ProfileDetailModal";
import DiscoverFiltersModal from "../components/DiscoverFiltersModal";

export default function Discover() {
  const { user, profile } = useAuthStore();
  const { cards, index, loading, error, lastMatch, load, swipe, clearMatch } =
    useDeckStore();
  const { favoriteIds, toggleFavorite, loadFavorites } = useFavoritesStore();
  const {
    currentLocation,
    permissionStatus,
    shareLocation,
    loading: locationLoading,
    requestLocation,
    initFromProfile,
  } = useLocationStore();

  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(profile?.preferences || {});

  // Initialize location store with saved profile settings
  useEffect(() => {
    if (profile) {
      initFromProfile(profile);
    }
  }, [profile, initFromProfile]);

  // Request location automatically once on mount if sharing is enabled
  useEffect(() => {
    if (user?.uid && shareLocation) {
      requestLocation(user.uid);
    }
  }, [user?.uid, shareLocation, requestLocation]);

  // Load favorites on mount
  useEffect(() => {
    if (user?.uid) {
      loadFavorites(user.uid);
    }
  }, [user?.uid, loadFavorites]);

  // Build current user representation including live approx coordinates
  const me = useMemo(() => {
    return {
      uid: user?.uid,
      ...profile,
      approxLocation: currentLocation || profile?.approxLocation || null,
      city: currentLocation?.city || profile?.city || "Toshkent",
      locationSettings: {
        shareLocation,
        showDistance: profile?.locationSettings?.showDistance !== false,
      },
    };
  }, [user, profile, currentLocation, shareLocation]);

  // Load deck with user profile for Smart Matching, real distance, and active filters
  useEffect(() => {
    if (user) {
      load(user.uid, me, activeFilters);
    }
  }, [user, me, activeFilters, load]);

  const remaining = cards.slice(index);
  const noMore = !loading && remaining.length === 0;
  const currentCard = remaining[0];

  // Count active non-default filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (activeFilters.minAge && activeFilters.minAge !== 18) count++;
    if (activeFilters.maxAge && activeFilters.maxAge !== 45) count++;
    if (activeFilters.gender && activeFilters.gender !== "all") count++;
    if (activeFilters.datingIntention && activeFilters.datingIntention !== "all") count++;
    if (activeFilters.city && activeFilters.city !== "all") count++;
    if (activeFilters.maxDistance) count++;
    if (activeFilters.interest && activeFilters.interest !== "all") count++;
    if (activeFilters.language && activeFilters.language !== "all") count++;
    if (activeFilters.verifiedOnly) count++;
    if (activeFilters.onlineOnly) count++;
    if (activeFilters.newOnly) count++;
    return count;
  }, [activeFilters]);

  // Apply filters from modal
  const handleApplyFilters = (newFilters) => {
    setActiveFilters(newFilters);
  };

  // Reset filters
  const handleResetFilters = () => {
    setActiveFilters({});
  };

  return (
    <div className="max-w-md mx-auto px-4 py-3">
      {/* Top Discover Action Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs font-bold text-gray-800">
            <Flame size={14} className="text-flame-start" fill="currentColor" /> Smart Discover
          </span>

          {/* Location Status Pill */}
          {permissionStatus === "granted" && currentLocation ? (
            <button
              onClick={() => requestLocation(user?.uid, true)}
              disabled={locationLoading}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
              title="Joylashuv faol. Qayta aniqlash uchun bosing"
            >
              <MapPin size={10} className="text-emerald-500" />
              <span>{currentLocation.city || "Joylashuv faol"}</span>
            </button>
          ) : (
            <button
              onClick={() => requestLocation(user?.uid, true)}
              disabled={locationLoading}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
              title="Aniq masofani hisoblash uchun bosing"
            >
              <MapPin size={10} className="text-amber-500" />
              <span>{locationLoading ? "Aniqlanmoqda..." : "Joylashuvni yoqish"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh deck */}
          <button
            onClick={() => user && load(user.uid, me, activeFilters)}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-gray-500 shadow-2xs flex items-center justify-center transition-colors disabled:opacity-50"
            title="Qayta yuklash"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-2xs ${
              activeFiltersCount > 0
                ? "flame-bg text-white"
                : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-100"
            }`}
            title="Filtrlar"
          >
            <SlidersHorizontal size={13} />
            <span>Filtrlar</span>
            {activeFiltersCount > 0 && (
              <span className="ml-0.5 w-4 h-4 rounded-full bg-white text-flame-start font-bold text-[10px] flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Discover Card Container */}
      <div className="relative w-full" style={{ height: "70vh" }}>
        {/* Loading Skeleton */}
        {loading && (
          <div className="absolute inset-0 rounded-2xl bg-white shadow-card p-4 overflow-hidden flex flex-col justify-between animate-pulse border border-gray-100">
            <div className="w-full h-3/4 rounded-xl bg-gray-200/80" />
            <div className="space-y-2 mt-4">
              <div className="h-5 bg-gray-200/80 rounded w-1/2" />
              <div className="h-3 bg-gray-200/80 rounded w-1/3" />
              <div className="h-3 bg-gray-200/80 rounded w-2/3" />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="absolute inset-0 rounded-2xl bg-white shadow-card p-6 flex flex-col items-center justify-center text-center space-y-3 border border-gray-100">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Flame size={28} />
            </div>
            <h3 className="font-bold text-gray-900 text-sm">
              Xatolik yuz berdi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs">{error}</p>
            <button
              onClick={() => user && load(user.uid, me, activeFilters)}
              className="mt-2 px-4 py-2 rounded-full flame-bg text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Qayta urinish
            </button>
          </div>
        )}

        {/* No More Profiles / Empty State */}
        {noMore && !error && !loading && (
          <div className="absolute inset-0 rounded-2xl bg-white shadow-card p-6 flex flex-col items-center justify-center text-center space-y-3 border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-flame-start flex items-center justify-center">
              <Flame size={30} fill="currentColor" />
            </div>
            <h3 className="font-bold text-gray-900 text-base">
              Hozircha mos profillar qolmadi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              {activeFiltersCount > 0
                ? "Siz o'rnatgan filtrlarga mos barcha profillarni ko'rib chiqdingiz. Filtrlarni kengaytirib ko'ring."
                : "Hududingizdagi barcha yangi profillarni ko'rdingiz. Keyinroq yana tashrif buyuring."}
            </p>

            <div className="flex items-center gap-2 pt-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={13} /> Filtrlarni tozalash
                </button>
              )}
              <button
                onClick={() => user && load(user.uid, me, activeFilters)}
                className="px-4 py-2 rounded-full flame-bg text-white text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Qayta yuklash
              </button>
            </div>
          </div>
        )}

        {/* Swipe Cards: Render top 2 cards */}
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
                  onOpenDetail={(target) => setSelectedProfile(target)}
                  onToggleFavorite={(target) => toggleFavorite(user?.uid, target)}
                  isFavorited={favoriteIds.has(card.uid)}
                />
              );
            })}
      </div>

      {/* Action Buttons (Nope, Super Like, Like, Favorite) */}
      {!noMore && !error && !loading && (
        <div className="mt-5">
          <ActionButtons
            disabled={loading || remaining.length === 0}
            onNope={() => swipe(me, "nope")}
            onSuperLike={() => swipe(me, "superlike")}
            onLike={() => swipe(me, "like")}
            onToggleFavorite={() => currentCard && toggleFavorite(user?.uid, currentCard)}
            isFavorited={Boolean(currentCard && favoriteIds.has(currentCard.uid))}
          />
        </div>
      )}

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <ProfileDetailModal
            profile={selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onLike={(target) => swipe(me, "like", target)}
            onSuperLike={(target) => swipe(me, "superlike", target)}
            onNope={(target) => swipe(me, "nope", target)}
            onToggleFavorite={(target) => toggleFavorite(user?.uid, target)}
            isFavorited={Boolean(favoriteIds.has(selectedProfile.uid))}
          />
        )}
      </AnimatePresence>

      {/* Discover Filters Modal */}
      <AnimatePresence>
        {showFilters && (
          <DiscoverFiltersModal
            currentFilters={activeFilters}
            onClose={() => setShowFilters(false)}
            onApply={handleApplyFilters}
          />
        )}
      </AnimatePresence>

      {/* Match Modal */}
      <AnimatePresence>
        {lastMatch && (
          <MatchModal me={me} target={lastMatch} onClose={clearMatch} />
        )}
      </AnimatePresence>
    </div>
  );
}
