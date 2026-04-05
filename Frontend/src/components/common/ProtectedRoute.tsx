import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Permission } from "@/types/auth";

type ProtectedRouteProps = {
  children: JSX.Element;
  permission?: Permission;
};

export default function ProtectedRoute({ children, permission }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <section className="surface-card">
        <p className="text-sm text-slate-600 dark:text-slate-300">Inapakia session...</p>
      </section>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return (
      <section className="surface-card">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hakuna Ruhusa</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Huna ruhusa ya kufungua ukurasa huu.
        </p>
      </section>
    );
  }

  return children;
}
