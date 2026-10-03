import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  MapPin,
  Briefcase,
  Heart,
  Star,
  MessageCircle,
  MoreVertical,
  ShieldAlert,
  UserX,
  Compass,
  AlertCircle,
  User,
  Flame,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useDeckStore } from "../store/deckStore";
import { useChatStore } from "../store/chatStore";
import { getProfileByUsername } from "../lib/username";
import { matchIdFor } from "../lib/firestore";
import VerifiedBadge from "../components/VerifiedBadge";
import ReportModal from "../components/ReportModal";
import BlockModal from "../components/BlockModal";

export default function UserProfile() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { swipeRight, superLike } = useDeckStore();
  const { matches } = useChatStore();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [liked, setLiked] = useState(false);
  const [superLikedState, setSuperLikedState] = useState(false);

  useEffect(() => {
    async function load() {
      if (!username) return;
      setLoading(true);
      try {
        const data = await getProfileByUsername(username, user?.uid);
        if (data?.isBlocked) {
          setIsBlocked(true);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error("Load user profile error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username, user?.uid]);

  // Check if matched
  const matched = profile?.uid && user?.uid
    ? matches.some((m) => m.users.includes(profile.uid))
    : false;

  const handleShare = async () => {
    if (!profile) return;
    const url = window.location.href;
    const shareText = `AnjurXdating'da @${profile.username} profilini ko'ring!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.displayName} (@${profile.username})`,
          text: shareText,
          url,
        });
        return;
      } catch (err) {
        // Fallback to copy if cancelled/unsupported
      }
    }

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyUsername = () => {
    if (!profile?.username) return;
    navigator.clipboard.writeText(`@${profile.username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLike = () => {
    if (!profile?.uid) return;
    swipeRight(profile.uid);
    setLiked(true);
  };

  const handleSuperLike = () => {
    if (!profile?.uid) return;
    superLike(profile.uid);
    setSuperLikedState(true);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white p-4 space-y-4 animate-pulse">
        <div className="h-10 w-28 bg-gray-200 rounded-full" />
        <div className="h-96 bg-gray-200 rounded-3xl" />
        <div className="h-6 w-1/2 bg-gray-200 rounded" />
        <div className="h-4 w-1/3 bg-gray-100 rounded" />
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
          <UserX size={32} />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">Ushbu profil mavjud emas</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          Xavfsizlik qoidalari yoki bloklanganlik holati sababli bu profilni ko'rish imkoni yo'q.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-5 px-6 py-2.5 rounded-full flame-bg text-white font-bold text-xs shadow-xs"
        >
          Discover'ga qaytish
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-4">
          <User size={32} />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900">Foydalanuvchi topilmadi</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-xs">
          "@{username}" username'iga ega foydalanuvchi mavjud emas yoki nomi o'zgartirilgan.
        </p>
        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => navigate("/search")}
            className="px-5 py-2.5 rounded-full bg-gray-900 text-white font-bold text-xs"
          >
            Qidiruvga o'tish
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 rounded-full bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200"
          >
            Bosh sahifa
          </button>
        </div>
      </div>
    );
  }

  const photos = profile.photos?.length ? profile.photos : [null];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 pb-16 select-none relative">
      {/* Top Floating Navigation */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
          title="Orqaga"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center min-w-0 px-2">
          <p className="text-xs font-bold text-gray-900 truncate">
            @{profile.username}
          </p>
          <p className="text-[10px] text-gray-400">AnjurXdating profili</p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
            title="Profilni ulashish"
          >
            <Share2 size={16} />
          </button>

          {!profile.isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionMenu(!showActionMenu)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
              >
                <MoreVertical size={16} />
              </button>

              {showActionMenu && (
                <div className="absolute right-0 top-11 w-44 bg-white rounded-2xl shadow-card border border-gray-100 py-1.5 z-40 text-xs">
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-gray-700 font-semibold"
                  >
                    <ShieldAlert size={14} className="text-amber-500" />
                    <span>Shikoyat qilish</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionMenu(false);
                      setShowBlockModal(true);
                    }}
                    className="w-full px-3.5 py-2 text-left hover:bg-rose-50 flex items-center gap-2 text-rose-600 font-semibold"
                  >
                    <UserX size={14} />
                    <span>Bloklash</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Copy toast */}
      {copied && (
        <div className="fixed top-16 inset-x-4 max-w-sm mx-auto z-40 p-3 rounded-2xl bg-gray-900 text-white text-xs font-bold text-center shadow-lg flex items-center justify-center gap-2 animate-in fade-in">
          <Check size={16} className="text-emerald-400" />
          <span>Profil havolasi buferga nusxalandi!</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-4 space-y-4">
        {/* Photo Gallery with Carousel */}
        <div className="relative aspect-3/4 rounded-3xl overflow-hidden bg-gray-200 shadow-card border border-gray-200">
          {photos[photoIdx] ? (
            <img
              src={photos[photoIdx]}
              alt={profile.displayName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl font-black text-gray-400">
              {profile.displayName?.[0]?.toUpperCase()}
            </div>
          )}

          {/* Photo indicator dots */}
          {photos.length > 1 && (
            <div className="absolute top-3 inset-x-3 z-20 flex gap-1.5">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
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

          {/* Online badge */}
          {profile.online && (
            <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-xs text-white text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hozir onlayn</span>
            </div>
          )}
        </div>

        {/* User Identity Details */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-card space-y-3.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-gray-900">
                {profile.displayName}
                {profile.age ? `, ${profile.age}` : ""}
              </h1>
              {profile.verified && <VerifiedBadge size={22} />}
            </div>

            {/* Username chip */}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-flame-start bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                @{profile.username}
              </span>
              <button
                type="button"
                onClick={handleCopyUsername}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                title="Usernameni nusxalash"
              >
                <Copy size={13} />
              </button>
            </div>

            {/* City / Job */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 font-medium">
              {profile.city && (
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-gray-400" />
                  {profile.city}
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

          {/* Bio */}
          {profile.bio && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Haqida
              </h4>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Dating Intention */}
          {profile.datingIntention && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Tanishuvdan maqsad
              </h4>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-flame-start text-xs font-bold border border-rose-100">
                <Heart size={13} fill="currentColor" />
                <span>{profile.datingIntention}</span>
              </span>
            </div>
          )}

          {/* Interests */}
          {profile.interests?.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                Qiziqishlar
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {profile.interests.map((it) => (
                  <span
                    key={it}
                    className="px-3 py-1 rounded-full bg-gray-50 text-gray-700 text-xs font-semibold border border-gray-100"
                  >
                    #{it}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls for Other Users */}
        {!profile.isOwner ? (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-card flex items-center justify-center gap-4">
            {matched ? (
              <button
                type="button"
                onClick={() => {
                  const mId = matchIdFor(user?.uid, profile.uid);
                  navigate(`/chat/${mId}`);
                }}
                className="flex-1 py-3 rounded-2xl flame-bg text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:opacity-95"
              >
                <MessageCircle size={16} />
                <span>Suhbatga o'tish</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSuperLike}
                  disabled={superLikedState}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-md active:scale-95 ${
                    superLikedState
                      ? "border-superlike bg-sky-50 text-superlike"
                      : "border-sky-300 text-superlike hover:bg-sky-50"
                  }`}
                  title="Super Like"
                >
                  <Star size={24} fill={superLikedState ? "currentColor" : "none"} />
                </button>

                <button
                  type="button"
                  onClick={handleLike}
                  disabled={liked}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
                    liked
                      ? "bg-emerald-500 text-white"
                      : "flame-bg text-white hover:opacity-95"
                  }`}
                >
                  <Heart size={18} fill="currentColor" />
                  <span>{liked ? "Like yuborildi!" : "Yoqdi (Like)"}</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-card text-center">
            <p className="text-xs text-gray-500 mb-2.5">
              Bu sizning ommaviy profillaringiz ko'rinishi
            </p>
            <Link
              to="/profile"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full flame-bg text-white font-bold text-xs shadow-xs"
            >
              <span>Profilni tahrirlash</span>
            </Link>
          </div>
        )}
      </div>

      {/* Safety Modals */}
      {showReportModal && (
        <ReportModal
          targetUser={profile}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {showBlockModal && (
        <BlockModal
          targetUser={profile}
          onClose={() => setShowBlockModal(false)}
          onBlocked={() => {
            setIsBlocked(true);
            setShowBlockModal(false);
          }}
        />
      )}
    </div>
  );
}
