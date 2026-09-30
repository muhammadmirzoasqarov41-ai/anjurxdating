import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Briefcase, Info, Flame, ShieldCheck } from "lucide-react";

// una carta arrastrable. el padre le pasa onSwipe(dir) cuando se va lo bastante
// lejos. mientras arrastras aparecen los sellos LIKE / NOPE como en el original.
export default function SwipeCard({ profile, onSwipe, isTop, onOpenDetail }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);

  const photos = profile.photos?.length ? profile.photos : [null];
  const compatibility = profile.compatibility || {
    score: 60,
    mutualInterests: [],
    matchReasons: [],
  };

  function handleDragEnd(_, info) {
    const threshold = 120;
    if (info.offset.x > threshold) onSwipe("like");
    else if (info.offset.x < -threshold) onSwipe("nope");
  }

  // toques en los lados de la foto cambian de imagen, como en tinder
  function tapPhoto(e) {
    const { left, width } = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX - left > width / 2;
    setPhotoIdx((i) =>
      isRight
        ? Math.min(i + 1, photos.length - 1)
        : Math.max(i - 1, 0)
    );
  }

  return (
    <motion.div
      className="absolute inset-0 no-select"
      style={{ x, rotate }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-gray-200 shadow-card">
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

        {/* indicador de fotos arriba */}
        {photos.length > 1 && (
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {photos.map((_, i) => (
              <span
                key={i}
                className={
                  "h-1 flex-1 rounded-full " +
                  (i === photoIdx ? "bg-white" : "bg-white/40")
                }
              />
            ))}
          </div>
        )}

        {/* Smart Matching Badges on Top */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          {compatibility.score && (
            <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-[11px] font-bold flex items-center gap-1 shadow-xs border border-white/20">
              <span className="text-orange-400">🔥</span> {compatibility.score}% Moslik
            </span>
          )}

          {compatibility.mutualInterests?.length > 0 && (
            <span className="px-2.5 py-1 rounded-full flame-bg text-white text-[11px] font-bold flex items-center gap-1 shadow-xs">
              <Flame size={11} fill="currentColor" /> {compatibility.mutualInterests.length} ta umumiy qiziqish
            </span>
          )}
        </div>

        {/* zona invisible para cambiar de foto al tocar */}
        <div className="absolute inset-0" onClick={tapPhoto} />

        {/* sellos like/nope */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-16 left-6 border-4 border-like text-like font-extrabold text-3xl px-3 py-1 rounded-lg -rotate-12 pointer-events-none z-20"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-16 right-6 border-4 border-nope text-nope font-extrabold text-3xl px-3 py-1 rounded-lg rotate-12 pointer-events-none z-20"
        >
          NOPE
        </motion.div>

        {/* degradado + datos abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white pointer-events-none z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-end gap-2 min-w-0">
              <h2 className="text-2xl font-bold truncate">{profile.displayName}</h2>
              {profile.age && <span className="text-xl">{profile.age}</span>}
              {(profile.verified || profile.isVerified) && (
                <span title="Tasdiqlangan" className="text-blue-400 mb-0.5">
                  <ShieldCheck size={18} />
                </span>
              )}
            </div>

            {/* Info button to open Detail modal */}
            {onOpenDetail && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetail(profile);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors pointer-events-auto flex-shrink-0 ml-2"
                title="Batafsil ma'lumot"
              >
                <Info size={16} />
              </button>
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
            {typeof profile.distanceKm === "number" && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {profile.distanceKm} km
              </span>
            )}
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
