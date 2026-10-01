import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { createReport } from "../lib/firestore";
import { useAuthStore } from "../store/authStore";

const REPORT_REASONS = [
  { id: "spam", label: "Spam yoki reklama" },
  { id: "fake_profile", label: "Soxta profil (Fake)" },
  { id: "harassment", label: "Haqorat yoki tazyiq" },
  { id: "inappropriate", label: "Nomaqbul xatti-harakat" },
  { id: "scam", label: "Firibgarlik yoki pul so'rash" },
  { id: "other", label: "Boshqa sabab" },
];

export default function ReportModal({
  target,
  source = "profile",
  onClose,
  onBlockRequested,
}) {
  const { user, profile } = useAuthStore();
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0].label);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !target) return;
    setSubmitting(true);
    setError("");

    try {
      await createReport({
        reporterUid: user.uid,
        reporterName: profile?.displayName || user.displayName || "Foydalanuvchi",
        reportedUid: target.uid || target.id,
        reportedName: target.displayName || "Foydalanuvchi",
        reason: selectedReason,
        description: description.trim(),
        source,
      });

      setSubmitted(true);
    } catch (err) {
      console.error("Shikoyat yuborishda xatolik:", err);
      setError("Amalni bajarib bo'lmadi. Qayta urinib ko'ring.");
      setSubmitting(false);
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
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
        >
          <X size={18} />
        </button>

        {!submitted ? (
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 leading-tight">
                  Shikoyat qilish
                </h3>
                <p className="text-xs text-gray-500 truncate max-w-[200px]">
                  {target.displayName} haqida
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              Qoidabuzarlik yoki noo'rin xatti-harakat sababini tanlang. Shikoyatingiz anonim tarzda moderatorlar tomonidan ko'rib chiqiladi.
            </p>

            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-medium flex items-center gap-1.5 border border-rose-100">
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5 max-h-48 overflow-y-auto thin-scroll pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    onClick={() => setSelectedReason(r.label)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedReason === r.label
                        ? "bg-rose-50/70 border-rose-200 text-rose-700 font-semibold shadow-2xs"
                        : "bg-white hover:bg-gray-50 border-gray-100 text-gray-700"
                    }`}
                  >
                    <span>{r.label}</span>
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.label}
                      checked={selectedReason === r.label}
                      onChange={() => setSelectedReason(r.label)}
                      className="accent-[#fd5068]"
                    />
                  </label>
                ))}
              </div>

              <div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Qo'shimcha izoh yoki tafsilotlar (ixtiyoriy)..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-flame-start"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-full flame-bg text-white text-xs font-bold disabled:opacity-50 hover:opacity-95 transition-all shadow-xs"
                >
                  {submitting ? "Yuborilmoqda..." : "Shikoyatni yuborish"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-extrabold text-base text-gray-900 mb-1">
              Shikoyat qabul qilindi
            </h4>
            <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
              Xabaringiz uchun rahmat. Moderatorlarimiz ushbu profilni ko'rib chiqib, tegishli chora ko'radilar.
            </p>

            {onBlockRequested && (
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 mb-4 text-left">
                <p className="text-xs font-bold text-gray-800 mb-1">
                  Ushbu foydalanuvchini bloklamoqchimisiz?
                </p>
                <p className="text-[11px] text-gray-500 mb-3">
                  Bloklanganidan so'ng u sizga xabar yoza olmaydi va Discover'da ko'rinmaydi.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onBlockRequested(target);
                  }}
                  className="w-full py-2 rounded-full bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-2xs"
                >
                  Foydalanuvchini bloklash
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors"
            >
              Yopish
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
