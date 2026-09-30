import { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";

// una carta arrastrable. el padre le pasa onSwipe(dir) cuando se va lo bastante
// lejos. mientras arrastras aparecen los sellos LIKE / NOPE como en el original.
export default function SwipeCard({ profile, onSwipe, isTop }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeOpacity = useTransform(x, [40, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-140, -40], [1, 0]);

  const photos = profile.photos?.length ? profile.photos : [null];

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
          <div className="absolute top-3 left-3 right-3 flex gap-1">
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

        {/* zona invisible para cambiar de foto al tocar */}
        <div className="absolute inset-0" onClick={tapPhoto} />

        {/* sellos like/nope */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-6 border-4 border-like text-like font-extrabold text-3xl px-3 py-1 rounded-lg -rotate-12 pointer-events-none"
        >
          LIKE
        </motion.div>
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-6 border-4 border-nope text-nope font-extrabold text-3xl px-3 py-1 rounded-lg rotate-12 pointer-events-none"
        >
          NOPE
        </motion.div>

        {/* degradado + datos abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-5 pt-16 bg-gradient-to-t from-black/70 to-transparent text-white pointer-events-none">
          <div className="flex items-end gap-2">
            <h2 className="text-2xl font-bold">{profile.displayName}</h2>
            {profile.age && <span className="text-xl">{profile.age}</span>}
          </div>
          {profile.job && (
            <p className="flex items-center gap-1.5 text-sm text-white/90 mt-1">
              <Briefcase size={14} /> {profile.job}
            </p>
          )}
          {typeof profile.distanceKm === "number" && (
            <p className="flex items-center gap-1.5 text-sm text-white/80 mt-0.5">
              <MapPin size={14} /> {profile.distanceKm} km uzoqlikda
            </p>
          )}
          {profile.bio && (
            <p className="text-sm text-white/90 mt-2 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
