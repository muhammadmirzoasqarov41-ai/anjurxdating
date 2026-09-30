import { useState, useMemo, useEffect } from "react";
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Calendar,
  Eye,
  Check,
  X,
  Search,
  Activity,
  LayoutDashboard,
  UserCheck,
  Flag,
  Heart,
  MessageCircle,
  BarChart3,
  Settings,
} from "lucide-react";
import { formatTime } from "../../pages/Admin";
import {
  ADMIN_ROLES,
  getAppointedAdminsList,
  saveAppointedAdmin,
  toggleAdminStatus,
  deleteAppointedAdmin,
  getAdminIndividualActivity,
  getSectionsForRoles,
} from "../../lib/admin";

const SECTION_ICONS = {
  dashboard: LayoutDashboard,
  users: Users,
  profiles: UserCheck,
  reports: Flag,
  matches: Heart,
  chats: MessageCircle,
  moderation: ShieldAlert,
  statistics: BarChart3,
  settings: Settings,
};

export default function AdminManagementView({ currentUserEmail = "luxaidevs@gmail.com" }) {
  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    roles: [],
    status: "active",
    hasExpiration: false,
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Activity Log Modal
  const [activeAdminDetail, setActiveAdminDetail] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Load admins
  const loadAdmins = async () => {
    setLoading(true);
    try {
      const list = await getAppointedAdminsList();
      setAdminsList(list);
    } catch (err) {
      console.error("Adminlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Filtered admins
  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return adminsList;
    const q = searchQuery.toLowerCase().trim();
    return adminsList.filter(
      (a) =>
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q)
    );
  }, [adminsList, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      roles: ["moderator", "chat_manager", "statistics_manager"],
      status: "active",
      hasExpiration: false,
      expiresAt: "",
    });
    setFormError("");
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (admin) => {
    setEditingAdmin(admin);
    const expDateStr = admin.expiresAt
      ? new Date(
          admin.expiresAt.toMillis ? admin.expiresAt.toMillis() : admin.expiresAt
        )
          .toISOString()
          .split("T")[0]
      : "";

    setFormData({
      name: admin.name || "",
      email: admin.email || "",
      roles: Array.isArray(admin.roles) ? [...admin.roles] : [],
      status: admin.status || "active",
      hasExpiration: Boolean(admin.expiresAt),
      expiresAt: expDateStr,
    });
    setFormError("");
    setShowModal(true);
  };

  // Toggle role in form
  const handleToggleRole = (roleId) => {
    setFormData((prev) => {
      const exists = prev.roles.includes(roleId);
      const newRoles = exists
        ? prev.roles.filter((r) => r !== roleId)
        : [...prev.roles, roleId];
      return { ...prev, roles: newRoles };
    });
  };

  // Select all / Deselect all
  const handleSelectAllRoles = () => {
    if (formData.roles.length === ADMIN_ROLES.length) {
      setFormData((prev) => ({ ...prev, roles: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        roles: ADMIN_ROLES.map((r) => r.id),
      }));
    }
  };

  // Save admin
  const handleSaveAdmin = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.email.trim() || !formData.email.includes("@")) {
      setFormError("Iltimos, to'g'ri elektron pochta kiriting");
      return;
    }

    if (formData.email.trim().toLowerCase() === "luxaidevs@gmail.com") {
      setFormError("Super Admin hisobini ushbu ro'yxatdan o'zgartirib bo'lmaydi");
      return;
    }

    if (formData.roles.length === 0) {
      setFormError("Kamida bitta vazifa (role) tanlanishi shart");
      return;
    }

    setSaving(true);
    try {
      await saveAppointedAdmin({
        name: formData.name,
        email: formData.email,
        roles: formData.roles,
        status: formData.status,
        expiresAt: formData.hasExpiration && formData.expiresAt ? formData.expiresAt : null,
      });

      setShowModal(false);
      await loadAdmins();
    } catch (err) {
      console.error("Adminni saqlashda xatolik:", err);
      setFormError(err.message || "Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  // Toggle Suspend
  const handleToggleSuspend = async (admin) => {
    try {
      await toggleAdminStatus(admin.email, admin.status);
      await loadAdmins();
    } catch (err) {
      alert(err.message || "Statusni o'zgartirishda xatolik");
    }
  };

  // Delete Admin
  const handleDeleteAdmin = async (admin) => {
    if (!window.confirm(`${admin.email} admin huquqlarini olib tashlashni xohlaysizmi?`)) {
      return;
    }
    try {
      await deleteAppointedAdmin(admin.email);
      await loadAdmins();
    } catch (err) {
      alert(err.message || "O'chirishda xatolik");
    }
  };

  // Open Activity Logs
  const handleOpenActivity = async (admin) => {
    setActiveAdminDetail(admin);
    setLogsLoading(true);
    setActivityLogs([]);
    try {
      const logs = await getAdminIndividualActivity(admin.email);
      setActivityLogs(logs);
    } catch (err) {
      console.error("Faoliyat jurnalini yuklashda xatolik:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  // Live preview calculation for the modal
  const previewSections = useMemo(() => {
    return getSectionsForRoles(formData.roles);
  }, [formData.roles]);

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <div className="rounded-2xl bg-white shadow-card p-4 border border-gray-100/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-flame-start" size={18} /> Adminlar Boshqaruvi (Admin Management)
          </h2>
          <p className="text-xs text-gray-400">
            Super Admin tomonidan tayinlangan adminlar va ularning ko'p funksiyali vazifalari
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 rounded-xl flame-bg text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity shadow-xs self-stretch sm:self-auto justify-center"
        >
          <UserPlus size={14} /> Yangi Admin Qo'shish
        </button>
      </div>

      {/* 2. Statistika qatorlari */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white shadow-card border border-gray-100/60">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Jami Adminlar
          </span>
          <p className="text-xl font-black text-gray-900 mt-0.5">
            {loading ? "..." : adminsList.length}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Tayinlangan xodimlar</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white shadow-card border border-gray-100/60">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
            Faol Adminlar
          </span>
          <p className="text-xl font-black text-emerald-600 mt-0.5">
            {loading ? "..." : adminsList.filter((a) => a.status === "active").length}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Ish faoliyatida</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white shadow-card border border-gray-100/60">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
            To'xtatilganlar
          </span>
          <p className="text-xl font-black text-amber-600 mt-0.5">
            {loading ? "..." : adminsList.filter((a) => a.status === "suspended").length}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Kirishi cheklangan</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white shadow-card border border-gray-100/60">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
            Super Admin
          </span>
          <p className="text-xs font-bold text-rose-600 mt-1 truncate font-mono">
            luxaidevs@gmail.com
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">Doimiy oliy huquq</p>
        </div>
      </div>

      {/* 3. Qidiruv qutisi */}
      <div className="rounded-2xl bg-white shadow-card p-3 border border-gray-100/60 flex items-center gap-2">
        <Search size={15} className="text-gray-400 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Ism yoki email bo'yicha adminlarni qidirish..."
          className="flex-1 bg-transparent text-xs text-gray-900 outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 4. Adminlar Ro'yxati / Jadvali */}
      <div className="rounded-2xl bg-white shadow-card overflow-hidden border border-gray-100/60">
        {loading ? (
          <div className="p-8 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-flame-start flex items-center justify-center mx-auto mb-2">
              <Users size={22} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">
              Adminlar mavjud emas
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mt-0.5">
              Hozircha qo'shimcha admin tayinlanmagan. "Yangi Admin Qo'shish" orqali istalgan foydalanuvchiga bir nechta vazifa biriktirishingiz mumkin.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-3 px-3 py-1.5 rounded-full flame-bg text-white text-xs font-semibold"
            >
              + Admin qo'shish
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Tayinlangan Rollar (Vazifalar)</th>
                  <th className="p-3">Ko'rinadigan Bo'limlar</th>
                  <th className="p-3 text-center">Holat</th>
                  <th className="p-3">Amal qilish muddati</th>
                  <th className="p-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAdmins.map((admin) => {
                  const assignedSections = getSectionsForRoles(admin.roles || []);
                  const isSuspended = admin.status === "suspended";

                  return (
                    <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name & Email */}
                      <td className="p-3">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">
                            {admin.name || "Nomsiz Admin"}
                          </p>
                          <p className="font-mono text-[11px] text-gray-500 truncate">
                            {admin.email}
                          </p>
                          {admin.lastLogin && (
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              Kirgan: {formatTime(admin.lastLogin)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Roles */}
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {(admin.roles || []).map((rId) => {
                            const roleDef = ADMIN_ROLES.find((r) => r.id === rId);
                            return (
                              <span
                                key={rId}
                                className="px-2 py-0.5 rounded-md bg-rose-50 text-flame-start font-semibold text-[10px] border border-rose-200/50"
                              >
                                {roleDef?.label || rId}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Permitted Sections */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          {assignedSections.map((secId) => {
                            const IconComponent = SECTION_ICONS[secId] || Shield;
                            return (
                              <div
                                key={secId}
                                className="w-6 h-6 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center"
                                title={secId}
                              >
                                <IconComponent size={12} />
                              </div>
                            );
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuspended
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {isSuspended ? "To'xtatilgan" : "Faol"}
                        </span>
                      </td>

                      {/* Expiration */}
                      <td className="p-3 text-[11px] text-gray-600">
                        {admin.expiresAt ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            {formatTime(admin.expiresAt)}
                          </span>
                        ) : (
                          <span className="text-gray-400">Muddatsiz</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenActivity(admin)}
                            className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                            title="Faoliyat tarixi"
                          >
                            <Eye size={13} />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(admin)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                            title="Tahrirlash"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(admin)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isSuspended
                                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                                : "bg-amber-50 hover:bg-amber-100 text-amber-700"
                            }`}
                            title={isSuspended ? "Faollashtirish" : "To'xtatish"}
                          >
                            <Lock size={13} />
                          </button>

                          <button
                            onClick={() => handleDeleteAdmin(admin)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                            title="O'chirish"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. ADD / EDIT ADMIN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck size={20} />
                {editingAdmin ? "Admin Vazifalarini Tahrirlash" : "Yangi Admin Tayinlash"}
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                Bitta adminga istalgancha bir nechta vazifa (multiple roles) biriktirishingiz mumkin
              </p>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAdmin} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto thin-scroll text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle size={15} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Ism va Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Admin To'liq Ismi
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Sardor Aliyev"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-flame-start text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Elektron Pochta (Email)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={Boolean(editingAdmin)}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masalan: test@gmail.com"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-flame-start text-xs disabled:opacity-60 font-mono"
                    required
                  />
                </div>
              </div>

              {/* VAZIFALAR / MULTIPLE ROLES CHECKLIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-gray-800 text-xs block">
                      Vazifalar & Huquqlar (Multiple Roles)
                    </label>
                    <p className="text-[11px] text-gray-400">
                      Istalgan vazifalarni bir vaqtda belgilang. Ular birlashib ishlaydi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSelectAllRoles}
                    className="text-[11px] text-flame-start font-bold hover:underline"
                  >
                    {formData.roles.length === ADMIN_ROLES.length
                      ? "Barchasini bekor qilish"
                      : "Barchasini tanlash"}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {ADMIN_ROLES.map((role) => {
                    const isSelected = formData.roles.includes(role.id);
                    const IconComp = SECTION_ICONS[role.section] || Shield;

                    return (
                      <div
                        key={role.id}
                        onClick={() => handleToggleRole(role.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                          isSelected
                            ? "bg-rose-50/70 border-flame-start/70 shadow-2xs"
                            : "bg-gray-50/60 border-gray-200/80 hover:bg-gray-100"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                            isSelected
                              ? "flame-bg text-white border-transparent"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check size={11} strokeWidth={3} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                            <IconComp size={13} className={isSelected ? "text-flame-start" : "text-gray-400"} />
                            <span>{role.label}</span>
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* REALTIME PERMISSION & PANEL PREVIEW BOX */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2">
                <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider block flex items-center gap-1.5">
                  <Eye size={13} className="text-flame-start" /> Admin Panel Live Prevyu
                </span>
                <p className="text-[11px] text-gray-500">
                  Ushbu admin login qilganda uning Admin Panelida qaysi bo'limlar ko'rinadi:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1 text-[11px]">
                  {[
                    { id: "dashboard", label: "Dashboard" },
                    { id: "users", label: "Users" },
                    { id: "profiles", label: "Profiles" },
                    { id: "reports", label: "Reports" },
                    { id: "matches", label: "Matches" },
                    { id: "chats", label: "Chats" },
                    { id: "moderation", label: "Moderation" },
                    { id: "statistics", label: "Statistics" },
                    { id: "settings", label: "Settings" },
                  ].map((sec) => {
                    const isAllowed = previewSections.includes(sec.id);
                    return (
                      <div
                        key={sec.id}
                        className={`px-2 py-1 rounded-lg flex items-center justify-between border ${
                          isAllowed
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                            : "bg-white text-gray-400 border-gray-100"
                        }`}
                      >
                        <span>{sec.label}</span>
                        <span>{isAllowed ? "✅" : "❌"}</span>
                      </div>
                    );
                  })}
                  <div className="px-2 py-1 rounded-lg flex items-center justify-between border bg-white text-gray-400 border-gray-100 col-span-2 sm:col-span-3">
                    <span>Admin Management (Faqat Super Admin)</span>
                    <span>❌</span>
                  </div>
                </div>
              </div>

              {/* Status va Muddat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">
                    Hisob Holati
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 outline-none focus:border-flame-start"
                  >
                    <option value="active">Faol (Active)</option>
                    <option value="suspended">To'xtatilgan (Suspended)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700">
                      Amal Qilish Muddati
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasExpiration}
                        onChange={(e) =>
                          setFormData({ ...formData, hasExpiration: e.target.checked })
                        }
                        className="rounded"
                      />
                      <span>Muddatsiz emas</span>
                    </label>
                  </div>

                  {formData.hasExpiration ? (
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs outline-none focus:border-flame-start"
                      required={formData.hasExpiration}
                    />
                  ) : (
                    <div className="px-3 py-2 rounded-xl bg-gray-100 text-gray-400 text-xs">
                      Muddatsiz (Doimiy)
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-full flame-bg text-white font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  {saving ? "Saqlanmoqda..." : editingAdmin ? "O'zgarishlarni saqlash" : "Adminni tayinlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. ADMIN ACTIVITY & DETAIL MODAL */}
      {activeAdminDetail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-card overflow-hidden my-6 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flame-bg p-5 text-white relative">
              <button
                onClick={() => setActiveAdminDetail(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Activity size={20} /> Admin Faoliyati & Tafsilotlari
              </h3>
              <p className="text-xs text-white/85 mt-0.5">
                {activeAdminDetail.name} ({activeAdminDetail.email})
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto thin-scroll text-xs">
              {/* Rollar */}
              <div>
                <span className="font-bold text-gray-700 block mb-1.5">
                  Biriktirilgan Vazifalar:
                </span>
                <div className="flex flex-wrap gap-1">
                  {(activeAdminDetail.roles || []).map((rId) => {
                    const roleDef = ADMIN_ROLES.find((r) => r.id === rId);
                    return (
                      <span
                        key={rId}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 text-flame-start font-bold border border-rose-200/60"
                      >
                        {roleDef?.label || rId}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Faoliyat Jurnali */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <span className="font-bold text-gray-800 text-xs block">
                  So'nggi Amallar Tarixi (`admin_logs`):
                </span>

                {logsLoading ? (
                  <div className="py-6 text-center text-gray-400">
                    Jurnal yuklanmoqda...
                  </div>
                ) : activityLogs.length === 0 ? (
                  <div className="py-6 text-center text-gray-400 bg-gray-50 rounded-xl">
                    Ushbu admin tomonidan hozircha amallar qayd etilmagan
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {activityLogs.map((log) => (
                      <div key={log.id} className="p-2.5 bg-white hover:bg-gray-50 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 font-mono text-[11px]">
                            {log.action}
                          </p>
                          {log.targetEmail && (
                            <p className="text-[10px] text-gray-500">
                              Nishon: {log.targetEmail}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(log.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
              <button
                onClick={() => setActiveAdminDetail(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-100 transition-colors"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
