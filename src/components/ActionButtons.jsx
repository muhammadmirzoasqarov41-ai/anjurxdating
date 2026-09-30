import { RotateCcw, X, Star, Heart, Zap } from "lucide-react";

// los cinco botones redondos de abajo. solo cableo nope y like; rewind, super
// like y boost quedan como en el original pero sin accion (deshabilitados).
export default function ActionButtons({ onNope, onLike, disabled }) {
  const base =
    "rounded-full bg-white shadow-card flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40";

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        className={base + " w-11 h-11"}
        title="Orqaga qaytarish"
        disabled
      >
        <RotateCcw className="text-amber-400" size={20} />
      </button>

      <button
        className={base + " w-14 h-14"}
        onClick={onNope}
        disabled={disabled}
        title="Yoqmadi"
      >
        <X className="text-nope" size={28} strokeWidth={3} />
      </button>

      <button className={base + " w-11 h-11"} title="Super like" disabled>
        <Star className="text-superlike" size={20} fill="currentColor" />
      </button>

      <button
        className={base + " w-14 h-14"}
        onClick={onLike}
        disabled={disabled}
        title="Yoqdi"
      >
        <Heart className="text-like" size={28} fill="currentColor" />
      </button>

      <button className={base + " w-11 h-11"} title="Tezlashtirish" disabled>
        <Zap className="text-purple-500" size={20} fill="currentColor" />
      </button>
    </div>
  );
}
