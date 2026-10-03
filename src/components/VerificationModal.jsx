import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldCheck,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Star,
  RotateCcw,
  ArrowRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import {
  VERIFICATION_GESTURES,
  submitVerificationRequest,
} from "../lib/verification";

export default function VerificationModal({
  profile = {},
  user = {},
  onClose,
  onSuccess,
}) {
  const isAlreadyVerified = Boolean(profile.verified || profile.isVerified);
  const isPending = profile.verificationStatus === "pending";
  const isRejected = profile.verificationStatus === "rejected";

  const [step, setStep] = useState(
    isAlreadyVerified ? "verified" : isPending ? "pending" : isRejected ? "rejected" : "intro"
  );

  const [selectedGesture, setSelectedGesture] = useState(
    VERIFICATION_GESTURES[0]
  );
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const handleSelectFile = (e) => {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Surat hajmi 5MB dan oshmasligi kerak");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Faqat fotosurat fayllari qabul qilinadi");
      return;
    }

    setPhotoFile(file);
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
  };

  const handleSubmit = async () => {
    if (!photoFile) {
      setErrorMsg("Iltimos, ishorani bajarib surat yuklang");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      await submitVerificationRequest({
        uid: user.uid,
        userProfile: profile,
        photoFile,
        gestureType: selectedGesture.id,
        note: userNote,
      });

      setStep("success");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Verification submit error:", err);
      setErrorMsg(
        err.message || "So'rovni yuborishda xatolik yuz berdi. Qayta urinib ko'ring."
      );
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 10 }}
        className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                Profilni Tasdiqlash
              </h3>
              <p className="text-[11px] text-gray-400">
                Ishonch va xavfsizlik (Trust & Safety)
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto thin-scroll flex-1">
          {/* STATE 1: ALREADY VERIFIED */}
          {step === "verified" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center shadow-inner">
                <ShieldCheck size={36} className="fill-sky-500/20" />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  Sizning profilingiz tasdiqlangan!
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Profilingiz rasmiy tekshiruvdan o'tgan. Boshqa foydalanuvchilar sizning ismingiz yonida ko'k Verified nishonini ko'rishadi.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 text-left text-xs text-sky-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Star size={14} className="text-sky-600" fill="currentColor" />
                  <span>Verified imtiyozlari faol:</span>
                </div>
                <ul className="text-[11px] space-y-1 text-sky-800 list-disc list-inside">
                  <li>Discover lentasida 2x ko'proq tavsiya etiladi</li>
                  <li>Smart Matching'da ishonch bonusi berilgan</li>
                  <li>"Faqat tasdiqlanganlar" filtri orqali ko'rinadi</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-full flame-bg text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
              >
                Tushunarli
              </button>
            </div>
          )}

          {/* STATE 2: PENDING REVIEW */}
          {step === "pending" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center shadow-inner">
                <Clock size={34} />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  So'rovingiz ko'rib chiqilmoqda
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Tasdiqlash so'rovingiz qabul qilingan. Moderatorlarimiz yuborilgan suratni profilingiz bilan solishtirmoqda.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-left text-xs text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <Shield size={14} /> Ko'rib chiqish muddati:
                </p>
                <p className="text-[11px] text-amber-800">
                  Odatda 2-24 soat vaqt oladi. Natija chiqqanida sizga ilova ichida bildirishnoma yuboriladi.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-full border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-all"
              >
                Yopish
              </button>
            </div>
          )}

          {/* STATE 3: REJECTED NOTICE */}
          {step === "rejected" && (
            <div className="text-center py-5 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center shadow-inner">
                <AlertCircle size={34} />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  Oldingi so'rov qabul qilinmadi
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Sabab:{" "}
                  <span className="font-bold text-rose-600">
                    {profile.verificationRejectionReason || "Surat talabga mos kelmadi"}
                  </span>
                </p>
              </div>

              <p className="text-[11px] text-gray-400">
                Xavotir olmang, qoidalarga rioya qilib yangi surat bilan qayta topshirishingiz mumkin.
              </p>

              <button
                type="button"
                onClick={() => setStep("intro")}
                className="w-full py-3 rounded-full flame-bg text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Qayta urinib ko'rish
              </button>
            </div>
          )}

          {/* STATE 4: INTRO & BENEFITS */}
          {step === "intro" && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-2.5 shadow-2xs">
                  <ShieldCheck size={32} className="fill-sky-500/20" />
                </div>
                <h4 className="text-base font-black text-gray-900">
                  Nima uchun tasdiqlash muhim?
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Tasdiqlangan profil sizning haqiqiy inson ekanligingizni isbotlaydi va suhbatdoshlarga ishonch bag'ishlaydi.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">
                      Moviy Verified Nishoni
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Ismingiz yonida rasmiy nishon paydo bo'ladi.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-rose-100 text-flame-start flex items-center justify-center shrink-0 mt-0.5">
                    <Star size={16} fill="currentColor" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">
                      2x Ko'proq Matchlar va Ko'rinish
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Smart Matching va Discover qidiruvida profillaringiz ustuvor o'rinda chiqadi.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 size={16} />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">
                      100% Maxfiylik Kafolati
                    </h5>
                    <p className="text-[11px] text-gray-500 leading-snug">
                      Tekshiruv uchun olingan surat hech qachon profilingizda yoki jamoatga ko'rsatilmaydi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setStep("photo")}
                  className="w-full py-3 rounded-full flame-bg text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Boshlash</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STATE 5: GESTURE & PHOTO CAPTURE */}
          {step === "photo" && (
            <div className="space-y-4">
              {/* Instructions */}
              <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 space-y-1">
                <span className="text-[11px] font-bold text-sky-800 block">
                  Topshiriq:
                </span>
                <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <span className="text-lg">{selectedGesture.emoji}</span>
                  <span>{selectedGesture.instruction}</span>
                </p>
              </div>

              {/* Gesture switcher */}
              <div>
                <span className="text-[11px] font-bold text-gray-500 block mb-1.5">
                  Imo-ishorani tanlang:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {VERIFICATION_GESTURES.map((g) => {
                    const isSelected = selectedGesture.id === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setSelectedGesture(g)}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/70 text-sky-900 shadow-2xs"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-base">{g.emoji}</span>
                        <span className="truncate">{g.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Photo Upload / Capture preview */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-500 block">
                  Tekshiruv surati:
                </span>

                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-4/3 bg-gray-900 flex items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Verification selfie"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors shadow-md"
                      title="Qayta olish"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-sky-400 rounded-2xl p-6 text-center cursor-pointer transition-all bg-gray-50/70 hover:bg-sky-50/30"
                  >
                    <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-500 mx-auto flex items-center justify-center mb-2">
                      <Camera size={22} />
                    </div>
                    <span className="text-xs font-bold text-gray-800 block">
                      Suratga tushing yoki fayl yuklang
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      JPG, PNG yoki WebP (max 5MB)
                    </span>
                  </div>
                )}

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  capture="user"
                  className="hidden"
                  onChange={handleSelectFile}
                />
              </div>

              {/* Error feedback */}
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep("intro")}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Orqaga
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!photoFile || submitting}
                  className="flex-1 py-2.5 rounded-full flame-bg text-white text-xs font-bold disabled:opacity-50 hover:opacity-95 transition-all shadow-xs flex items-center justify-center gap-1.5"
                >
                  {submitting ? "Yuklanmoqda..." : "So'rovni yuborish"}
                </button>
              </div>
            </div>
          )}

          {/* STATE 6: SUCCESS */}
          {step === "success" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 size={36} />
              </div>
              <div>
                <h4 className="text-lg font-black text-gray-900">
                  So'rov muvaffaqiyatli yuborildi!
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Profilingiz moderatsiya navbatiga qo'shildi. Natija haqida sizga bildirishnoma jo'natamiz.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-full flame-bg text-white text-xs font-bold shadow-xs hover:opacity-95 transition-all"
              >
                Tayyor
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
