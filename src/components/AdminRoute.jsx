import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export const SUPER_ADMIN_EMAIL = "luxaidevs@gmail.com";

export function isSuperAdminUser(user) {
  return (
    Boolean(user?.email) &&
    user.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );
}

export default function AdminRoute({ children }) {
  const { user, initializing } = useAuthStore();

  if (initializing) {
    return null;
  }

  if (!isSuperAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
