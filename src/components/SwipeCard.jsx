import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import {
  MapPin,
  Briefcase,
  Info,
  Flame,
  ShieldCheck,
  Star,
  Bookmark,
} from "lucide-react";
import { formatDistance } from "../lib/location";

// Drag-and-swipe card with strict stacking context isolation.
// Supports: Drag Left (Nope), Drag Right (Like), Drag Up (Super Like), Favorite toggle & Detail modal.
export default function SwipeCard({
  profile,
  onSwipe,
  isTop,
  onOpenDetail,
  onToggleFavorite,
  isFavorited,
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);
  const superLikeOpacity = useTransform(y, [-120, -35], [1, 0]);

  const photos = profile.photos?.length ? profile.photos : [null];
  const compatibility = profile.compatibility || {
    score: 60,
    mutualInterests: [],
    matchReasons: [],
  };

  function handleDragEnd(_, info) {
    if (!isTop) return;
    const thresholdX = 110;
    const thresholdY = -100;

    // Upward swipe -> Super Like
    if (info.offset.y < thresholdY && Math.abs(info.offset.x) < 90) {
      onSwipe("superlike");
    } else if (info.offset.x > thresholdX) {
      onSwipe("like");
    } else if (info.offset.x < -thresholdX) {
      onSwipe("nope");
    }
  }

  // Tapping photo edges changes photo (only allowed on top card)
  function tapPhoto(e) {
    if (!isTop) return;
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX - left > width / 2;
    setPhotoIdx((i) =>
      isRight
        ? Math.min(i + 1, photos.length - 1)
        : Math.max(i - 1, 0)
    );
  }

  const isOnline = profile.online || profile.isOnline;

  return (
    <motion.div
      className={`absolute inset-0 no-select isolate ${
        isTop
          ? "cursor-grab active:cursor-grabbing pointer-events-auto"
          : "pointer-events-none select-none"
      }`}
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : 0,
        rotate: isTop ? rotate : 0,
        zIndex: isTop ? 30 : 10,
      }}
      animate={{
        scale: isTop ? 1 : 0.96,
        y: isTop ? 0 : 8,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      drag={isTop ? true : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing" } : undefined}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-900 shadow-card select-none">
        {photos[photoIdx] ? (
          <img
            src={photos[photoIdx]}
            alt={profile.displayName}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flame-bg" />
        )}

        {/* Photo count indicator dots/bars */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {photos.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 flex-1 rounded-full transition-all " +
                  (i === photoIdx ? "bg-white" : "bg-white/40")
                }
              />
            ))}
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-1.5 flex-wrap">
            {compatibility.score && (
              <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1 shadow-xs border border-white/20">
                <span className="text-orange-400">🔥</span> {compatibility.score}% Moslik
              </span>
            )}
            {profile.isSuperLikeReceived && (
              <span className="px-2.5 py-1 rounded-full bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs border border-white/20">
                <Star size={11} fill="currentColor" /> Super Like
              </span>
            )}
          </div>

          {compatibility.mutualInterests?.length > 0 && (
            <span className="px-2.5 py-1 rounded-full flame-bg text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
              <Flame size={11} fill="currentColor" /> {compatibility.mutualInterests.length} ta umumiy qiziqish
            </span>
          )}
        </div>

        {/* Invisible tap surface to switch photos (only active on top card) */}
        {isTop && (
          <div className="absolute inset-0 z-10" onClick={tapPhoto} />
        )}

        {/* LIKE / NOPE / SUPER LIKE stamps */}
        {isTop && (
          <>
            {/* LIKE */}
            <motion.div
              style={{ opacity: likeOpacity }}
              className="absolute top-16 left-6 border-4 border-like text-like font-extrabold text-3xl px-3 py-1 rounded-lg -rotate-12 pointer-events-none z-20 shadow-sm"
            >
              LIKE
            </motion.div>

            {/* NOPE */}
            <motion.div
              style={{ opacity: nopeOpacity }}
              className="absolute top-16 right-6 border-4 border-nope text-nope font-extrabold text-3xl px-3 py-1 rounded-lg rotate-12 pointer-events-none z-20 shadow-sm"
            >
              NOPE
            </motion.div>

            {/* SUPER LIKE */}
            <motion.div
              style={{ opacity: superLikeOpacity }}
              className="absolute bottom-32 inset-x-8 border-4 border-superlike text-superlike font-black text-2xl px-4 py-2 rounded-xl text-center pointer-events-none z-20 shadow-lg bg-black/50 backdrop-blur-xs flex items-center justify-center gap-2"
            >
              <Star size={24} fill="currentColor" /> SUPER LIKE
            </motion.div>
          </>
        )}

        {/* Bottom gradient overlay & profile details */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white pointer-events-none z-10">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-end gap-2 min-w-0">
                <h2 className="text-2xl font-bold truncate">{profile.displayName}</h2>
                {profile.age && <span className="text-xl font-medium">{profile.age}</span>}
                {(profile.verified || profile.isVerified) && (
                  <span title="Tasdiqlangan profil" className="text-blue-400 mb-0.5 shrink-0">
                    <ShieldCheck size={18} />
                  </span>
                )}
                {isOnline && (
                  <span
                    title="Hozir onlayn"
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white/60 mb-1.5 shrink-0"
                  />
                )}
              </div>
              {profile.username && (
                <p className="text-xs font-semibold text-rose-200 drop-shadow-xs">
                  @{profile.username}
                </p>
              )}
            </div>

            {/* Quick Actions (Favorite & Info) */}
            {isTop && (
              <div className="flex items-center gap-1.5 pointer-events-auto ml-2 shrink-0">
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(profile);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                    title={isFavorited ? "Saqlanganlardan o'chirish" : "Saqlash"}
                  >
                    <Bookmark
                      size={15}
                      className={isFavorited ? "text-amber-400 fill-amber-400" : "text-white"}
                    />
                  </button>
                )}

                {onOpenDetail && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail(profile);
                    }}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors"
                    title="Batafsil ma'lumot"
                  >
                    <Info size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {profile.job && (
            <p className="flex items-center gap-1.5 text-sm text-white/90 mt-1">
              <Briefcase size={14} /> {profile.job}
            </p>
          )}

          <div className="flex items-center gap-3 mt-0.5 text-sm text-white/80">
            {profile.city && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {profile.city}
              </span>
            )}
            {typeof profile.realDistanceKm === "number" ? (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {formatDistance(profile.realDistanceKm)}
              </span>
            ) : !profile.city ? (
              <span className="flex items-center gap-1 text-white/70 text-xs">
                <MapPin size={13} /> Joylashuv noaniq
              </span>
            ) : null}
          </div>

          {profile.bio && (
            <p className="text-sm text-white/90 mt-2 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Interests preview pills */}
          {profile.interests?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2.5">
              {profile.interests.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-semibold text-white/95 backdrop-blur-xs"
                >
                  {item}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] text-white/80">
                  +{profile.interests.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
