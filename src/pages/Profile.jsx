import { LogOut, MapPin, Briefcase } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function Profile() {
  const { user, profile, logout } = useAuthStore();

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="h-40 flame-bg" />
        <div className="px-6 pb-6 -mt-14">
          <div className="w-28 h-28 rounded-full border-4 border-white overflow-hidden bg-gray-100 mx-auto flex items-center justify-center">
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

          <div className="text-center mt-3">
            <h1 className="text-xl font-bold text-gray-900">
              {profile?.displayName}
              {profile?.age ? `, ${profile.age}` : ""}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">{user?.email}</p>
          </div>

          <div className="mt-4 space-y-2 text-sm text-gray-600">
            {profile?.job && (
              <p className="flex items-center gap-2">
                <Briefcase size={16} className="text-gray-400" /> {profile.job}
              </p>
            )}
            {typeof profile?.distanceKm === "number" && (
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" /> {profile.distanceKm} km uzoqlikda
              </p>
            )}
          </div>

          {profile?.bio && (
            <p className="mt-4 text-sm text-gray-700 leading-relaxed">
              {profile.bio}
            </p>
          )}

          <button
            onClick={logout}
            className="mt-6 w-full py-3 rounded-full border border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={18} /> Chiqish
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed px-4">
        Spark — bu dasturlashni mashq qilish uchun yaratilgan shaxsiy loyiha. U
        Tinder yoki Match Group, Inc. bilan aloqador emas, bog'liq emas va ular
        tomonidan qo'llab-quvvatlanmaydi.
      </p>
    </div>
  );
}
