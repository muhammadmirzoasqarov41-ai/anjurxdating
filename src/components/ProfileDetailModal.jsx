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
  ShieldAlert,
  UserX,
  MoreVertical,
} from "lucide-react";
import { formatDistance } from "../lib/location";
import ReportModal from "./ReportModal";
import BlockModal from "./BlockModal";

export default function ProfileDetailModal({
  profile,
  onClose,
  onLike,
  onSuperLike,
  onNope,
  onToggleFavorite,
  isFavorited,
  onBlocked,
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

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
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      >
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-card overflow-hidden my-auto max-h-[90vh] flex flex-col border border-gray-100">
          {/* Top Controls: Favorite, Safety Menu, Close */}
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

            {/* Safety Options Menu */}
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors shadow-xs"
                title="Xavfsizlik amallari"
              >
                <MoreVertical size={16} />
              </button>
              {showActionMenu && (
                <div className="absolute right-0 top-10 w-44 bg-white rounded-2xl shadow-card border border-gray-100 py-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold transition-colors"
                  >
                    <ShieldAlert size={14} className="text-amber-500" />
                    <span>Shikoyat qilish</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      setShowBlockModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-rose-600 font-semibold border-t border-gray-100 transition-colors"
                  >
                    <UserX size={14} className="text-rose-500" />
                    <span>Bloklash</span>
                  </button>
                </div>
              )}
            </div>

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
                <div className="absolute top-3 left-3 right-24 flex gap-1 z-20">
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

              {/* Verified badge */}
              {(profile.verified || profile.isVerified) && (
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-xs font-bold shadow-xs">
                  <ShieldCheck size={14} className="text-sky-400" />
                  <span>Tasdiqlangan</span>
                </div>
              )}
            </div>

            {/* Profile Info Section */}
            <div className="p-5 space-y-4">
              {/* Name, Age, Status */}
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-black text-gray-900">
                    {profile.displayName}
                    {profile.age && <span className="font-light">, {profile.age}</span>}
                  </h2>
                  {isOnline && (
                    <span
                      className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white shrink-0"
                      title="Onlayn"
                    />
                  )}
                </div>

                {/* Subtitle Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 font-medium">
                  {profile.city && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} className="text-gray-400" />
                      {profile.city}
                    </span>
                  )}
                  {profile.distanceKm !== undefined && profile.distanceKm !== null && (
                    <span className="flex items-center gap-1 text-flame-start font-semibold">
                      <Compass size={13} />
                      {formatDistance(profile.distanceKm)}
                    </span>
                  )}
                  {profile.job && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={13} className="text-gray-400" />
                      {profile.job}
                    </span>
                  )}
                </div>
              </div>

              {/* Compatibility Match Highlight */}
              {compatibility && compatibility.score > 0 && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Flame size={14} className="text-flame-start" fill="currentColor" />
                      Moslik darajasi
                    </span>
                    <span className="text-sm font-black flame-text">
                      {compatibility.score}%
                    </span>
                  </div>

                  {compatibility.matchReasons?.length > 0 && (
                    <div className="space-y-1">
                      {compatibility.matchReasons.map((reason, idx) => (
                        <p
                          key={idx}
                          className="text-[11px] text-gray-600 flex items-start gap-1.5 leading-tight"
                        >
                          <Check size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bio Section */}
              {profile.bio && (
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                    Haqida
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Dating Intention */}
              {profile.datingIntention && (
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                    Tanishuv maqsadi
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                    <Star size={12} fill="currentColor" />
                    {profile.datingIntention}
                  </span>
                </div>
              )}

              {/* Languages */}
              {profile.languages?.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">
                    Tillar
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium flex items-center gap-1"
                      >
                        <Languages size={11} className="text-gray-400" />
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

              {/* Safety Footer Actions */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-4 text-xs font-semibold text-gray-400">
                <button
                  type="button"
                  onClick={() => setShowReportModal(true)}
                  className="hover:text-amber-600 transition-colors flex items-center gap-1.5 py-1"
                >
                  <ShieldAlert size={14} />
                  <span>Shikoyat qilish</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setShowBlockModal(true)}
                  className="hover:text-rose-600 transition-colors flex items-center gap-1.5 py-1"
                >
                  <UserX size={14} />
                  <span>Bloklash</span>
                </button>
              </div>
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
                className="w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center text-nope hover:scale-105 active:scale-95 transition-transform border border-gray-100"
                title="Yoqmadi"
              >
                <X size={24} strokeWidth={3} />
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
                className="w-12 h-12 rounded-full bg-white shadow-card flex items-center justify-center text-like hover:scale-105 active:scale-95 transition-transform border border-gray-100"
                title="Yoqdi"
              >
                <Heart size={24} fill="currentColor" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Safety Modals */}
      {showReportModal && (
        <ReportModal
          target={profile}
          source="profile"
          onClose={() => setShowReportModal(false)}
          onBlockRequested={() => {
            setShowBlockModal(true);
          }}
        />
      )}

      {showBlockModal && (
        <BlockModal
          target={profile}
          onClose={() => setShowBlockModal(false)}
          onBlocked={(target) => {
            if (onBlocked) onBlocked(target);
            onClose();
          }}
        />
      )}
    </>
  );
}
