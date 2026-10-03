import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  Sliders,
  RotateCcw,
  Check,
  AlertCircle,
  MapPin,
  Heart,
  ShieldCheck,
  Activity,
  Flame,
  Languages,
  Users,
  Compass,
} from "lucide-react";
import {
  STANDARD_INTERESTS,
  DATING_INTENTIONS,
  STANDARD_LANGUAGES,
  DEFAULT_PREFERENCES,
} from "../lib/matching";
import { useLocationStore } from "../store/locationStore";

export default function DatingPreferencesModal({
  currentPreferences = {},
  onClose,
  onSave,
}) {
  const { currentLocation, shareLocation } = useLocationStore();

  const [minAge, setMinAge] = useState(
    currentPreferences.minAge !== undefined ? Number(currentPreferences.minAge) : DEFAULT_PREFERENCES.minAge
  );
  const [maxAge, setMaxAge] = useState(
    currentPreferences.maxAge !== undefined ? Number(currentPreferences.maxAge) : DEFAULT_PREFERENCES.maxAge
  );
  const [gender, setGender] = useState(
    currentPreferences.gender || DEFAULT_PREFERENCES.gender
  );
  const [maxDistanceKm, setMaxDistanceKm] = useState(
    currentPreferences.maxDistanceKm !== undefined
      ? Number(currentPreferences.maxDistanceKm)
      : DEFAULT_PREFERENCES.maxDistanceKm
  );
  const [datingIntention, setDatingIntention] = useState(
    currentPreferences.datingIntention || DEFAULT_PREFERENCES.datingIntention
  );
  const [interests, setInterests] = useState(
    Array.isArray(currentPreferences.interests)
      ? [...currentPreferences.interests]
      : []
  );
  const [languages, setLanguages] = useState(
    Array.isArray(currentPreferences.languages)
      ? [...currentPreferences.languages]
      : []
  );
  const [onlyVerified, setOnlyVerified] = useState(
    Boolean(currentPreferences.onlyVerified)
  );
  const [onlyOnline, setOnlyOnline] = useState(
    Boolean(currentPreferences.onlyOnline)
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleReset = () => {
    setMinAge(DEFAULT_PREFERENCES.minAge);
    setMaxAge(DEFAULT_PREFERENCES.maxAge);
    setGender(DEFAULT_PREFERENCES.gender);
    setMaxDistanceKm(DEFAULT_PREFERENCES.maxDistanceKm);
    setDatingIntention(DEFAULT_PREFERENCES.datingIntention);
    setInterests([]);
    setLanguages([]);
    setOnlyVerified(false);
    setOnlyOnline(false);
    setErrorMsg("");
    setSuccessMsg("Afzalliklar standart holatga qaytarildi");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleToggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleToggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSave = async () => {
    setErrorMsg("");

    // Age validation
    const parsedMin = Number(minAge);
    const parsedMax = Number(maxAge);

    if (isNaN(parsedMin) || parsedMin < 18) {
      setErrorMsg("Minimal yosh 18 dan kam bo'lishi mumkin emas.");
      return;
    }

    if (isNaN(parsedMax) || parsedMax > 85) {
      setErrorMsg("Maksimal yosh 85 dan oshmasligi kerak.");
      return;
    }

    if (parsedMin > parsedMax) {
      setErrorMsg("Minimal yosh maksimal yoshdan katta bo'lishi mumkin emas.");
      return;
    }

    const payload = {
      minAge: parsedMin,
      maxAge: parsedMax,
      gender,
      maxDistanceKm: Number(maxDistanceKm) >= 0 ? Number(maxDistanceKm) : 0,
      datingIntention,
      interests,
      languages,
      onlyVerified,
      onlyOnline,
    };

    setSaving(true);
    try {
      await onSave(payload);
      setSuccessMsg("Tanishuv afzalliklari muvaffaqiyatli saqlandi!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error("Preferences saqlashda xatolik:", err);
      setErrorMsg("Saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
      setSaving(false);
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
              <Sliders size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
                Tanishuv afzalliklari
              </h3>
              <p className="text-[11px] text-gray-400">
                Discover va Smart Matching qidiruv mezonlari
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="Standartga qaytarish"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1.5">
            <Check size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto thin-scroll p-5 space-y-6">
          {/* SECTION 1: YOSH ORALIG'I (AGE RANGE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">
                  Yosh oralig'i
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold">
                  Majburiy
                </span>
              </div>
              <span className="font-extrabold text-xs flame-text">
                {minAge} — {maxAge} yosh
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] font-medium text-gray-500 block mb-1">
                  Min yosh (18+)
                </span>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-bold outline-none focus:ring-1 focus:ring-flame-start"
                />
              </div>
              <div>
                <span className="text-[11px] font-medium text-gray-500 block mb-1">
                  Maks yosh
                </span>
                <input
                  type="number"
                  min="18"
                  max="85"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 font-bold outline-none focus:ring-1 focus:ring-flame-start"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: KIMLARNI KO'RISHNI XOHLAYSIZ (GENDER) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-gray-900">
                Kimlarni ko'rishni xohlaysiz?
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold">
                Majburiy
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "Barchasi" },
                { id: "female", label: "Ayollar" },
                { id: "male", label: "Erkaklar" },
              ].map((opt) => {
                const isSelected = gender === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGender(opt.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? "flame-bg text-white shadow-2xs border-transparent"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: MAKSIMAL MASOFA (DISTANCE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">
                  Maksimal masofa
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold">
                  Majburiy
                </span>
              </div>
              <span className="font-extrabold text-xs flame-text">
                {maxDistanceKm === 0 ? "Cheklovsiz (Butun O'zbekiston)" : `${maxDistanceKm} km gacha`}
              </span>
            </div>

            <div className="space-y-1.5">
              <input
                type="range"
                min="0"
                max="300"
                step="5"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#fd5068]"
              />
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>0 km (Cheklovsiz)</span>
                <span>50 km</span>
                <span>150 km</span>
                <span>300 km</span>
              </div>
            </div>

            {currentLocation ? (
              <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                <MapPin size={12} />
                <span>Joylashuvingiz aniqlangan: {currentLocation.city || "Faol"}</span>
              </p>
            ) : (
              <p className="text-[11px] text-gray-400">
                Aniq koordinatalaringiz hech qachon oshkor etilmaydi.
              </p>
            )}
          </div>

          {/* SECTION 4: TANISHUV MAQSADI (DATING INTENTION) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-gray-900">
                Tanishuv maqsadi
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold">
                Ustuvor
              </span>
            </div>

            <div className="space-y-1.5">
              <label
                onClick={() => setDatingIntention("all")}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                  datingIntention === "all"
                    ? "bg-rose-50/70 border-rose-200 text-rose-900 font-bold"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium"
                }`}
              >
                <span>Barchasi (Ixtiyoriy)</span>
                <input
                  type="radio"
                  name="datingIntention"
                  checked={datingIntention === "all"}
                  onChange={() => setDatingIntention("all")}
                  className="accent-[#fd5068]"
                />
              </label>

              {DATING_INTENTIONS.map((intent) => {
                const isSelected = datingIntention === intent;
                return (
                  <label
                    key={intent}
                    onClick={() => setDatingIntention(intent)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer text-xs transition-all ${
                      isSelected
                        ? "bg-rose-50/70 border-rose-200 text-rose-900 font-bold"
                        : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium"
                    }`}
                  >
                    <span>{intent}</span>
                    <input
                      type="radio"
                      name="datingIntention"
                      checked={isSelected}
                      onChange={() => setDatingIntention(intent)}
                      className="accent-[#fd5068]"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* SECTION 5: QIZIQISHLAR (INTERESTS) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">
                  Qiziqishlar
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold">
                  Ustuvor
                </span>
              </div>
              {interests.length > 0 && (
                <span className="text-[11px] font-bold text-flame-start">
                  {interests.length} ta tanlandi
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-400">
              Bu qiziqishlarga ega profillar Smart Matching orqali yuqoriroq o'rinlarda chiqadi.
            </p>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {STANDARD_INTERESTS.map((item) => {
                const isSelected = interests.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleInterest(item)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "flame-bg text-white shadow-2xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 6: TILLAR (LANGUAGES) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900">
                  Muloqot tillari
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 text-[9px] font-bold">
                  Ustuvor
                </span>
              </div>
              {languages.length > 0 && (
                <span className="text-[11px] font-bold text-flame-start">
                  {languages.length} ta tanlandi
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {STANDARD_LANGUAGES.map((lang) => {
                const isSelected = languages.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleToggleLanguage(lang)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                      isSelected
                        ? "flame-bg text-white shadow-2xs"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 7: QUALITY TOGGLES (VERIFIED & ONLINE) */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <span className="font-bold text-xs text-gray-900 block">
              Sifat va faollik
            </span>

            {/* Faqat tasdiqlangan profillar */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Faqat tasdiqlangan profillar
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    Shaxsi tasdiqlangan foydalanuvchilarni ko'rsatish
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
              />
            </label>

            {/* Faqat onlayn profillar */}
            <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Activity size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-800 block">
                    Faqat faol / onlayn profillar
                  </span>
                  <span className="text-[10px] text-gray-400 block">
                    Hozir onlayn bo'lgan foydalanuvchilarni ko'rsatish
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
                className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
              />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-full flame-bg text-white text-xs font-bold disabled:opacity-50 hover:opacity-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            {saving ? "Saqlanmoqda..." : "Afzalliklarni saqlash"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
