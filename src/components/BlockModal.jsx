import { useState } from "react";
import { motion } from "framer-motion";
import { UserX, AlertTriangle, X } from "lucide-react";
import { blockUser } from "../lib/firestore";
import { useAuthStore } from "../store/authStore";

export default function BlockModal({ target, onClose, onBlocked }) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmBlock = async () => {
    if (!user || !target) return;
    setLoading(true);
    setError("");

    try {
      await blockUser(user.uid, target);
      if (onBlocked) onBlocked(target);
      onClose();
    } catch (err) {
      console.error("Bloklashda xatolik:", err);
      setError("Amalni bajarib bo'lmadi. Qayta urinib ko'ring.");
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 p-5"
      >
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        <div className="text-center pt-2 pb-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
            <UserX size={28} />
          </div>

          <h3 className="font-extrabold text-base text-gray-900 mb-1">
            Bu foydalanuvchini bloklamoqchimisiz?
          </h3>

          <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
            <strong className="text-gray-800">{target?.displayName}</strong> bloklanganidan so'ng, u siz bilan bog'lana olmaydi, Discover'da chiqmaydi va mavjud match bekor qilinadi.
          </p>

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium flex items-center justify-center gap-1.5 border border-rose-100">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleConfirmBlock}
            disabled={loading}
            className="flex-1 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold disabled:opacity-50 hover:bg-rose-700 transition-all shadow-xs"
          >
            {loading ? "Bloklanmoqda..." : "Bloklash"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
