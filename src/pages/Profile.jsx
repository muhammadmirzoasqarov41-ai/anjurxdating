import { useState } from "react";
import { Link } from "react-router-dom";
import {
  LogOut,
  MapPin,
  Briefcase,
  Shield,
  Heart,
  Edit3,
  Flame,
  X,
  Check,
  Sliders,
  Navigation,
  Lock,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { isSuperAdminUser } from "../components/AdminRoute";
import { useLocationStore } from "../store/locationStore";
import { saveProfile } from "../lib/firestore";
import {
  STANDARD_INTERESTS,
  DATING_INTENTIONS,
  CITIES,
} from "../lib/matching";

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Edit form state
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || "",
    age: profile?.age || "",
    job: profile?.job || "",
    bio: profile?.bio || "",
    city: profile?.city || "Toshkent",
    datingIntention: profile?.datingIntention || DATING_INTENTIONS[0],
    interests: Array.isArray(profile?.interests) ? [...profile.interests] : [],
    preferences: {
      minAge: profile?.preferences?.minAge || 18,
      maxAge: profile?.preferences?.maxAge || 40,
      gender: profile?.preferences?.gender || "all",
    },
  });

  const handleOpenEdit = () => {
    setFormData({
      displayName: profile?.displayName || "",
      age: profile?.age || "",
      job: profile?.job || "",
      bio: profile?.bio || "",
      city: profile?.city || "Toshkent",
      datingIntention: profile?.datingIntention || DATING_INTENTIONS[0],
      interests: Array.isArray(profile?.interests) ? [...profile.interests] : [],
      preferences: {
        minAge: profile?.preferences?.minAge || 18,
        maxAge: profile?.preferences?.maxAge || 40,
        gender: profile?.preferences?.gender || "all",
      },
    });
    setShowEditModal(true);
  };

  const handleToggleInterest = (item) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(item);
      const updated = exists
        ? prev.interests.filter((i) => i !== item)
        : [...prev.interests, item];
      return { ...prev, interests: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveProfile(user.uid, {
        displayName: formData.displayName.trim() || profile?.displayName,
        age: formData.age ? Number(formData.age) : null,
        job: formData.job.trim() || null,
        bio: formData.bio.trim() || null,
        city: formData.city,
        datingIntention: formData.datingIntention,
        interests: formData.interests,
        preferences: formData.preferences,
      });

      await refreshProfile();
      setShowEditModal(false);
    } catch (err) {
      console.error("Profilni saqlashda xatolik:", err);
      alert("Profilni saqlashda xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="h-40 flame-bg" />
        <div className="px-6 pb-6 -mt-14">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-100 mx-auto flex items-center justify-center shadow-xs">
            {profile?.photos?.[0] ? (
              <img
                src={profile.photos[0]}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-gray-400">
                {profile?.displayName?.[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {/* Name & Email */}
          <div className="text-center mt-3">
            <h1 className="text-xl font-bold text-gray-900">
              {profile?.displayName}
              {profile?.age ? `, ${profile.age}` : ""}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>

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
          {profile?.bio && (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
              {profile.bio}
            </p>
          )}

          {/* Interests */}
          {profile?.interests?.length > 0 && (
            <div className="mt-4">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                Qiziqishlarim
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-full bg-orange-50 text-flame-start text-xs font-semibold border border-orange-100"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Joylashuv va Maxfiylik (Location & Privacy) */}
          <div className="mt-5 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Navigation size={15} className="text-flame-start" />
                <span className="font-bold text-xs text-gray-800">
                  Joylashuv va Maxfiylik
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
                  ? (currentLocation.city || "Joylashuv faol")
                  : "Aniqlanmagan"}
              </span>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-1 border-t border-gray-200/60 text-xs">
              {/* Joylashuv ruxsati */}
              <label className="flex items-center justify-between cursor-pointer">
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
                    Boshqa userlarga taxminiy masofani ko'rsatish
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={showDistance}
                  onChange={(e) => setShowDistance(user?.uid, e.target.checked)}
                  className="w-4 h-4 rounded text-flame-start accent-[#fd5068]"
                />
              </label>
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
              <span>{locationLoading ? "Aniqlanmoqda..." : "Joylashuvni yangilash"}</span>
            </button>

            {/* Privacy Notice */}
            <p className="flex items-start gap-1.5 text-[10px] text-gray-400 leading-tight pt-1">
              <Lock size={12} className="text-gray-400 shrink-0 mt-0.5" />
              <span>
                Aniq koordinatalaringiz yoki ko'cha manzilingiz hech qachon oshkor qilinmaydi.
                Masofa taxminiy hisoblanadi.
              </span>
            </p>
          </div>

          {/* Tahrirlash tugmasi */}
          <button
            onClick={handleOpenEdit}
            className="mt-6 w-full py-2.5 rounded-full border border-gray-200 hover:border-flame-start text-gray-700 hover:text-flame-start font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
          >
            <Edit3 size={15} /> Profilni va Tanishuv Afzalliklarini Tahrirlash
          </button>

          {isSuperAdminUser(user) && (
            <Link
              to="/admin"
              className="mt-3 w-full py-3 rounded-full flame-bg text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Shield size={18} /> Admin Panel
            </Link>
          )}

          <button
            onClick={logout}
            className="mt-3 w-full py-2.5 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={16} /> Chiqish
          </button>
        </div>
      </div>

      {/* EDIT PROFILE & DATING PREFERENCES MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-auto max-h-[85vh] flex flex-col border border-gray-100 animate-in fade-in">
            {/* Header */}
            <div className="flame-bg p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={18} fill="currentColor" />
                <h3 className="font-bold text-sm">
                  Profil va Tanishuv Afzalliklari
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto thin-scroll text-xs">
              {/* Ism va Yosh */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Ismingiz</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Yoshingiz</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs"
                  />
                </div>
              </div>

              {/* Kasb va Hudud */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Kasbingiz</label>
                  <input
                    type="text"
                    value={formData.job}
                    onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                    placeholder="Masalan: Dasturchi"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Shahar / Viloyat</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tanishuv Maqsadi */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Tanishuv Maqsadingiz</label>
                <select
                  value={formData.datingIntention}
                  onChange={(e) => setFormData({ ...formData, datingIntention: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs font-semibold"
                >
                  {DATING_INTENTIONS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Bio */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">O'zingiz haqingizda</label>
                <textarea
                  rows="3"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Xarakteringiz va qiziqishlaringiz haqida qisqacha..."
                  className="w-full p-2.5 rounded-xl bg-gray-50 border border-gray-200 outline-none text-xs resize-none"
                />
              </div>

              {/* Qiziqishlar tanlash */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">
                  Qiziqishlaringiz ({formData.interests.length} ta tanlandi)
                </label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-2xl border border-gray-200 max-h-36 overflow-y-auto thin-scroll">
                  {STANDARD_INTERESTS.map((item) => {
                    const isSelected = formData.interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleToggleInterest(item)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                          isSelected
                            ? "flame-bg text-white border-transparent shadow-2xs"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        {isSelected && "✓ "}
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tanishuv Afzalliklari (Kimlarni qidiryapsiz) */}
              <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-2">
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider block flex items-center gap-1">
                  <Sliders size={12} className="text-flame-start" /> Smart Matching Afzalliklari
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">Min yosh</span>
                    <input
                      type="number"
                      min="18"
                      max="60"
                      value={formData.preferences.minAge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: {
                            ...formData.preferences,
                            minAge: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block mb-0.5">Maks yosh</span>
                    <input
                      type="number"
                      min="18"
                      max="70"
                      value={formData.preferences.maxAge}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preferences: {
                            ...formData.preferences,
                            maxAge: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full px-2 py-1.5 rounded-lg bg-white border border-gray-200 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed px-4">
        AnjurXdating — O'zbekiston bo'ylab samimiy tanishuvlar va suhbatlar platformasi.
      </p>
    </div>
  );
}
