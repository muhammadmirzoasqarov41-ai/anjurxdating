import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getAdminPrivileges } from "../lib/admin";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export const SUPER_ADMIN_EMAIL = "luxaidevs@gmail.com";

export function isSuperAdminUser(user) {
  return (
    Boolean(user?.email) &&
    user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
}

export default function AdminRoute({ children }) {
  const { user, initializing } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [privileges, setPrivileges] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (initializing) return;

      if (!user) {
        if (isMounted) {
          setPrivileges(null);
          setChecking(false);
        }
        return;
      }

      if (isSuperAdminUser(user)) {
        if (isMounted) {
          setPrivileges({ isAuthorized: true, isSuperAdmin: true, status: "active" });
          setChecking(false);
        }
        return;
      }

      // Check appointed admin
      const privs = await getAdminPrivileges(user);
      if (isMounted) {
        setPrivileges(privs);
        setChecking(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user, initializing]);

  if (initializing || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-flame-start border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Denied / Suspended / Expired
  if (!privileges?.isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-card p-6 border border-gray-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Admin Panelga Kirish Cheklangan
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {privileges?.reason ||
                "Sizning hisobingizga Super Admin tomonidan Admin huquqi berilmagan."}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full flame-bg text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={14} /> Asosiy ilovaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
