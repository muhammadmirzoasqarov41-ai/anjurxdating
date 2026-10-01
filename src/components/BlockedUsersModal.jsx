import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, UserX, Shield, Check } from "lucide-react";
import { getBlockedUsers, unblockUser } from "../lib/firestore";
import { useAuthStore } from "../store/authStore";

export default function BlockedUsersModal({ onClose }) {
  const { user } = useAuthStore();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    loadBlocked();
  }, [user?.uid]);

  const loadBlocked = async () => {
    setLoading(true);
    try {
      const list = await getBlockedUsers(user.uid);
      setBlockedUsers(list);
    } catch (err) {
      console.error("Bloklanganlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (targetUid) => {
    if (!user?.uid || unblockingId) return;
    setUnblockingId(targetUid);
    try {
      await unblockUser(user.uid, targetUid);
      setBlockedUsers((prev) => prev.filter((u) => u.blockedUid !== targetUid && u.id !== targetUid));
      setSuccessMsg("Foydalanuvchi blokdan chiqarildi");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Blokdan chiqarishda xatolik:", err);
    } finally {
      setUnblockingId(null);
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
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <UserX size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900">
                Bloklangan foydalanuvchilar
              </h3>
              <p className="text-[11px] text-gray-400">
                {blockedUsers.length} ta foydalanuvchi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {successMsg && (
          <div className="mx-4 mt-3 p-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center gap-1.5 border border-emerald-100">
            <Check size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-2">
          {loading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                <Shield size={22} />
              </div>
              <p className="font-bold text-sm text-gray-700">
                Bloklangan foydalanuvchilar yo'q
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Siz hozircha hech kimni bloklamagansiz.
              </p>
            </div>
          ) : (
            blockedUsers.map((item) => {
              const targetUid = item.blockedUid || item.id;
              const isProcessing = unblockingId === targetUid;

              return (
                <div
                  key={targetUid}
                  className="flex items-center justify-between p-2.5 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/50 shadow-2xs gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.displayName}
                          className="w-10 h-10 object-cover rounded-full"
                        />
                      ) : (
                        <span className="font-bold text-xs text-gray-400">
                          {item.displayName?.[0]?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-gray-900 truncate">
                        {item.displayName || "Foydalanuvchi"}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        Bloklangan
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUnblock(targetUid)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors shrink-0 disabled:opacity-50"
                  >
                    {isProcessing ? "Ochilmoqda..." : "Blokdan chiqarish"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 bg-gray-50 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-full bg-white border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
          >
            Yopish
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
