import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Flag,
  Heart,
  MessageCircle,
  ShieldAlert,
  BarChart3,
  Settings,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Clock,
  Briefcase,
  MapPin,
  Mail,
  CheckCircle2,
  Shield,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import {
  getAdminDashboardData,
  getAdminUsersData,
  getAdminProfilesData,
  getAdminReportsData,
  getAdminMatchesData,
  getAdminChatsData,
  getAdminModerationData,
  getAdminPrivileges,
  ADMIN_ROLES,
} from "../lib/admin";
import AdminUsersView from "../components/admin/AdminUsersView";
import AdminProfilesView from "../components/admin/AdminProfilesView";
import AdminReportsView from "../components/admin/AdminReportsView";
import AdminMatchesView from "../components/admin/AdminMatchesView";
import AdminChatsView from "../components/admin/AdminChatsView";
import AdminModerationView from "../components/admin/AdminModerationView";
import AdminStatisticsView from "../components/admin/AdminStatisticsView";
import AdminSettingsView from "../components/admin/AdminSettingsView";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "users", label: "Foydalanuvchilar", icon: Users },
  { id: "profiles", label: "Profillar", icon: UserCheck },
  { id: "reports", label: "Shikoyatlar", icon: Flag },
  { id: "matches", label: "Matchlar", icon: Heart },
  { id: "chats", label: "Suhbatlar", icon: MessageCircle },
  { id: "moderation", label: "Moderatsiya", icon: ShieldAlert },
  { id: "statistics", label: "Statistika", icon: BarChart3 },
  { id: "settings", label: "Sozlamalar", icon: Settings },
];

