import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  SlidersHorizontal,
  RotateCcw,
  Check,
  ShieldCheck,
  Activity,
  Flame,
  Languages,
} from "lucide-react";
import {
  STANDARD_INTERESTS,
  DATING_INTENTIONS,
  CITIES,
  STANDARD_LANGUAGES,
} from "../lib/matching";

export default function DiscoverFiltersModal({
  currentFilters = {},
  onClose,
  onApply,
}) {
  const [minAge, setMinAge] = useState(currentFilters.minAge || 18);
  const [maxAge, setMaxAge] = useState(currentFilters.maxAge || 45);
  const [gender, setGender] = useState(currentFilters.gender || "all");
  const [datingIntention, setDatingIntention] = useState(
    currentFilters.datingIntention || "all"
  );
  const [city, setCity] = useState(currentFilters.city || "all");
  const [selectedInterest, setSelectedInterest] = useState(
    currentFilters.interest || "all"
  );
  const [language, setLanguage] = useState(currentFilters.language || "all");
  const [verifiedOnly, setVerifiedOnly] = useState(
    Boolean(currentFilters.verifiedOnly)
  );
  const [onlineOnly, setOnlineOnly] = useState(
    Boolean(currentFilters.onlineOnly)
  );
  const [newOnly, setNewOnly] = useState(Boolean(currentFilters.newOnly));

  const handleReset = () => {
    setMinAge(18);
    setMaxAge(45);
    setGender("all");
    setDatingIntention("all");
    setCity("all");
    setSelectedInterest("all");
    setLanguage("all");
    setVerifiedOnly(false);
    setOnlineOnly(false);
    setNewOnly(false);
  };

  const handleApply = () => {
    onApply({
      minAge: Number(minAge),
      maxAge: Number(maxAge),
      gender,
      datingIntention,
      city,
      interest: selectedInterest,
      language,
      verifiedOnly,
      onlineOnly,
      newOnly,
    });
    onClose();
  };

  // Count active filters
  let activeCount = 0;
  if (minAge !== 18 || maxAge !== 45) activeCount++;
  if (gender !== "all") activeCount++;
  if (datingIntention !== "all") activeCount++;
  if (city !== "all") activeCount++;
  if (selectedInterest !== "all") activeCount++;
  if (language !== "all") activeCount++;
  if (verifiedOnly) activeCount++;
  if (onlineOnly) activeCount++;
  if (newOnly) activeCount++;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-auto max-h-[88vh] flex flex-col border border-gray-100">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-flame-start flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-gray-900">
                  Discover Filtrlari
                </h3>
                {activeCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full flame-bg text-white font-bold text-[10px]">
                    {activeCount} faol
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400">
                O'zingizga mos insonlarni tanlang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto thin-scroll text-xs">
          {/* Yosh Oralig'i */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800">Yosh Oralig'i</label>
              <span className="font-bold text-flame-start">
                {minAge} - {maxAge} yosh
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-gray-400 block mb-1">
                  Minimal yosh
                </span>
                <input
                  type="number"
                  min="18"
                  max="60"
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold"
                />
              </div>

              <div>
                <span className="text-[10px] text-gray-400 block mb-1">
                  Maksimal yosh
                </span>
                <input
                  type="number"
                  min="18"
                  max="65"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Jins (Gender) */}
          <div className="space-y-2">
            <label className="font-bold text-gray-800">Kimlarni qidiryapsiz?</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "all", label: "Hammasi" },
                { id: "female", label: "Ayollar" },
                { id: "male", label: "Erkaklar" },
              ].map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGender(g.id)}
                  className={`py-2 rounded-xl font-bold transition-all text-xs border ${
                    gender === g.id
                      ? "flame-bg text-white border-transparent shadow-2xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hudud / Shahar */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">Shahar / Hudud</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold text-gray-800"
            >
              <option value="all">Barcha hududlar</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Tanishuv Maqsadi */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">Tanishuv Maqsadi</label>
            <select
              value={datingIntention}
              onChange={(e) => setDatingIntention(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold text-gray-800"
            >
              <option value="all">Istalgan maqsad</option>
              {DATING_INTENTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Muloqot Tili */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800 flex items-center gap-1.5">
              <Languages size={13} className="text-gray-500" /> Muloqot tili
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold text-gray-800"
            >
              <option value="all">Istalgan til</option>
              {STANDARD_LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Maxsus Filtrlash Toggles */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <label className="font-bold text-gray-800 block">
              Maxsus parametrlar
            </label>

            {/* Tasdiqlangan profil */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <ShieldCheck size={16} className="text-blue-500" />
                Faqat tasdiqlangan profillar
              </span>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
              />
            </label>

            {/* Hozir onlayn */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Faqat onlayn bo'lganlar
              </span>
              <input
                type="checkbox"
                checked={onlineOnly}
                onChange={(e) => setOnlineOnly(e.target.checked)}
                className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
              />
            </label>

            {/* Yangi profillar */}
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
              <span className="flex items-center gap-2 font-medium text-gray-700">
                <Flame size={16} className="text-amber-500" />
                Yangi qo'shilgan profillar
              </span>
              <input
                type="checkbox"
                checked={newOnly}
                onChange={(e) => setNewOnly(e.target.checked)}
                className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
              />
            </label>
          </div>

          {/* Qiziqish bo'yicha filter */}
          <div className="space-y-2 pt-1 border-t border-gray-100">
            <label className="font-bold text-gray-800">
              Qiziqish bo'yicha saralash
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto thin-scroll p-1 border border-gray-100 rounded-xl bg-gray-50/50">
              <button
                type="button"
                onClick={() => setSelectedInterest("all")}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  selectedInterest === "all"
                    ? "flame-bg text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Barchasi
              </button>
              {STANDARD_INTERESTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSelectedInterest(item)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                    selectedInterest === item
                      ? "flame-bg text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-semibold px-2 py-1"
          >
            <RotateCcw size={13} /> Tozalash
          </button>

          <button
            onClick={handleApply}
            className="px-6 py-2.5 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity shadow-xs"
          >
            Filtrlarni qo'llash
          </button>
        </div>
      </div>
    </motion.div>
  );
}
