import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  MapPin,
  Briefcase,
  Heart,
  Flame,
  ShieldCheck,
  Check,
  Compass,
  Star,
  Bookmark,
  Languages,
} from "lucide-react";
import { formatDistance } from "../lib/location";

export default function ProfileDetailModal({
  profile,
  onClose,
  onLike,
  onSuperLike,
  onNope,
  onToggleFavorite,
  isFavorited,
}) {
  const [photoIdx, setPhotoIdx] = useState(0);

  if (!profile) return null;

  const photos = profile.photos?.length ? profile.photos : [null];
  const compatibility = profile.compatibility || {
    score: 65,
    mutualInterests: [],
    matchReasons: [],
  };

  const myInterestsSet = new Set(
    (compatibility.mutualInterests || []).map((i) => i.toLowerCase().trim())
  );

  const isOnline = profile.online || profile.isOnline;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-auto max-h-[90vh] flex flex-col border border-gray-100">
        {/* Top Controls: Favorite & Close */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(profile)}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-xs"
              title={isFavorited ? "Saqlanganlardan o'chirish" : "Saqlash"}
            >
              <Bookmark
                size={16}
                className={isFavorited ? "text-amber-400 fill-amber-400" : "text-white"}
              />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-xs"
            title="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto thin-scroll">
          {/* Photos Carousel */}
          <div className="relative w-full h-80 bg-gray-900">
            {photos[photoIdx] ? (
              <img
                src={photos[photoIdx]}
                alt={profile.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flame-bg" />
            )}

            {/* Photo indicators */}
            {photos.length > 1 && (
              <div className="absolute top-3 left-3 right-20 flex gap-1 z-20">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      i === photoIdx ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Touch areas to switch photos */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 z-10 cursor-pointer"
              onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
            />
            <div
              className="absolute inset-y-0 right-0 w-1/2 z-10 cursor-pointer"
              onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
            />

            {/* Gradient shadow at bottom of image */}
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            {/* Basic Info on top of photo */}
            <div className="absolute bottom-3 left-4 right-4 text-white pointer-events-none">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">{profile.displayName}</h2>
                {profile.age && <span className="text-xl font-bold">{profile.age}</span>}
                {(profile.verified || profile.isVerified) && (
                  <span title="Tasdiqlangan profil" className="text-blue-400">
                    <ShieldCheck size={20} />
                  </span>
                )}
                {isOnline && (
                  <span
                    title="Hozir onlayn"
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white mb-0.5"
                  />
                )}
              </div>
              {profile.job && (
                <p className="flex items-center gap-1.5 text-xs text-white/90 mt-0.5">
                  <Briefcase size={13} /> {profile.job}
                </p>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 space-y-4">
            {/* Compatibility Score Card */}
            <div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-flame-start flex items-center gap-1.5">
                  <Flame size={15} fill="currentColor" /> Smart Moslik Darajasi
                </span>
                <span className="text-sm font-black text-flame-start">
                  {compatibility.score}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-orange-200/50 overflow-hidden">
                <div
                  style={{ width: `${compatibility.score}%` }}
                  className="h-full rounded-full flame-bg transition-all"
                />
              </div>

              <p className="text-[11px] text-gray-500">
                Ushbu moslik ko'rsatkichi ikkalangizning umumiy qiziqishlaringiz, tanishuv maqsadi va profildagi ma'lumotlar uyg'unligi asosida hisoblandi.
              </p>
            </div>

            {/* "Why this profile?" Section */}
            {compatibility.matchReasons?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass size={14} className="text-flame-start" /> Nega sizga mos?
                </h3>
                <div className="space-y-1.5">
                  {compatibility.matchReasons.map((reason, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                    >
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </div>
                      <span className="font-medium">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Distance */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              {profile.city && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 font-medium">
                  <MapPin size={13} className="text-gray-400" /> {profile.city}
                </span>
              )}
              {typeof profile.realDistanceKm === "number" ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 font-medium">
                  <MapPin size={13} className="text-gray-400" /> {formatDistance(profile.realDistanceKm)}
                </span>
              ) : !profile.city ? (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 font-medium text-gray-500">
                  <MapPin size={13} className="text-gray-400" /> Joylashuv noaniq
                </span>
              ) : null}
              {profile.datingIntention && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-medium border border-rose-100">
                  <Heart size={13} className="text-rose-500" /> {profile.datingIntention}
                </span>
              )}
            </div>

            {/* Full Bio */}
            {profile.bio && (
              <div className="space-y-1">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Men haqimda
                </h3>
                <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/50 p-3 rounded-2xl border border-gray-100 whitespace-pre-line">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Languages */}
            {profile.languages?.length > 0 && (
              <div className="space-y-1.5">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Languages size={13} className="text-gray-500" /> Muloqot tillari
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Interests Section */}
            {profile.interests?.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                  Qiziqishlar
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {profile.interests.map((interest, idx) => {
                    const isMutual = myInterestsSet.has(interest.toLowerCase().trim());
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          isMutual
                            ? "flame-bg text-white shadow-2xs"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {isMutual && <Flame size={11} fill="currentColor" />}
                        {interest}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions (Nope, Super Like, Like) */}
        <div className="p-3.5 bg-white border-t border-gray-100 flex items-center justify-center gap-4 flex-shrink-0">
          {/* Nope */}
          {onNope && (
            <button
              onClick={() => {
                onNope(profile);
                onClose();
              }}
              className="w-13 h-13 rounded-full bg-white shadow-card flex items-center justify-center text-nope hover:scale-105 active:scale-95 transition-transform border border-gray-100"
              title="Yoqmadi"
            >
              <X size={26} strokeWidth={3} />
            </button>
          )}

          {/* Super Like */}
          {onSuperLike && (
            <button
              onClick={() => {
                onSuperLike(profile);
                onClose();
              }}
              className="w-12 h-12 rounded-full bg-sky-50 shadow-card flex items-center justify-center text-superlike hover:scale-105 active:scale-95 transition-transform border border-sky-100"
              title="Super Like"
            >
              <Star size={22} fill="currentColor" />
            </button>
          )}

          {/* Like */}
          {onLike && (
            <button
              onClick={() => {
                onLike(profile);
                onClose();
              }}
              className="w-13 h-13 rounded-full bg-white shadow-card flex items-center justify-center text-like hover:scale-105 active:scale-95 transition-transform border border-gray-100"
              title="Yoqdi"
            >
              <Heart size={26} fill="currentColor" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
