import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

function formatRole(role?: string) {
  if (!role) return "admin";
  return role.replace(/_/g, " ");
}

export default function AdminAccountPage() {
  const { user } = useAuth();
  const initials = useMemo(() => {
    const name = user?.fullName?.trim() || "Admin";
    const parts = name.split(/\s+/);
    const first = parts[0]?.[0] ?? "A";
    const second = parts.length > 1 ? parts[1]?.[0] : "";
    return `${first}${second}`.toUpperCase();
  }, [user?.fullName]);

  return (
    <div className="space-y-5">
      <header className="text-center">
        <h1 className="text-2xl font-bold">My Account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Taarifa za akaunti yako na maelezo muhimu ya wasifu.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
        <article className="flex flex-col items-center text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-church-600 text-2xl font-bold text-white ring-2 ring-church-300/30">
            {initials}
          </div>
          <h2 className="mt-3 text-lg font-semibold">{user?.fullName || "Admin"}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">{user?.email || "no-email"}</p>
          <div className="mt-4 grid w-full gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Role</span>
              <span className="font-semibold">{formatRole(user?.role)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Status</span>
              <span className="font-semibold">{user?.status || "active"}</span>
            </div>
          </div>
        </article>

        <article>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">
            Account Details
          </h3>
          <dl className="mt-3 grid gap-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 dark:border-white/10">
              <dt className="text-slate-500 dark:text-slate-400">Full name</dt>
              <dd className="font-semibold">{user?.fullName || "Admin"}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 dark:border-white/10">
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="font-semibold">{user?.email || "no-email"}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 dark:border-white/10">
              <dt className="text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="font-semibold">{formatRole(user?.role)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="font-semibold">{user?.status || "active"}</dd>
            </div>
          </dl>

        </article>
      </div>
    </div>
  );
}
