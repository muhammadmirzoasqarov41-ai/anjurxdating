import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { matchIdFor } from "../lib/firestore";

// el clasico "¡Es un match!" con las dos fotos y el gradiente de marca.
export default function MatchModal({ me, target, onClose }) {
  const navigate = useNavigate();
  const matchId = matchIdFor(me.uid, target.uid);

  function goToChat() {
    onClose();
    navigate(`/chat/${matchId}`);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flame-bg flex flex-col items-center justify-center px-8 text-white"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center"
      >
        <h1 className="text-4xl font-extrabold italic mb-2">Bu match!</h1>
        <p className="text-white/90 mb-10 text-center">
          Siz va {target.displayName} bir-biringizga yoqdingiz
        </p>

        <div className="flex items-center -space-x-4 mb-12">
          <Avatar src={me.photos?.[0]} label={me.displayName} />
          <Avatar src={target.photos?.[0]} label={target.displayName} />
        </div>

        <button
          onClick={goToChat}
          className="w-full max-w-xs py-3 rounded-full bg-white text-flame-start font-bold mb-3"
        >
          Xabar yuborish
        </button>
        <button
          onClick={onClose}
          className="w-full max-w-xs py-3 rounded-full border border-white/70 text-white font-semibold"
        >
          Surishda davom etish
        </button>
      </motion.div>
    </motion.div>
  );
}

function Avatar({ src, label }) {
  return (
    <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-white/20 flex items-center justify-center">
      {src ? (
        <img src={src} alt={label} className="w-full h-full object-cover" />
      ) : (
        <span className="text-3xl font-bold">{label?.[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}
