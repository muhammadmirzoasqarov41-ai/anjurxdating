import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, MessageCircle } from "lucide-react";
import { matchIdFor } from "../lib/firestore";
import { getConversationStarters } from "../lib/conversationStarters";

// Classic "It's a Match!" celebration modal with Super Like indicator and Conversation Starters
export default function MatchModal({ me, target, onClose }) {
  const navigate = useNavigate();
  const matchId = matchIdFor(me.uid, target.uid);
  const isSuperLike = Boolean(target?.isSuperLike);

  const starters = getConversationStarters(me, target);

  function goToChat(starterText = null) {
    onClose();
    if (starterText) {
      navigate(`/chat/${matchId}?starter=${encodeURIComponent(starterText)}`);
    } else {
      navigate(`/chat/${matchId}`);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flame-bg flex flex-col items-center justify-center px-6 text-white select-none overflow-y-auto thin-scroll py-6"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center max-w-sm w-full my-auto"
      >
        {isSuperLike && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/90 backdrop-blur-xs text-white text-xs font-black uppercase tracking-wider mb-2 shadow-md border border-white/20">
            <Star size={14} fill="currentColor" /> Super Like bilan Match!
          </div>
        )}

        <h1 className="text-4xl font-extrabold italic mb-1">Bu match!</h1>
        <p className="text-white/90 mb-6 text-center text-sm">
          Siz va {target.displayName} bir-biringizga yoqdingiz
        </p>

        <div className="flex items-center -space-x-4 mb-6">
          <Avatar src={me.photos?.[0]} label={me.displayName} />
          <Avatar
            src={target.photos?.[0]}
            label={target.displayName}
            isSuperLike={isSuperLike}
          />
        </div>

        {/* Profile-based Quick Starters */}
        {starters.length > 0 && (
          <div className="w-full max-w-xs mb-4">
            <p className="text-white/80 text-[11px] font-bold text-center uppercase tracking-wider mb-2">
              Qaysi mavzudan boshlaysiz?
            </p>
            <div className="space-y-1.5">
              {starters.slice(0, 2).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToChat(s.text)}
                  className="w-full text-left px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white text-xs font-medium border border-white/20 transition-all flex items-center justify-between gap-2"
                >
                  <span className="truncate">{s.text}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/30 font-bold shrink-0">
                    {s.topic}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => goToChat()}
          className="w-full max-w-xs py-3 rounded-full bg-white text-flame-start font-bold mb-2.5 shadow-md hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <MessageCircle size={18} />
          <span>Xabar yuborish</span>
        </button>

        <button
          onClick={onClose}
          className="w-full max-w-xs py-2.5 rounded-full border border-white/70 text-white font-semibold hover:bg-white/10 active:scale-95 transition-all text-sm"
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
      className={`relative w-24 h-24 rounded-full border-4 overflow-hidden bg-white/20 flex items-center justify-center shadow-lg ${
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
