import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Trash2,
  Star,
  Check,
  AlertCircle,
  Briefcase,
  MapPin,
  Languages,
  Eye,
  Camera,
  Heart,
  Shield,
  Sliders,
  ChevronRight,
  Flame,
  AtSign,
  RefreshCw,
  Send,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  STANDARD_INTERESTS,
  DATING_INTENTIONS,
  STANDARD_LANGUAGES,
  CITIES,
} from "../lib/matching";
import {
  validateImageFile,
  compressImage,
  uploadProfilePhotos,
  MAX_PHOTO_COUNT,
} from "../lib/storage";
import {
  checkUsernameAvailability,
  claimUsername,
  createUsernameRequest,
  validateUsernameFormat,
} from "../lib/username";

const TABS = [
  { id: "photos", label: "Rasmlar" },
  { id: "username", label: "@Username" },
  { id: "basic", label: "Asosiy" },
  { id: "bio", label: "Haqida" },
  { id: "interests", label: "Qiziqishlar" },
  { id: "intentions", label: "Maqsad" },
  { id: "languages", label: "Tillar" },
  { id: "privacy", label: "Ko'rinish" },
];

export default function ProfileEditModal({
  profile,
  userId,
  initialTab = "photos",
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Photos state
  const [photos, setPhotos] = useState(
    Array.isArray(profile?.photos) ? [...profile.photos] : []
  );
  const [uploadingIdx, setUploadingIdx] = useState(null);

  // Form fields
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [age, setAge] = useState(profile?.age || "");
  const [city, setCity] = useState(profile?.city || "Toshkent");
  const [job, setJob] = useState(profile?.job || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [datingIntention, setDatingIntention] = useState(
    profile?.datingIntention || DATING_INTENTIONS[0]
  );
  const [interests, setInterests] = useState(
    Array.isArray(profile?.interests) ? [...profile.interests] : []
  );
  const [languages, setLanguages] = useState(
    Array.isArray(profile?.languages) ? [...profile.languages] : ["O'zbekcha"]
  );
  const [customLanguage, setCustomLanguage] = useState("");
  const [customInterest, setCustomInterest] = useState("");

  // Privacy: isPublic (Profile visibility in Discover)
  const [isPublic, setIsPublic] = useState(
    profile?.privacy?.isPublic !== false
  );

  const fileInputRef = useRef(null);

  // Stage 12: Unique @username state
  const [usernameInput, setUsernameInput] = useState(profile?.username || "");
  const [usernameStatus, setUsernameStatus] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Debounced availability check
  useEffect(() => {
    const trimmed = usernameInput.replace(/^@/, "").trim();
    if (!trimmed) {
      setUsernameStatus(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(trimmed, userId);
        setUsernameStatus(res);
      } catch (err) {
        console.warn("Username availability error:", err);
      } finally {
        setCheckingUsername(false);
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [usernameInput, userId]);

  const handleSendUsernameRequest = async () => {
    const clean = usernameInput.replace(/^@/, "").trim();
    if (!clean) return;
    setSubmittingRequest(true);
    try {
      await createUsernameRequest(userId, profile, clean, requestReason);
      setRequestSubmitted(true);
      setShowRequestForm(false);
      setSuccessMsg("Username so'rovi ma'murlarga muvaffaqiyatli yuborildi!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setErrorMsg(err.message || "So'rov yuborishda xatolik yuz berdi");
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Photo handlers
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Reset input
    e.target.value = "";

    const validationErr = validateImageFile(file);
    if (validationErr) {
      setErrorMsg(validationErr);
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    if (photos.length >= MAX_PHOTO_COUNT) {
      setErrorMsg(`Maksimal ${MAX_PHOTO_COUNT} ta rasm yuklash mumkin.`);
      setTimeout(() => setErrorMsg(""), 4000);
      return;
    }

    const currentIdx = photos.length;
    setUploadingIdx(currentIdx);
    setErrorMsg("");

    try {
      const uploadedUrls = await uploadProfilePhotos(userId, [file]);
      if (uploadedUrls && uploadedUrls.length > 0) {
        setPhotos((prev) => [...prev, uploadedUrls[0]]);
        setSuccessMsg("Rasm muvaffaqiyatli yuklandi");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (err) {
      console.error("Rasm yuklashda xatolik:", err);
      setErrorMsg("Rasmni yuklab bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSetMainPhoto = (idx) => {
    if (idx === 0 || idx >= photos.length) return;
    const item = photos[idx];
    const newPhotos = [item, ...photos.filter((_, i) => i !== idx)];
    setPhotos(newPhotos);
  };

  const handleDeletePhoto = (idx) => {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleInterest = (item) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleAddCustomInterest = (e) => {
    e.preventDefault();
    const trimmed = customInterest.trim();
    if (!trimmed) return;
    if (!interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
    }
    setCustomInterest("");
  };

  const handleToggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleAddCustomLanguage = (e) => {
    e.preventDefault();
    const trimmed = customLanguage.trim();
    if (!trimmed) return;
    if (!languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed]);
    }
    setCustomLanguage("");
  };

  // Submit & Validation
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const trimmedName = displayName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg("Iltimos, ismingizni to'g'ri kiriting (kamida 2 belgi)");
      setActiveTab("basic");
      return;
    }

    if (age && (Number(age) < 18 || Number(age) > 85)) {
      setErrorMsg("Yosh 18 va 85 oralig'ida bo'lishi kerak");
      setActiveTab("basic");
      return;
    }

    if (bio && bio.length > 500) {
      setErrorMsg("Bio maksimal 500 ta belgidan oshmasligi kerak");
      setActiveTab("bio");
      return;
    }

    setSaving(true);
    try {
      let finalUsername = profile?.username || null;
      let finalNormalized = profile?.normalizedUsername || null;

      const cleanInput = usernameInput.replace(/^@/, "").trim();
      if (cleanInput && cleanInput !== (profile?.username || "")) {
        const val = validateUsernameFormat(cleanInput);
        if (!val.isValid) {
          setErrorMsg(val.error);
          setActiveTab("username");
          setSaving(false);
          return;
        }

        try {
          const claimRes = await claimUsername(userId, cleanInput);
          finalUsername = claimRes.username;
          finalNormalized = claimRes.normalizedUsername;
        } catch (claimErr) {
          setErrorMsg(claimErr.message || "Usernameni saqlab bo'lmadi");
          setActiveTab("username");
          setSaving(false);
          return;
        }
      }

      const updatedData = {
        displayName: trimmedName,
        photos,
        age: age ? Number(age) : null,
        city,
        job: job.trim() || null,
        bio: bio.trim() || null,
        datingIntention,
        interests,
        languages,
        username: finalUsername,
        normalizedUsername: finalNormalized,
        privacy: {
          ...(profile?.privacy || {}),
          isPublic,
        },
      };

      await onSave(updatedData);
      onClose();
    } catch (err) {
      console.error("Profilni saqlashda xatolik:", err);
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
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-card overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div>
            <h3 className="font-extrabold text-base text-gray-900 leading-tight">
              Profilni tahrirlash
            </h3>
            <p className="text-xs text-gray-400">
              Ommaviy ma'lumotlaringizni yangilang
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-1 px-4 py-2 bg-gray-50/70 border-b border-gray-100 overflow-x-auto thin-scroll shrink-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? "flame-bg text-white shadow-2xs"
                    : "text-gray-600 hover:bg-gray-200/60"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium flex items-center gap-1.5">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-5 mt-3 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
            <Check size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto thin-scroll p-5 space-y-5">
          {/* TAB 1: PHOTOS */}
          {activeTab === "photos" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-0.5">
                  Profil rasmlari ({photos.length}/{MAX_PHOTO_COUNT})
                </h4>
                <p className="text-xs text-gray-500">
                  Birinchi rasm asosiy bo'lib boshqalarga birinchi ko'rinadi. Istalgan rasmni asosiy qilib tanlashingiz mumkin.
                </p>
              </div>

              {/* 3x2 Grid */}
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: MAX_PHOTO_COUNT }).map((_, idx) => {
                  const photoUrl = photos[idx];
                  const isMain = idx === 0 && photoUrl;
                  const isCurrentUploading = uploadingIdx === idx;

                  return (
                    <div
                      key={idx}
                      className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 flex items-center justify-center transition-all ${
                        photoUrl
                          ? isMain
                            ? "border-flame-start shadow-xs"
                            : "border-gray-200"
                          : "border-dashed border-gray-300 hover:border-flame-start bg-gray-50/70"
                      }`}
                    >
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Main photo badge */}
                          {isMain && (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full flame-bg text-white text-[10px] font-black flex items-center gap-1 shadow-xs">
                              <Star size={10} fill="currentColor" /> Asosiy
                            </span>
                          )}

                          {/* Action controls overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(idx)}
                                className="w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                                title="O'chirish"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {!isMain && (
                              <button
                                type="button"
                                onClick={() => handleSetMainPhoto(idx)}
                                className="w-full py-1 rounded-xl bg-white/90 hover:bg-white text-gray-900 text-[10px] font-bold text-center transition-colors shadow-xs"
                              >
                                Asosiy qilish
                              </button>
                            )}
                          </div>
                        </>
                      ) : isCurrentUploading ? (
                        <div className="flex flex-col items-center gap-1 text-flame-start animate-pulse">
                          <div className="w-6 h-6 border-2 border-flame-start border-t-transparent rounded-full animate-spin" />
                          <span className="text-[10px] font-bold">Yuklanmoqda</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-flame-start transition-colors"
                        >
                          <Camera size={22} />
                          <span className="text-[10px] font-bold">Rasm qo'shish</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

              {photos.length < MAX_PHOTO_COUNT && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIdx !== null}
                  className="w-full py-2.5 rounded-2xl border border-dashed border-gray-300 hover:border-flame-start text-gray-600 hover:text-flame-start font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Upload size={15} />
                  <span>Yangi rasm tanlash (Galereyadan)</span>
                </button>
              )}
            </div>
          )}

          {/* TAB: USERNAME */}
          {activeTab === "username" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 mb-0.5 flex items-center gap-1.5">
                  <AtSign className="text-flame-start" size={17} />
                  <span>Noyob @Username Identifikatori</span>
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Do'stlaringiz va boshqa foydalanuvchilar sizni qidiruvdan topishlari hamda profil havolangizni ulashishingiz uchun ishlatiladi.
                </p>
              </div>

              {/* Input field with @ */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Username tanlang
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-gray-400 font-extrabold text-base">
                    @
                  </span>
                  <input
                    type="text"
                    value={usernameInput.replace(/^@/, "")}
                    onChange={(e) => {
                      const clean = e.target.value.toLowerCase().replace(/[^a-zA-Z0-9_]/g, "");
                      setUsernameInput(clean);
                    }}
                    placeholder="masalan: azizbek_01"
                    maxLength={20}
                    className="w-full pl-8 pr-10 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
                  />
                  <div className="absolute right-3 top-2.5 flex items-center">
                    {checkingUsername && (
                      <RefreshCw size={16} className="text-gray-400 animate-spin" />
                    )}
                    {!checkingUsername && usernameStatus?.status === "available" && (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    )}
                    {!checkingUsername && usernameStatus?.status === "current" && (
                      <Check size={18} className="text-sky-500" />
                    )}
                    {!checkingUsername &&
                      (usernameStatus?.status === "taken" ||
                        usernameStatus?.status === "reserved" ||
                        usernameStatus?.status === "invalid" ||
                        usernameStatus?.status === "cooldown") && (
                        <AlertCircle size={18} className="text-rose-500" />
                      )}
                  </div>
                </div>

                {/* Status Indicator */}
                {usernameStatus && (
                  <div className="mt-2 text-xs">
                    {usernameStatus.status === "available" && (
                      <p className="text-emerald-700 font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                        <span>@{usernameStatus.cleanUsername} mavjud va foydalanish mumkin! ✓</span>
                      </p>
                    )}
                    {usernameStatus.status === "current" && (
                      <p className="text-sky-700 font-bold flex items-center gap-1.5">
                        <Check size={14} className="text-sky-600 shrink-0" />
                        <span>Bu sizning hozirgi faol usernamingiz.</span>
                      </p>
                    )}
                    {usernameStatus.status === "taken" && (
                      <p className="text-rose-600 font-semibold flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>Bu username band. Iltimos, boshqa nom tanlang.</span>
                      </p>
                    )}
                    {usernameStatus.status === "reserved" && (
                      <div className="space-y-2">
                        <p className="text-rose-600 font-semibold flex items-center gap-1.5">
                          <AlertCircle size={14} className="shrink-0" />
                          <span>Bu username foydalanish uchun mavjud emas.</span>
                        </p>
                        {!showRequestForm && !requestSubmitted && (
                          <button
                            type="button"
                            onClick={() => setShowRequestForm(true)}
                            className="text-xs font-bold text-flame-start hover:underline flex items-center gap-1"
                          >
                            <span>Ushbu nom uchun ma'muriyatga so'rov yubormoqchimisiz?</span>
                          </button>
                        )}
                      </div>
                    )}
                    {usernameStatus.status === "cooldown" && (
                      <p className="text-amber-700 font-semibold flex items-center gap-1.5">
                        <Clock size={14} className="shrink-0" />
                        <span>{usernameStatus.message}</span>
                      </p>
                    )}
                    {usernameStatus.status === "invalid" && (
                      <p className="text-rose-600 font-medium flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{usernameStatus.message}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Reserved Request Form */}
              {showRequestForm && !requestSubmitted && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <h5 className="font-extrabold text-amber-900 flex items-center gap-1.5">
                      <Shield size={14} />
                      <span>Rasmiy Username So'rovi</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <p className="text-amber-800 text-[11px] leading-relaxed">
                    Agar siz ushbu brend, tashkilot yoki rasmiy shaxs vakili bo'lsangiz, sababini ko'rsatgan holda so'rov yuboring. Ma'murlar ko'rib chiqib sizga biriktiradi.
                  </p>
                  <textarea
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Masalan: Men ushbu rasmiy brend/tashkilot asoschisiman..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-xs text-gray-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleSendUsernameRequest}
                    disabled={submittingRequest || !requestReason.trim()}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    {submittingRequest ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Send size={13} />
                    )}
                    <span>So'rovni Yuborish</span>
                  </button>
                </div>
              )}

              {/* Request Success message */}
              {requestSubmitted && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>So'rovingiz qabul qilindi va ko'rib chiqilmoqda!</span>
                </div>
              )}

              {/* Guidelines Card */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 space-y-1.5">
                <span className="font-bold text-gray-800 block mb-1">
                  Username qoidalari:
                </span>
                <ul className="text-[11px] space-y-1 list-disc list-inside text-gray-500">
                  <li>3 dan 20 gacha belgidan iborat bo'lishi kerak</li>
                  <li>Faqat lotin harflari (a-z), raqamlar (0-9) va pastki chiziq (_)</li>
                  <li>Katta va kichik harflar bir xil hisoblanadi (@Ali = @ali)</li>
                  <li>Har bir username butun platformada yagona va takrorlanmas</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: BASIC INFO */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Ismingiz *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ismingiz"
                  maxLength={50}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-flame-start font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Yoshingiz (18+) *
                  </label>
                  <input
                    type="number"
                    min="18"
                    max="85"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="23"
                    className="w-full px-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-flame-start font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Shahringiz *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-flame-start font-medium"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Kasb / Faoliyat (ixtiyoriy)
                </label>
                <div className="relative">
                  <Briefcase
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={job}
                    onChange={(e) => setJob(e.target.value)}
                    placeholder="Masalan: Dizayner, Dasturchi, Muallim"
                    maxLength={60}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-flame-start font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABOUT ME (BIO) */}
          {activeTab === "bio" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  O'zingiz haqingizda (Bio)
                </label>
                <span
                  className={`text-[11px] font-semibold ${
                    bio.length > 450 ? "text-amber-500" : "text-gray-400"
                  }`}
                >
                  {bio.length} / 500
                </span>
              </div>

              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="O'zingiz, xarakteringiz, qanday insonlar bilan tanishishni yoqtirishingiz haqida samimiy yozing..."
                maxLength={500}
                rows={5}
                className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-200 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-flame-start font-medium resize-none leading-relaxed"
              />

              <p className="text-[11px] text-gray-400 leading-normal">
                Eslatma: Bio Discover profil kartasida boshqa foydalanuvchilarga ko'rinadi. Shaxsiy ma'lumotlar (telefon, email) yozmaslik tavsiya etiladi.
              </p>
            </div>
          )}

          {/* TAB 4: INTERESTS */}
          {activeTab === "interests" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-0.5">
                  Qiziqishlar ({interests.length} ta tanlandi)
                </h4>
                <p className="text-xs text-gray-500">
                  Umumiy qiziqishlar Smart Matching orqali sizga eng mos profillarni topishda ishlatiladi.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {STANDARD_INTERESTS.map((item) => {
                  const isSelected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleToggleInterest(item)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
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

              {/* Custom interest form */}
              <form
                onSubmit={handleAddCustomInterest}
                className="flex items-center gap-2 pt-2 border-t border-gray-100"
              >
                <input
                  type="text"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  placeholder="Boshqa qiziqish qo'shish..."
                  maxLength={30}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-flame-start"
                />
                <button
                  type="submit"
                  disabled={!customInterest.trim()}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs disabled:opacity-40 hover:bg-black transition-colors"
                >
                  Qo'shish
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: DATING INTENTION */}
          {activeTab === "intentions" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-0.5">
                  Tanishuv maqsadi
                </h4>
                <p className="text-xs text-gray-500">
                  Ilovadan nima kutayotganingizni ochiq ko'rsatish mos insonlarni topishni osonlashtiradi.
                </p>
              </div>

              <div className="space-y-2">
                {DATING_INTENTIONS.map((intention) => {
                  const isSelected = datingIntention === intention;
                  return (
                    <label
                      key={intention}
                      onClick={() => setDatingIntention(intention)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-rose-50/70 border-rose-200 text-rose-800 font-bold shadow-2xs"
                          : "bg-white hover:bg-gray-50 border-gray-100 text-gray-700 font-medium"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart
                          size={16}
                          className={isSelected ? "text-flame-start fill-flame-start" : "text-gray-400"}
                        />
                        <span className="text-xs">{intention}</span>
                      </div>
                      <input
                        type="radio"
                        name="datingIntention"
                        value={intention}
                        checked={isSelected}
                        onChange={() => setDatingIntention(intention)}
                        className="accent-[#fd5068]"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: LANGUAGES */}
          {activeTab === "languages" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-0.5">
                  Muloqot tillari
                </h4>
                <p className="text-xs text-gray-500">
                  Qaysi tillarda erkin suhbatlasha olasiz?
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {STANDARD_LANGUAGES.map((lang) => {
                  const isSelected = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => handleToggleLanguage(lang)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSelected
                          ? "flame-bg text-white shadow-2xs"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
                {languages
                  .filter((l) => !STANDARD_LANGUAGES.includes(l))
                  .map((customLang) => (
                    <button
                      key={customLang}
                      type="button"
                      onClick={() => handleToggleLanguage(customLang)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold flame-bg text-white shadow-2xs flex items-center gap-1"
                    >
                      <span>{customLang}</span>
                      <X size={12} />
                    </button>
                  ))}
              </div>

              <form
                onSubmit={handleAddCustomLanguage}
                className="flex items-center gap-2 pt-2 border-t border-gray-100"
              >
                <input
                  type="text"
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Boshqa til qo'shish..."
                  maxLength={30}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 outline-none focus:ring-1 focus:ring-flame-start"
                />
                <button
                  type="submit"
                  disabled={!customLanguage.trim()}
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold text-xs disabled:opacity-40 hover:bg-black transition-colors"
                >
                  Qo'shish
                </button>
              </form>
            </div>
          )}

          {/* TAB 7: PROFILE VISIBILITY */}
          {activeTab === "privacy" && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 mb-0.5">
                  Profil ko'rinishi
                </h4>
                <p className="text-xs text-gray-500">
                  Profilingizni boshqalarga ko'rsatishni boshqaring.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">
                      Discover'da ko'rinish
                    </span>
                    <span className="text-[11px] text-gray-400 block mt-0.5 leading-tight">
                      {isPublic
                        ? "Profilingiz boshqa foydalanuvchilarga qidiruv va Discover kartalarida ko'rinadi."
                        : "Profilingiz vaqtincha Discover kartalarida yashirilgan."}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 rounded text-flame-start accent-[#fd5068]"
                  />
                </label>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                Agar profilni yashirsangiz, sizga yangi Like'lar kelmaydi, biroq mavjud matchlar va suhbatlaringiz o'zgarishsiz saqlanib qoladi.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || uploadingIdx !== null}
            className="px-6 py-2.5 rounded-full flame-bg text-white text-xs font-bold disabled:opacity-50 hover:opacity-95 transition-all shadow-xs flex items-center gap-1.5"
          >
            {saving ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
