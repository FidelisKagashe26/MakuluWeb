import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { AdminSection, Permission } from "@/types/auth";

type ProtectedRouteProps = {
  children: JSX.Element;
  permission?: Permission;
  section?: AdminSection;
};

export default function ProtectedRoute({ children, permission, section }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission, hasSectionAccess } = useAuth();

  if (isLoading) {
    return (
      <section className="space-y-3 rounded-xl border border-white/15 bg-white/[0.03] p-4">
        <div className="h-4 w-40 animate-pulse rounded bg-white/[0.12]" />
        <div className="h-10 w-full animate-pulse rounded bg-white/[0.08]" />
        <div className="h-10 w-10/12 animate-pulse rounded bg-white/[0.06]" />
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

  if (section && !hasSectionAccess(section)) {
    return (
      <section className="surface-card">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Hakuna Ruhusa</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Huna ruhusa ya kufungua sehemu hii ya admin.
        </p>
      </section>
    );
  }

  return children;
}
