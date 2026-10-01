import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { matchIdFor } from "../lib/firestore";

// Classic "It's a Match!" celebration modal with Super Like indicator
export default function MatchModal({ me, target, onClose }) {
  const navigate = useNavigate();
  const matchId = matchIdFor(me.uid, target.uid);

  function goToChat() {
    onClose();
    navigate(`/chat/${matchId}`);
  }

  const isSuperLike = Boolean(target?.isSuperLike);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flame-bg flex flex-col items-center justify-center px-8 text-white select-none"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center max-w-sm w-full"
      >
        {isSuperLike && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/90 backdrop-blur-xs text-white text-xs font-black uppercase tracking-wider mb-3 shadow-md border border-white/20">
            <Star size={14} fill="currentColor" /> Super Like bilan Match!
          </div>
        )}

        <h1 className="text-4xl font-extrabold italic mb-2">Bu match!</h1>
        <p className="text-white/90 mb-10 text-center text-sm">
          Siz va {target.displayName} bir-biringizga yoqdingiz
        </p>

        <div className="flex items-center -space-x-4 mb-12">
          <Avatar src={me.photos?.[0]} label={me.displayName} />
          <Avatar src={target.photos?.[0]} label={target.displayName} isSuperLike={isSuperLike} />
        </div>

        <button
          onClick={goToChat}
          className="w-full max-w-xs py-3 rounded-full bg-white text-flame-start font-bold mb-3 shadow-md hover:bg-gray-50 active:scale-95 transition-all"
        >
          Xabar yuborish
        </button>
        <button
          onClick={onClose}
          className="w-full max-w-xs py-3 rounded-full border border-white/70 text-white font-semibold hover:bg-white/10 active:scale-95 transition-all"
        >
          Surishda davom etish
        </button>
      </motion.div>
    </motion.div>
  );
}

function Avatar({ src, label, isSuperLike }) {
  return (
    <div
      className={`relative w-28 h-28 rounded-full border-4 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg ${
        isSuperLike ? "border-sky-400" : "border-white"
      }`}
    >
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : (
        <span className="text-3xl font-bold">{label?.[0]?.toUpperCase()}</span>
      )}
      {isSuperLike && (
        <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
          <Star size={13} fill="currentColor" />
        </div>
      )}
    </div>
  );
}
