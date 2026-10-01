import { RotateCcw, X, Star, Heart, Bookmark } from "lucide-react";

export default function ActionButtons({
  onNope,
  onSuperLike,
  onLike,
  onToggleFavorite,
  isFavorited,
  disabled,
}) {
  const base =
    "rounded-full bg-white shadow-card flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 border border-gray-100";

  return (
    <div className="flex items-center justify-center gap-3">
      {/* 1. Saqlash / Bookmark */}
      <button
        className={`${base} w-11 h-11 hover:scale-105`}
        onClick={onToggleFavorite}
        disabled={disabled || !onToggleFavorite}
        title={isFavorited ? "Saqlanganlardan o'chirish" : "Saqlash"}
      >
        <Bookmark
          className={isFavorited ? "text-amber-500 fill-amber-500" : "text-gray-400 hover:text-amber-500"}
          size={18}
        />
      </button>

      {/* 2. Nope (X) */}
      <button
        className={`${base} w-14 h-14 hover:scale-105`}
        onClick={onNope}
        disabled={disabled}
        title="Yoqmadi"
      >
        <X className="text-nope" size={28} strokeWidth={3} />
      </button>

      {/* 3. Super Like (Star) */}
      <button
        className={`${base} w-12 h-12 hover:scale-110 bg-sky-50/50 border-sky-100 hover:bg-sky-50`}
        onClick={onSuperLike}
        disabled={disabled || !onSuperLike}
        title="Super Like"
      >
        <Star className="text-superlike" size={22} fill="currentColor" />
      </button>

      {/* 4. Like (Heart) */}
      <button
        className={`${base} w-14 h-14 hover:scale-105`}
        onClick={onLike}
        disabled={disabled}
        title="Yoqdi"
      >
        <Heart className="text-like" size={28} fill="currentColor" />
      </button>

      {/* 5. Orqaga qaytarish (Rewind) */}
      <button
        className={`${base} w-11 h-11 hover:scale-105 text-amber-400`}
        title="Orqaga qaytarish"
        disabled
      >
        <RotateCcw size={18} />
      </button>
    </div>
  );
}
