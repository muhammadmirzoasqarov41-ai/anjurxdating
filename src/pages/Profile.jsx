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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { isSuperAdminUser } from "../components/AdminRoute";
import { useLocationStore } from "../store/locationStore";
import {
  saveProfile,
  updatePrivacySettings,
  updateUserPresence,
} from "../lib/firestore";
import BlockedUsersModal from "../components/BlockedUsersModal";
import ProfileDetailModal from "../components/ProfileDetailModal";
import ProfileEditModal from "../components/ProfileEditModal";
import { getProfileCompletion } from "../lib/profileCompletion";

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editInitialTab, setEditInitialTab] = useState("photos");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

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
                <span className="px-1.5 py-0.2 rounded-full bg-sky-50 text-sky-600 text-[10px] font-bold border border-sky-100">
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          </div>

          {/* Profile Completion Card */}
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-rose-50/70 via-orange-50/50 to-white border border-rose-100 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-flame-start" fill="currentColor" />
                <span className="font-extrabold text-xs text-gray-800">
                  Profil to'liqligi
                </span>
              </div>
              <span className="font-black text-sm flame-text">
                {completion.percentage}%
              </span>
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
                      onClick={() => handleOpenEdit(item.tab)}
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

          {/* Edit Profile Button */}
          <button
            onClick={() => handleOpenEdit("basic")}
            className="mt-5 w-full py-3 rounded-full flame-bg text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 active:scale-95 transition-all shadow-md"
          >
            <Edit3 size={16} />
            <span>Profilni Tahrirlash</span>
          </button>

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

            {/* Blocked Users Button */}
            <div className="pt-2 border-t border-gray-200/60">
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

      <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed px-4">
        AnjurXdating — O'zbekiston bo'ylab samimiy tanishuvlar va suhbatlar platformasi.
      </p>
    </div>
  );
}