export function formatTime(timestamp) {
  if (!timestamp) return "Noma'lum";
  let date;
  if (typeof timestamp.toMillis === "function") {
    date = new Date(timestamp.toMillis());
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) return "Noma'lum";

  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return "Hozirgina";
  if (diffMinutes < 60) return `${diffMinutes} daqiqa oldin`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} soat oldin`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} kun oldin`;

  return date.toLocaleDateString("uz-UZ", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Admin() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminPrivileges, setAdminPrivileges] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load privileges for current user
  useEffect(() => {
    async function loadPrivs() {
      if (!user) return;
      const privs = await getAdminPrivileges(user);
      setAdminPrivileges(privs);
    }
    loadPrivs();
  }, [user]);

  const isSuperAdmin =
    adminPrivileges?.isSuperAdmin ||
    user?.email?.toLowerCase() === "luxaidevs@gmail.com";

  // Filter sections according to assigned multiple roles
  const permittedSections = isSuperAdmin
    ? SECTIONS
    : SECTIONS.filter((s) => adminPrivileges?.sections?.includes(s.id));

  // Automatically switch tab if activeTab is not permitted
  useEffect(() => {
    if (permittedSections.length > 0 && !permittedSections.some((s) => s.id === activeTab)) {
      setActiveTab(permittedSections[0].id);
    }
  }, [permittedSections, activeTab]);

  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalProfiles: 0,
      totalMatches: 0,
      totalReports: 0,
      totalConversations: 0,
    },
    recentProfiles: [],
    recentUsers: [],
    recentReports: [],
    recentMatches: [],
  });

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getAdminDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard yuklashda xatolik:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // USERS SECTION DATA MANAGEMENT
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setUsersLoading(true);

    try {
      const data = await getAdminUsersData();
      setUsersList(data);
      setUsersLoaded(true);
    } catch (err) {
      console.error("Foydalanuvchilarni yuklashda xatolik:", err);
    } finally {
      setUsersLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "users" && !usersLoaded) {
      loadUsers();
    }
  }, [activeTab, usersLoaded, loadUsers]);

  // PROFILES SECTION DATA MANAGEMENT
  const [profilesList, setProfilesList] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  const loadProfiles = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setProfilesLoading(true);

    try {
      const data = await getAdminProfilesData();
      setProfilesList(data);
      setProfilesLoaded(true);
    } catch (err) {
      console.error("Profillarni yuklashda xatolik:", err);
    } finally {
      setProfilesLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "profiles" && !profilesLoaded) {
      loadProfiles();
    }
  }, [activeTab, profilesLoaded, loadProfiles]);

  // REPORTS SECTION DATA MANAGEMENT
  const [reportsList, setReportsList] = useState([]);
  const [reportsStats, setReportsStats] = useState({
    total: 0,
    pending: 0,
    reviewing: 0,
    resolved: 0,
    dismissed: 0,
  });
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsLoaded, setReportsLoaded] = useState(false);
  const [reportsError, setReportsError] = useState(null);

  const loadReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setReportsLoading(true);
    setReportsError(null);

    try {
      const { reports, stats } = await getAdminReportsData();
      setReportsList(reports);
      setReportsStats(stats);
      setReportsLoaded(true);
    } catch (err) {
      console.error("Shikoyatlarni yuklashda xatolik:", err);
      setReportsError(
        "Shikoyatlarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
      );
    } finally {
      setReportsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reports" && !reportsLoaded) {
      loadReports();
    }
  }, [activeTab, reportsLoaded, loadReports]);

  // MATCHES SECTION DATA MANAGEMENT
  const [matchesList, setMatchesList] = useState([]);
  const [matchesStats, setMatchesStats] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    withChat: 0,
  });
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesLoaded, setMatchesLoaded] = useState(false);
  const [matchesError, setMatchesError] = useState(null);

  const loadMatches = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setMatchesLoading(true);
    setMatchesError(null);

    try {
      const { matches, stats } = await getAdminMatchesData();
      setMatchesList(matches);
      setMatchesStats(stats);
      setMatchesLoaded(true);
    } catch (err) {
      console.error("Mosliklarni yuklashda xatolik:", err);
      setMatchesError(
        "Mosliklarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
      );
    } finally {
      setMatchesLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "matches" && !matchesLoaded) {
      loadMatches();
    }
  }, [activeTab, matchesLoaded, loadMatches]);

  // CHATS SECTION DATA MANAGEMENT
  const [chatsList, setChatsList] = useState([]);
  const [chatsStats, setChatsStats] = useState({
    totalConversations: 0,
    activeConversations: 0,
    todayConversations: 0,
    inactiveConversations: 0,
  });
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [chatsError, setChatsError] = useState(null);

  const loadChats = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setChatsLoading(true);
    setChatsError(null);

    try {
      const { conversations, stats } = await getAdminChatsData();
      setChatsList(conversations);
      setChatsStats(stats);
      setChatsLoaded(true);
    } catch (err) {
      console.error("Suhbatlarni yuklashda xatolik:", err);
      setChatsError(
        "Suhbatlarni yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
      );
    } finally {
      setChatsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "chats" && !chatsLoaded) {
      loadChats();
    }
  }, [activeTab, chatsLoaded, loadChats]);

  // MODERATION SECTION DATA MANAGEMENT
  const [moderationItems, setModerationItems] = useState([]);
  const [moderationStats, setModerationStats] = useState({
    pendingCount: 0,
    reviewingCount: 0,
    resolvedCount: 0,
    dismissedCount: 0,
    reportedUsersCount: 0,
    suspendedUsersCount: 0,
    totalItems: 0,
  });
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationLoaded, setModerationLoaded] = useState(false);
  const [moderationError, setModerationError] = useState(null);

  const loadModeration = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setModerationLoading(true);
    setModerationError(null);

    try {
      const { queueItems, stats } = await getAdminModerationData();
      setModerationItems(queueItems);
      setModerationStats(stats);
      setModerationLoaded(true);
    } catch (err) {
      console.error("Moderatsiyani yuklashda xatolik:", err);
      setModerationError(
        "Moderatsiya ma'lumotlarini yuklashda xatolik yuz berdi. Iltimos qayta urinib ko'ring."
      );
    } finally {
      setModerationLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "moderation" && !moderationLoaded) {
      loadModeration();
    }
  }, [activeTab, moderationLoaded, loadModeration]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentSection =
    SECTIONS.find((s) => s.id === activeTab) || SECTIONS[0];
  const CurrentIcon = currentSection.icon;

  const statCards = [
    {
      id: "users",
      title: "Foydalanuvchilar",
      value: dashboardData.stats.totalUsers,
      sub: "Bazada ro'yxatdan o'tganlar",
      icon: Users,
      color: "text-blue-500 bg-blue-50",
    },
    {
      id: "profiles",
      title: "Profillar",
      value: dashboardData.stats.totalProfiles,
      sub: "To'ldirilgan anketalar",
      icon: UserCheck,
      color: "text-emerald-500 bg-emerald-50",
    },
    {
      id: "matches",
      title: "Matchlar",
      value: dashboardData.stats.totalMatches,
      sub: "O'zaro mosliklar",
      icon: Heart,
      color: "text-rose-500 bg-rose-50",
    },
    {
      id: "chats",
      title: "Faol suhbatlar",
      value: dashboardData.stats.totalConversations,
      sub: "Xabar yozilgan xonalar",
      icon: MessageCircle,
      color: "text-purple-500 bg-purple-50",
    },
    {
      id: "reports",
      title: "Shikoyatlar",
      value: dashboardData.stats.totalReports,
      sub: "Kelib tushgan murojaatlar",
      icon: Flag,
      color: "text-amber-500 bg-amber-50",
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Sarlavha kartasi */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden">
        <div className="flame-bg p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <Link
              to="/"
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-xs"
              title="Ilovaga qaytish"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (activeTab === "users") loadUsers(true);
                  else if (activeTab === "profiles") loadProfiles(true);
                  else if (activeTab === "reports") loadReports(true);
                  else if (activeTab === "matches") loadMatches(true);
                  else if (activeTab === "chats") loadChats(true);
                  else if (activeTab === "moderation") loadModeration(true);
                  else loadData(true);
                }}
                disabled={
                  loading ||
                  refreshing ||
                  usersLoading ||
                  profilesLoading ||
                  reportsLoading ||
                  matchesLoading ||
                  chatsLoading ||
                  moderationLoading
                }
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50 shadow-xs"
                title="Ma'lumotlarni yangilash"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing ||
                    usersLoading ||
                    profilesLoading ||
                    reportsLoading ||
                    matchesLoading ||
                    chatsLoading ||
                    moderationLoading
                      ? "animate-spin"
                      : ""
                  }
                />
              </button>

              {isSuperAdmin ? (
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1.5 shadow-xs">
                  <ShieldCheck size={15} /> Super Admin
                </span>
              ) : (
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-xs flex items-center gap-1.5 shadow-xs"
                  title={(adminPrivileges?.roles || []).join(", ")}
                >
                  <Shield size={14} /> Admin ({adminPrivileges?.roles?.length || 1} vazifa)
                </span>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              AnjurXdating Boshqaruv Paneli
            </h1>
            <p className="text-xs text-white/85 mt-0.5 truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Dinamik bo'limlar navigatsiyasi (faqat ruxsat berilgan bo'limlar) */}
        <div className="p-2 border-b border-gray-100 overflow-x-auto thin-scroll flex items-center gap-1.5 bg-white">
          {permittedSections.map((sec) => {
            const TabIcon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all " +
                  (isActive
                    ? "flame-bg text-white shadow-xs"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100")
                }
              >
                <TabIcon size={14} />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RUXSAT TEKSHIRUVI VA BO'LIMLARNI CHIQARISH */}
      {!isSuperAdmin && !permittedSections.some((s) => s.id === activeTab) ? (
        <div className="rounded-2xl bg-white shadow-card p-8 border border-gray-100 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-base font-bold text-gray-900">
            Ushbu Bo'limga Kirish Cheklangan (Access Denied)
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Sizning hisobingizga ushbu bo'lim uchun vazifa/ruxsat biriktirilmagan. Iltimos, o'zingizga ajratilgan bo'limlardan foydalaning.
          </p>
        </div>
      ) : activeTab === "dashboard" ? (
        <div className="space-y-5">
          {/* Asosiy Statistika Metriklari */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                Haqiqiy Firestore Statistikasi
              </h2>
              {refreshing && (
                <span className="text-xs text-flame-start font-medium animate-pulse">
                  Yangilanmoqda...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {statCards.map((stat) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={stat.id}
                    className="p-4 rounded-2xl bg-white shadow-card border border-gray-100/60 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500">
                        {stat.title}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color}`}
                      >
                        <IconComponent size={16} />
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-gray-900">
                        {loading ? "..." : stat.value}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
                        {stat.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Yaqinda yaratilgan profillar */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-flame-start" />
                <h3 className="font-bold text-sm text-gray-900">
                  Yaqinda yaratilgan profillar
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {dashboardData.recentProfiles.length} ta
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : dashboardData.recentProfiles.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Hozircha profillar bazasi bo'sh.
              </p>
            ) : (
              <div className="space-y-2.5">
                {dashboardData.recentProfiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 transition-colors border border-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
                        {p.photos?.[0] ? (
                          <img
                            src={p.photos[0]}
                            alt={p.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-bold text-gray-400 text-sm">
                            {p.displayName?.[0]?.toUpperCase() || "U"}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-gray-900 truncate">
                          {p.displayName || "Nomsiz"}
                          {p.age ? `, ${p.age}` : ""}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          {p.job && (
                            <span className="flex items-center gap-1 truncate">
                              <Briefcase size={12} /> {p.job}
                            </span>
                          )}
                          {typeof p.distanceKm === "number" && (
                            <span className="flex items-center gap-1">
                              <MapPin size={12} /> {p.distanceKm} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 justify-end">
                        <Clock size={11} /> {formatTime(p.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Yaqinda ro'yxatdan o'tgan foydalanuvchilar */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-flame-start" />
                <h3 className="font-bold text-sm text-gray-900">
                  Yaqinda ro'yxatdan o'tgan foydalanuvchilar
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {dashboardData.recentUsers.length} ta
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : dashboardData.recentUsers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-gray-400">
                  Foydalanuvchilar to'plami bo'sh yoki hali kirmagan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-rose-50 text-flame-start flex items-center justify-center font-bold flex-shrink-0 text-xs">
                        {u.displayName?.[0]?.toUpperCase() ||
                          u.email?.[0]?.toUpperCase() ||
                          "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {u.displayName || "Foydalanuvchi"}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate flex items-center gap-1">
                          <Mail size={11} /> {u.email || "Email mavjud emas"}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2 flex-shrink-0">
                      {formatTime(u.lastLoginAt || u.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* So'nggi matchlar va suhbatlar faolligi */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-flame-start" />
                <h3 className="font-bold text-sm text-gray-900">
                  So'nggi Matchlar va Suhbatlar
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {dashboardData.recentMatches.length} ta
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-12 rounded-xl bg-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : dashboardData.recentMatches.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                Hozircha matchlar yoki suhbatlar mavjud emas.
              </p>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentMatches.map((m) => {
                  const profiles = m.profiles || {};
                  const userKeys = Object.keys(profiles);
                  const p1 = profiles[userKeys[0]] || {};
                  const p2 = profiles[userKeys[1]] || {};

                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-semibold text-gray-800">
                          <span>{p1.displayName || "Foydalanuvchi 1"}</span>
                          <span className="text-flame-start font-bold">♥</span>
                          <span>{p2.displayName || "Foydalanuvchi 2"}</span>
                          {m.isBot && (
                            <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.2 rounded font-normal">
                              Bot
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(m.lastMessageAt || m.createdAt)}
                        </span>
                      </div>

                      {m.lastMessage ? (
                        <p className="text-[11px] text-gray-500 truncate flex items-center gap-1.5">
                          <MessageCircle size={12} className="text-gray-400" />
                          <span>Oxirgi xabar: "{m.lastMessage}"</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          Hali xabar yozilmagan
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* So'nggi Shikoyatlar (Reports) */}
          <div className="rounded-2xl bg-white shadow-card p-5 border border-gray-100/60">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Flag size={18} className="text-flame-start" />
                <h3 className="font-bold text-sm text-gray-900">
                  So'nggi Shikoyatlar (Moderatsiya)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {dashboardData.recentReports.length} ta
              </span>
            </div>

            {loading ? (
              <div className="h-12 rounded-xl bg-gray-50 animate-pulse" />
            ) : dashboardData.recentReports.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-emerald-700">
                  Hozircha shikoyatlar yo'q. Tizimda tartibbuzarliklar qayd etilmagan.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {dashboardData.recentReports.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-100 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-rose-700">
                        {r.reason || "Shikoyat"}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {formatTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">
                      {r.description || "Tafsilotlar ko'rsatilmagan"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === "users" ? (
        <AdminUsersView
          users={usersList}
          loading={usersLoading}
          onRefresh={() => loadUsers(true)}
        />
      ) : activeTab === "profiles" ? (
        <AdminProfilesView
          profiles={profilesList}
          loading={profilesLoading}
          onRefresh={() => loadProfiles(true)}
        />
      ) : activeTab === "reports" ? (
        <AdminReportsView
          reports={reportsList}
          stats={reportsStats}
          loading={reportsLoading}
          error={reportsError}
          onRefresh={() => loadReports(true)}
        />
      ) : activeTab === "matches" ? (
        <AdminMatchesView
          matches={matchesList}
          stats={matchesStats}
          loading={matchesLoading}
          error={matchesError}
          onRefresh={() => loadMatches(true)}
        />
      ) : activeTab === "chats" ? (
        <AdminChatsView
          conversations={chatsList}
          stats={chatsStats}
          loading={chatsLoading}
          error={chatsError}
          onRefresh={() => loadChats(true)}
        />
      ) : activeTab === "moderation" ? (
        <AdminModerationView
          queueItems={moderationItems}
          stats={moderationStats}
          loading={moderationLoading}
          error={moderationError}
          onRefresh={() => loadModeration(true)}
        />
      ) : activeTab === "statistics" ? (
        <AdminStatisticsView />
      ) : activeTab === "settings" ? (
        <AdminSettingsView />
      ) : (
        /* Boshqa bo'limlar uchun toza arxitektura kartasi */
        <div className="rounded-2xl bg-white shadow-card p-6 border border-gray-100/60">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-flame-start flex items-center justify-center">
              <CurrentIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {currentSection.label}
              </h2>
              <p className="text-xs text-gray-400">AnjurXdating boshqaruv tizimi</p>
            </div>
          </div>

          <div className="py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <CurrentIcon size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              {currentSection.label} bo'limi
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Ushbu bo'limning arxitekturasi tayyorlangan. Keyingi bosqichlarda kerakli boshqaruv amallari bilan to'ldiriladi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
