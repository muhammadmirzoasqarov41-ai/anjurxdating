import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  X,
  CheckCheck,
  Heart,
  MessageCircle,
  Star,
  Flame,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";

function formatRelativeTime(timestamp) {
  if (!timestamp) return "Hozir";
  let date = null;
  if (timestamp.toDate) date = timestamp.toDate();
  else if (timestamp instanceof Date) date = timestamp;
  else if (typeof timestamp === "number") date = new Date(timestamp);
  if (!date || isNaN(date.getTime())) return "Hozir";

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return "Hozir";
  if (diffMin < 60) return `${diffMin} daq oldin`;
  if (diffHours < 24) return `${diffHours} soat oldin`;
  if (diffDays === 1) return "Kecha";
  if (diffDays < 7) return `${diffDays} kun oldin`;

  return `${date.getDate().toString().padStart(2, "0")}.${(
    date.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;
}

export default function NotificationCenter({ onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  const handleItemClick = async (notif) => {
    if (!user?.uid) return;
    if (!notif.read) {
      await markAsRead(user.uid, notif.id);
    }
    onClose();
    if (notif.route) {
      navigate(notif.route);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case "new_match":
        return (
          <div className="w-10 h-10 rounded-full flame-bg text-white flex items-center justify-center shrink-0 shadow-xs">
            <Heart size={18} fill="currentColor" />
          </div>
        );
      case "new_message":
        return (
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
            <MessageCircle size={18} />
          </div>
        );
      case "super_like":
        return (
          <div className="w-10 h-10 rounded-full bg-sky-50 text-sky-500 border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Star size={18} fill="currentColor" />
          </div>
        );
      case "like":
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 border border-amber-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Flame size={18} fill="currentColor" />
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 select-none"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                <Bell size={16} />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 leading-tight flex items-center gap-1.5">
                <span>Bildirishnomalar</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {unreadCount}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => user?.uid && markAllAsRead(user.uid)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="Barchasini o'qilgan deb belgilash"
              >
                <CheckCheck size={14} className="text-emerald-500" />
                <span className="hidden sm:inline">Barchasini o'qish</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto thin-scroll p-3 space-y-2">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-100">
                <Bell size={24} />
              </div>
              <h4 className="font-extrabold text-sm text-gray-800 mb-1">
                Bildirishnomalar yo'q
              </h4>
              <p className="text-xs text-gray-400 max-w-[220px] mx-auto leading-relaxed">
                Yangi xabarlar, matchlar va like'lar haqida shu yerda xabardor bo'lasiz.
              </p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.read;

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`relative flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer group ${
                    isUnread
                      ? "bg-rose-50/50 border-rose-100/90 shadow-2xs hover:bg-rose-50"
                      : "bg-white border-gray-100 hover:bg-gray-50 shadow-2xs"
                  }`}
                >
                  {/* Photo or icon */}
                  {item.senderPhoto ? (
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                      <img
                        src={item.senderPhoto}
                        alt={item.senderName || ""}
                        className="w-10 h-10 object-cover rounded-full"
                      />
                    </div>
                  ) : (
                    getIcon(item.type)
                  )}

                  {/* Text details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          isUnread
                            ? "font-extrabold text-gray-950"
                            : "font-bold text-gray-800"
                        }`}
                      >
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-[11px] leading-tight line-clamp-2 ${
                        isUnread ? "text-gray-800 font-medium" : "text-gray-500"
                      }`}
                    >
                      {item.message}
                    </p>
                  </div>

                  {/* Unread dot or delete icon */}
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        user?.uid && removeNotification(user.uid, item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-rose-500 transition-all p-1"
                      title="O'chirish"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-[11px] text-gray-400">
            <span>Jami: {notifications.length} ta</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => user?.uid && markAllAsRead(user.uid)}
                className="font-bold text-flame-start hover:underline"
              >
                Barchasini o'qilgan qilish
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
