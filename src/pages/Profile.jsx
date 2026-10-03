import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  MapPin,
  Briefcase,
  Shield,
  Heart,
  Edit3,
  Flame,
  Check,
  Navigation,
  Lock,
  RefreshCw,
  UserX,
  Eye,
  Camera,
  Star,
  Languages,
  ChevronRight,
  Sliders,
  ShieldCheck,
  Clock,
  AlertCircle,
  Copy,
  Share2,
  AtSign,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { isSuperAdminUser } from "../components/AdminRoute";
import { useLocationStore } from "../store/locationStore";
import {
  saveProfile,
  saveUserPreferences,
  updatePrivacySettings,
  updateUserPresence,
  getUserReportHistory,
} from "../lib/firestore";
import BlockedUsersModal from "../components/BlockedUsersModal";
import ProfileDetailModal from "../components/ProfileDetailModal";
import ProfileEditModal from "../components/ProfileEditModal";
import DatingPreferencesModal from "../components/DatingPreferencesModal";
import VerificationModal from "../components/VerificationModal";
import VerifiedBadge from "../components/VerifiedBadge";
import { getProfileCompletion, getProfileQuality } from "../lib/profileCompletion";

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showReportHistoryModal, setShowReportHistoryModal] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [editInitialTab, setEditInitialTab] = useState("photos");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [copiedFeedback, setCopiedFeedback] = useState(null);

  const handleCopyUsername = (e) => {
    e?.stopPropagation();
    if (!profile?.username) return;
    navigator.clipboard.writeText(`@${profile.username.replace(/^@/, "")}`);
    setCopiedFeedback("Username buferga nusxalandi!");
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const handleShareProfile = (e) => {
    e?.stopPropagation();
    const url = `${window.location.origin}/u/${profile?.username || user?.uid}`;
    if (navigator.share) {
      navigator.share({
        title: `${profile?.displayName || "AnjurXdating profili"}`,
        text: `Mening AnjurXdating profilim: @${profile?.username || ""}`,
        url,
      }).catch(() => {});
      return;
    }
    navigator.clipboard.writeText(url);
    setCopiedFeedback("Profil havolasi buferga nusxalandi!");
    setTimeout(() => setCopiedFeedback(null), 2500);
  };

  const {
    currentLocation,
    permissionStatus,
    shareLocation,
    showDistance,
    loading: locationLoading,
    requestLocation,
    setShareLocation,
    setShowDistance,
  } = useLocationStore();

  const privacy = profile?.privacy || {};
  const showOnlineStatus = privacy.showOnlineStatus !== false;
  const showLastSeen = privacy.showLastSeen !== false;
  const isPublic = privacy.isPublic !== false;

  // Real Profile Completion
  const completion = useMemo(() => {
    return getProfileCompletion(profile || {});
  }, [profile]);

  const quality = useMemo(() => {
    return getProfileQuality(profile || {});
  }, [profile]);

  const handleOpenReportHistory = async () => {
    setShowReportHistoryModal(true);
    if (user?.uid) {
      setLoadingReports(true);
      const list = await getUserReportHistory(user.uid);
      setReportHistory(list);
      setLoadingReports(false);
    }
  };

  // Preview profile object for ProfileDetailModal
  const previewProfile = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      uid: user?.uid,
      displayName: profile.displayName || "Foydalanuvchi",
      photos:
        Array.isArray(profile.photos) && profile.photos.length > 0
          ? profile.photos
          : [],
      age: profile.age,
      city: profile.city || "Toshkent",
      job: profile.job,
      bio: profile.bio,
      datingIntention: profile.datingIntention,
      languages: profile.languages || ["O'zbekcha"],
      interests: profile.interests || [],
      online: true,
      verified: Boolean(profile.verified || profile.isVerified),
      distanceKm: null,
    };
  }, [profile, user?.uid]);

  const handleOpenEdit = (tab = "basic") => {
    setEditInitialTab(tab);
    setShowEditModal(true);
  };

  const handleSaveProfileData = async (updatedData) => {
    if (!user) return;
    await saveProfile(user.uid, updatedData);
    await refreshProfile();
  };

  const handleSavePreferences = async (newPreferences) => {
    if (!user) return;
    await saveUserPreferences(user.uid, newPreferences);
    await refreshProfile();
  };

  const handleToggleOnlinePrivacy = async (checked) => {
    if (!user) return;
    try {
      const updated = { ...(profile?.privacy || {}), showOnlineStatus: checked };
      await updatePrivacySettings(user.uid, updated);
      if (!checked) {
        await updateUserPresence(user.uid, false);
      } else {
        await updateUserPresence(user.uid, true);
      }
      await refreshProfile();
    } catch (err) {
      console.error("Privacy yangilashda xatolik:", err);
    }
  };

  const handleToggleLastSeenPrivacy = async (checked) => {
    if (!user) return;
    try {
      const updated = { ...(profile?.privacy || {}), showLastSeen: checked };
      await updatePrivacySettings(user.uid, updated);
      await refreshProfile();
    } catch (err) {
      console.error("Privacy yangilashda xatolik:", err);
    }
  };

  const handleToggleVisibility = async (checked) => {
    if (!user) return;
    try {
      const updated = { ...(profile?.privacy || {}), isPublic: checked };
      await updatePrivacySettings(user.uid, updated);
      await refreshProfile();
    } catch (err) {
      console.error("Ko'rinishni yangilashda xatolik:", err);
    }
  };

  const photosList = Array.isArray(profile?.photos) ? profile.photos : [];

  return (
    <div className="max-w-md mx-auto px-4 py-6 select-none">
      <div className="rounded-3xl bg-white shadow-card overflow-hidden border border-gray-100">
        {/* Banner with gradient */}
        <div className="h-36 flame-bg relative flex items-center justify-end p-4">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs border border-white/20 active:scale-95"
            title="Boshqalar sizni qanday ko'rishini bilish"
          >
            <Eye size={14} />
            <span>Ko'rib chiqish</span>
          </button>
        </div>

        <div className="px-6 pb-6 -mt-14">
          {/* Avatar with photo edit trigger */}
          <div className="relative w-28 h-28 mx-auto">
            <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-100 mx-auto flex items-center justify-center shadow-card">
              {photosList[0] ? (
                <img
                  src={photosList[0]}
                  alt={profile?.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-gray-400">
                  {profile?.displayName?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleOpenEdit("photos")}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flame-bg text-white flex items-center justify-center shadow-md ring-2 ring-white hover:scale-105 active:scale-95 transition-all"
              title="Rasmni almashtirish"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* Name & Email */}
          <div className="text-center mt-3">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl font-black text-gray-900">
                {profile?.displayName}
                {profile?.age ? `, ${profile.age}` : ""}
              </h1>
              {Boolean(profile?.verified || profile?.isVerified) && (
                <VerifiedBadge size={18} />
              )}
            </div>

            {/* Username pill with copy & share */}
            {profile?.username ? (
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-rose-50/80 border border-rose-100 shadow-2xs">
                <span className="font-bold text-xs text-flame-start">
                  @{profile.username}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUsername}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                  title="Usernameni nusxalash"
                >
                  <Copy size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-white transition-colors"
                  title="Profil havolasini ulashish"
                >
                  <Share2 size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenEdit("username")}
                className="inline-flex items-center gap-1.5 mt-1.5 px-3.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition-all shadow-2xs"
              >
                <AtSign size={13} className="text-amber-600" />
                <span>Noyob @username tanlash</span>
              </button>
            )}

            {/* Toast feedback */}
            {copiedFeedback && (
              <p className="text-[11px] text-emerald-600 font-bold mt-1 animate-in fade-in">
                {copiedFeedback}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-1">{user?.email}</p>
          </div>

          {/* Verification Status Banner */}
          <div
            onClick={() => setShowVerificationModal(true)}
            className={`mt-4 p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 shadow-2xs group ${
              Boolean(profile?.verified || profile?.isVerified)
                ? "bg-sky-50/70 border-sky-200/80 hover:bg-sky-50"
                : profile?.verificationStatus === "pending"
                ? "bg-amber-50/70 border-amber-200/80 hover:bg-amber-50"
                : profile?.verificationStatus === "rejected"
                ? "bg-rose-50/70 border-rose-200/80 hover:bg-rose-50"
                : "bg-gray-50/90 border-gray-200/80 hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  Boolean(profile?.verified || profile?.isVerified)
                    ? "bg-sky-100 text-sky-600"
                    : profile?.verificationStatus === "pending"
                    ? "bg-amber-100 text-amber-600"
                    : profile?.verificationStatus === "rejected"
                    ? "bg-rose-100 text-rose-600"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {Boolean(profile?.verified || profile?.isVerified) ? (
                  <ShieldCheck size={20} />
                ) : profile?.verificationStatus === "pending" ? (
                  <Clock size={18} />
                ) : profile?.verificationStatus === "rejected" ? (
                  <AlertCircle size={18} />
                ) : (
                  <Shield size={18} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xs text-gray-900 block truncate">
                    {Boolean(profile?.verified || profile?.isVerified)
                      ? "Profil Tasdiqlangan"
                      : profile?.verificationStatus === "pending"
                      ? "Tasdiqlash ko'rib chiqilmoqda"
                      : profile?.verificationStatus === "rejected"
                      ? "Tasdiqlash rad etilgan"
                      : "Profilni tasdiqlang"}
                  </span>
                  {Boolean(profile?.verified || profile?.isVerified) && (
                    <VerifiedBadge size={14} />
                  )}
                </div>
                <span className="text-[10px] text-gray-500 block truncate">
                  {Boolean(profile?.verified || profile?.isVerified)
                    ? "Moviy nishon faol • 2x ko'proq tavsiyalar"
                    : profile?.verificationStatus === "pending"
                    ? "Moderatsiya tekshirmoqda (2-24 soat)"
                    : profile?.verificationStatus === "rejected"
                    ? "Sababni ko'rish va qayta topshirish"
                    : "Moviy nishon va 2x ko'proq tavsiyalar oling"}
                </span>
              </div>
            </div>

            <span className="text-[11px] font-bold text-flame-start group-hover:underline flex items-center gap-0.5 shrink-0">
              {Boolean(profile?.verified || profile?.isVerified)
                ? "Batafsil"
                : profile?.verificationStatus === "pending"
                ? "Holat"
                : profile?.verificationStatus === "rejected"
                ? "Qayta topshirish"
                : "Tasdiqlash"}
              <ChevronRight size={13} />
            </span>
          </div>

          {/* Profile Completion & Quality Card */}
          <div className="mt-3.5 p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 via-orange-50/50 to-white border border-rose-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-flame-start" fill="currentColor" />
                <span className="font-extrabold text-xs text-gray-800">
                  Profil to'liqligi va sifati
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${quality.badgeColor}`}
                >
                  {quality.level}
                </span>
                <span className="font-black text-sm flame-text">
                  {completion.percentage}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-gray-200/80 overflow-hidden">
              <div
                className="h-full flame-bg transition-all duration-500 rounded-full"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>

            {/* Incomplete checklist CTA */}
            {!completion.isComplete && completion.missingItems.length > 0 && (
              <div className="pt-2 border-t border-rose-100/60 space-y-1.5">
                <p className="text-[11px] font-bold text-gray-700">
                  Profilingizni to'ldiring (+{100 - completion.percentage}%):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {completion.missingItems.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.tab === "verification") {
                          setShowVerificationModal(true);
                        } else if (item.tab === "preferences") {
                          setShowPreferencesModal(true);
                        } else {
                          handleOpenEdit(item.tab);
                        }
                      }}
                      className="text-left px-2.5 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-rose-100 text-[11px] font-semibold text-gray-700 flex items-center justify-between gap-1 transition-all shadow-2xs active:scale-98"
                    >
                      <span className="truncate">○ {item.label}</span>
                      <ChevronRight size={12} className="text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Multiple Photos Gallery preview */}
          {photosList.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Rasmlarim ({photosList.length}/{6})
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEdit("photos")}
                  className="text-xs font-bold text-flame-start hover:underline"
                >
                  Boshqarish
                </button>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto thin-scroll pb-1">
                {photosList.map((src, i) => (
                  <div
                    key={i}
                    onClick={() => handleOpenEdit("photos")}
                    className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 cursor-pointer hover:border-flame-start transition-all"
                  >
                    <img
                      src={src}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 px-1 rounded bg-black/60 text-white text-[8px] font-bold">
                        Asosiy
                      </span>
                    )}
                  </div>
                ))}

                {photosList.length < 6 && (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit("photos")}
                    className="w-16 h-20 rounded-xl border border-dashed border-gray-300 hover:border-flame-start text-gray-400 hover:text-flame-start flex flex-col items-center justify-center gap-1 shrink-0 transition-colors"
                  >
                    <Camera size={16} />
                    <span className="text-[9px] font-bold">+ Qo'shish</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Quick info list */}
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {profile?.job && (
              <p className="flex items-center gap-2">
                <Briefcase size={16} className="text-gray-400" /> {profile.job}
              </p>
            )}
            {profile?.city && (
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" /> {profile.city}
              </p>
            )}
            {profile?.datingIntention && (
              <p className="flex items-center gap-2">
                <Heart size={16} className="text-rose-400" /> {profile.datingIntention}
              </p>
            )}
          </div>

          {/* Bio */}
          {profile?.bio ? (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
              {profile.bio}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenEdit("bio")}
              className="mt-4 w-full p-3 rounded-2xl border border-dashed border-gray-200 text-xs font-semibold text-gray-400 hover:text-flame-start hover:border-flame-start transition-colors text-center"
            >
              + O'zingiz haqingizda ma'lumot yozing (Bio)
            </button>
          )}

          {/* Interests */}
          {profile?.interests?.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Qiziqishlarim ({profile.interests.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-orange-50 text-flame-start text-xs font-semibold border border-orange-100 flex items-center gap-1"
                  >
                    <Flame size={11} fill="currentColor" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {profile?.languages?.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Muloqot tillari
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((lang, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1"
                  >
                    <Languages size={12} className="text-gray-400" />
                    <span>{lang}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Edit Profile & Dating Preferences */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => handleOpenEdit("basic")}
              className="py-3 px-3 rounded-2xl flame-bg text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-95 transition-all shadow-md"
            >
              <Edit3 size={15} />
              <span>Profilni Tahrirlash</span>
            </button>

            <button
              onClick={() => setShowPreferencesModal(true)}
              className="py-3 px-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
            >
              <Sliders size={15} className="text-flame-start" />
              <span>Afzalliklar</span>
            </button>
          </div>

          {/* Dating Preferences Overview Card */}
          <div
            onClick={() => setShowPreferencesModal(true)}
            className="mt-4 p-4 rounded-2xl bg-gray-50/90 hover:bg-gray-50 border border-gray-200/80 cursor-pointer transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                  <Sliders size={14} />
                </div>
                <span className="font-extrabold text-xs text-gray-900">
                  Tanishuv afzalliklari
                </span>
              </div>
              <span className="text-[11px] font-bold text-flame-start group-hover:underline flex items-center gap-0.5">
                Sozlash <ChevronRight size={13} />
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1 border-t border-gray-200/60">
              <div>
                <span className="text-gray-400 block text-[10px]">Yosh oralig'i:</span>
                <span className="font-bold text-gray-800">
                  {profile?.preferences?.minAge || 18} — {profile?.preferences?.maxAge || 50} yosh
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Kimlar:</span>
                <span className="font-bold text-gray-800">
                  {profile?.preferences?.gender === "female"
                    ? "Ayollar"
                    : profile?.preferences?.gender === "male"
                    ? "Erkaklar"
                    : "Barchasi"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Masofa:</span>
                <span className="font-bold text-gray-800">
                  {profile?.preferences?.maxDistanceKm
                    ? `${profile.preferences.maxDistanceKm} km gacha`
                    : "Cheklovsiz"}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">Maqsad:</span>
                <span className="font-bold text-gray-800 truncate block">
                  {profile?.preferences?.datingIntention && profile.preferences.datingIntention !== "all"
                    ? profile.preferences.datingIntention
                    : "Ixtiyoriy"}
                </span>
              </div>
            </div>
          </div>

          {/* Maxfiylik va Xavfsizlik (Privacy & Safety) */}
          <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Shield size={16} className="text-flame-start" />
                <span className="font-bold text-xs text-gray-800">
                  Maxfiylik va Xavfsizlik
                </span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  permissionStatus === "granted" && currentLocation
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    permissionStatus === "granted" && currentLocation
                      ? "bg-emerald-500"
                      : "bg-amber-500"
                  }`}
                />
                {permissionStatus === "granted" && currentLocation
                  ? currentLocation.city || "Joylashuv faol"
                  : "Aniqlanmagan"}
              </span>
            </div>

            {/* Privacy Toggles */}
            <div className="space-y-2.5 pt-1 border-t border-gray-200/60 text-xs">
              {/* Profil ko'rinishi (Discover'da ko'rinish) */}
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-semibold text-gray-700 block">
                    Profil ko'rinishi (Discover)
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Boshqalar sizni kashf qilishda ko'rishlari mumkin
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => handleToggleVisibility(e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>

              {/* Joylashuv ruxsati */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700 block">
                    Joylashuvdan foydalanish
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Yaqin atrofdagi profillarni topish uchun
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={shareLocation}
                  onChange={(e) => setShareLocation(user?.uid, e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>

              {/* Masofani ko'rsatish */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700 block">
                    Masofani ko'rsatish
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Boshqa userlarga taxminiy masofangizni ko'rsatish
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showDistance}
                  onChange={(e) => setShowDistance(user?.uid, e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>

              {/* Onlayn holatni ko'rsatish */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700 block">
                    Onlayn holatni ko'rsatish
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Boshqalarga onlayn ekanligingizni ko'rsatish
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showOnlineStatus}
                  onChange={(e) => handleToggleOnlinePrivacy(e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>

              {/* Oxirgi faollikni ko'rsatish */}
              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-gray-100">
                <div>
                  <span className="font-semibold text-gray-700 block">
                    Oxirgi faollikni ko'rsatish
                  </span>
                  <span className="text-[10px] text-gray-400">
                    Oxirgi kirgan vaqtingizni ko'rsatish
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showLastSeen}
                  onChange={(e) => handleToggleLastSeenPrivacy(e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>
            </div>

            {/* Blocked Users & Report History Buttons */}
            <div className="pt-2 border-t border-gray-200/60 space-y-2">
              <button
                type="button"
                onClick={() => setShowBlockedModal(true)}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <UserX size={15} className="text-rose-500" />
                  <span>Bloklangan foydalanuvchilar</span>
                </span>
                <span className="text-[11px] text-gray-400 font-semibold">
                  Boshqarish →
                </span>
              </button>

              <button
                type="button"
                onClick={handleOpenReportHistory}
                className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
              >
                <span className="flex items-center gap-2">
                  <Shield size={15} className="text-amber-500" />
                  <span>Mening shikoyatlarim (Report History)</span>
                </span>
                <span className="text-[11px] text-gray-400 font-semibold">
                  Ko'rish →
                </span>
              </button>
            </div>

            {/* Refresh Location Button */}
            <button
              type="button"
              onClick={() => user && requestLocation(user.uid, true)}
              disabled={locationLoading}
              className="w-full py-1.5 rounded-xl bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw
                size={12}
                className={locationLoading ? "animate-spin text-flame-start" : ""}
              />
              <span>
                {locationLoading ? "Aniqlanmoqda..." : "Joylashuvni yangilash"}
              </span>
            </button>

            {/* Privacy Notice */}
            <p className="flex items-start gap-1.5 text-[10px] text-gray-400 leading-tight pt-1">
              <Lock size={12} className="text-gray-400 shrink-0 mt-0.5" />
              <span>
                Aniq koordinatalaringiz yoki shaxsiy hisob ma'lumotlaringiz hech qachon oshkor qilinmaydi.
              </span>
            </p>
          </div>

          {/* Admin panel link if authorized */}
          {isSuperAdminUser(user) && (
            <Link
              to="/admin"
              className="mt-4 w-full py-3 rounded-full flame-bg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-xs"
            >
              <Shield size={18} /> Admin Panel
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={logout}
            className="mt-3 w-full py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </div>

      {/* Blocked Users Modal */}
      {showBlockedModal && (
        <BlockedUsersModal onClose={() => setShowBlockedModal(false)} />
      )}

      {/* Profile Detail Preview Modal */}
      {showPreviewModal && previewProfile && (
        <ProfileDetailModal
          profile={previewProfile}
          isPreview={true}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* Modular Profile Edit Modal */}
      {showEditModal && (
        <ProfileEditModal
          profile={profile}
          userId={user?.uid}
          initialTab={editInitialTab}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveProfileData}
        />
      )}

      {/* Dating Preferences Modal */}
      {showPreferencesModal && (
        <DatingPreferencesModal
          currentPreferences={profile?.preferences || {}}
          onClose={() => setShowPreferencesModal(false)}
          onSave={handleSavePreferences}
        />
      )}

      {/* Verification Modal */}
      {showVerificationModal && (
        <VerificationModal
          profile={profile}
          user={user}
          onClose={() => setShowVerificationModal(false)}
          onSuccess={() => {
            refreshProfile();
          }}
        />
      )}

      {/* User Report History Modal */}
      {showReportHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-card border border-gray-100 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">
                    Mening Shikoyatlarim
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Siz yuborgan shikoyatlar tarixi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportHistoryModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto thin-scroll flex-1 space-y-2">
              {loadingReports ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Yuklanmoqda...
                </div>
              ) : reportHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">
                  Siz hozircha hech qanday shikoyat yubormagansiz.
                </div>
              ) : (
                reportHistory.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        {rep.reportedUserName || "Foydalanuvchi"}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          rep.status === "resolved"
                            ? "bg-emerald-50 text-emerald-700"
                            : rep.status === "dismissed"
                            ? "bg-gray-200 text-gray-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {rep.status === "resolved"
                          ? "Hal qilindi"
                          : rep.status === "dismissed"
                          ? "Yopildi"
                          : "Ko'rib chiqilmoqda"}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Sabab: <span className="font-semibold text-gray-700">{rep.reason}</span>
                    </p>
                    {rep.description && (
                      <p className="text-[11px] text-gray-600 italic">
                        "{rep.description}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowReportHistoryModal(false)}
              className="w-full py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Yopish
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed px-4">
        O'zbekiston uchun rasmiy tanishuv dasturi.
      </p>
    </div>
  );
}
