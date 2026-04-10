import { useEffect, useMemo, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import type { AdminSection } from "@/types/auth";

type NavItem = {
  label: string;
  to: string;
  section: AdminSection;
  icon: ReactNode;
  requires?: Array<"view" | "create" | "update" | "delete" | "publish">;
};

function IconDashboard() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.07V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.4-1.07 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.07-.4H2.9a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.07-.4 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.07V2.9a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .4 1.07 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.07.4h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.07.4 1.7 1.7 0 0 0-.6 1Z" />
    </svg>
  );
}

function IconDepartment() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6" />
    </svg>
  );
}

function IconLeaders() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconGroups() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 8h10M7 12h7M7 16h10M4 4h16v16H4z" />
    </svg>
  );
}

function IconReports() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h8" />
    </svg>
  );
}

function IconLibrary() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4h12a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2V4Z" />
      <path d="M7 19h12M9 8h7M9 12h7" />
    </svg>
  );
}

function IconAnnouncement() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11l18-5v12l-18-5v-2z" />
      <path d="M7 13v5a2 2 0 0 0 2 2h1" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconMedia() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 15l-4.5-4.5L9 18" />
    </svg>
  );
}

const navItems: NavItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", section: "dashboard", icon: <IconDashboard />, requires: ["view"] },
  { label: "Settings", to: "/admin/settings", section: "settings", icon: <IconSettings />, requires: ["update"] },
  { label: "Maktaba", to: "/admin/maktaba", section: "library", icon: <IconLibrary />, requires: ["update"] },
  { label: "Departments", to: "/admin/idara", section: "departments", icon: <IconDepartment />, requires: ["view"] },
  { label: "Leaders", to: "/admin/viongozi", section: "leaders", icon: <IconLeaders />, requires: ["view"] },
  { label: "Groups", to: "/admin/vikundi", section: "groups", icon: <IconGroups />, requires: ["view"] },
  { label: "Reports", to: "/admin/reports", section: "reports", icon: <IconReports />, requires: ["view"] },
  { label: "Media", to: "/admin/media", section: "media", icon: <IconMedia />, requires: ["view"] },
  { label: "Matukio", to: "/admin/matukio", section: "announcements", icon: <IconAnnouncement />, requires: ["view"] },
  { label: "Announcements", to: "/admin/matangazo", section: "announcements", icon: <IconAnnouncement />, requires: ["view"] },
  { label: "Users", to: "/admin/users", section: "users", icon: <IconUsers />, requires: ["view"] }
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `admin-nav-link ${isActive ? "admin-nav-link-active" : ""}`;

function getRoleLabel(role?: string) {
  if (!role) return "admin";
  return role.replace(/_/g, " ");
}

function getCurrentSection(pathname: string) {
  const current = navItems.find((item) => pathname.startsWith(item.to));
  return current?.label ?? "Dashboard";
}

export default function AdminLayout() {
  const { user, logout, hasPermission, hasSectionAccess } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const items = useMemo(
    () =>
      navItems.filter((item) =>
        hasSectionAccess(item.section) &&
        (item.requires || []).every((permission) => hasPermission(permission))
      ),
    [hasPermission, hasSectionAccess]
  );

  const currentSection = getCurrentSection(location.pathname);
  const adminThemeClass = isDark ? "admin-theme-dark" : "admin-theme-light";
  const isSwahili = i18n.language?.startsWith("sw");

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className={`admin-panel-shell ${adminThemeClass} lg:grid lg:grid-cols-[258px_minmax(0,1fr)]`}>
      <aside className="admin-sidebar hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex justify-center pb-4">
            <img
              src="/adventistLogo.png"
              alt="Dodoma Makulu SDA Church logo"
              className="h-16 w-16 rounded-full object-cover ring-1 ring-slate-300 dark:ring-white/40"
              loading="eager"
              decoding="async"
            />
          </div>

          <nav className="mt-3 grid flex-1 content-start gap-1.5 overflow-y-auto pr-1">
            {items.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <span className="inline-flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>
        </div>

        <button type="button" onClick={handleLogout} className="admin-btn-danger mt-3 w-full">
          Sign out
        </button>
      </aside>

      <div className="min-w-0">
        <header className="admin-topbar">
          <div className="flex items-center justify-between gap-3 px-3 py-3 sm:px-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="admin-topbar-btn px-2.5 py-2 lg:hidden"
                aria-label="open admin menu"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                </svg>
              </button>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-church-700 dark:text-church-300">
                  Admin / {currentSection}
                </p>
                <h1 className="truncate text-base font-bold text-slate-900 dark:text-white sm:text-lg">{currentSection}</h1>
                <p className="truncate text-xs text-slate-600 dark:text-slate-400">
                  Signed in as {user?.fullName || "Admin"} ({getRoleLabel(user?.role)})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="admin-topbar-btn"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label={isDark ? "switch to light mode" : "switch to dark mode"}
              >
                {isDark ? (
                  <>
                    <span>Light</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </>
                ) : (
                  <>
                    <span>Dark</span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>

              <button
                type="button"
                className="admin-topbar-btn"
                onClick={() => void i18n.changeLanguage(isSwahili ? "en" : "sw")}
                title={isSwahili ? "Switch to English" : "Badili kwenda Kiswahili"}
                aria-label={isSwahili ? "switch to English" : "badili kwenda Kiswahili"}
              >
                <span>{isSwahili ? "EN" : "SW"}</span>
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="admin-topbar-btn"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  aria-label="open user details"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-church-600 text-xs font-bold text-white">
                    {(user?.fullName?.charAt(0) || "A").toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user?.fullName || "Admin"}</span>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {userMenuOpen ? (
                  <div className="admin-user-menu absolute right-0 mt-2 w-72">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-church-700 dark:text-church-300">User Details</p>
                    <div className="mt-3 flex items-center gap-3 rounded-md border border-slate-200/70 bg-white/80 p-2 dark:border-white/10 dark:bg-white/5">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-church-600 text-sm font-bold text-white">
                        {(user?.fullName?.charAt(0) || "A").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {user?.fullName || "Admin"}
                        </p>
                        <p className="truncate text-xs text-slate-600 dark:text-slate-300">
                          {user?.email || "no-email"}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Role</p>
                    <p className="text-sm text-slate-900 dark:text-white">{getRoleLabel(user?.role)}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Status</p>
                    <p className="text-sm text-slate-900 dark:text-white">{user?.status || "active"}</p>

                    <div className="mt-3 grid gap-2">
                      {hasSectionAccess("account") ? (
                        <>
                          <NavLink
                            to="/admin/account"
                            className="admin-btn-ghost w-full justify-center"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            My Account
                          </NavLink>
                          <NavLink
                            to="/admin/change-password"
                            className="admin-btn-ghost w-full justify-center"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            Change Password
                          </NavLink>
                        </>
                      ) : null}
                      <button type="button" onClick={handleLogout} className="admin-btn-danger w-full">
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-slate-950/70"
              onClick={() => setSidebarOpen(false)}
              aria-label="close admin menu"
            />
            <aside className="admin-sidebar absolute left-0 top-0 flex h-full w-72 max-w-[88vw] flex-col border-r border-slate-200 dark:border-white/15">
              <div className="mb-4 flex items-center justify-between pb-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-church-700 dark:text-church-300">Admin Menu</h3>
                <button
                  type="button"
                  className="admin-btn-ghost px-2.5 py-1"
                  onClick={() => setSidebarOpen(false)}
                >
                  Close
                </button>
              </div>
              <nav className="grid flex-1 content-start gap-1.5 overflow-y-auto pr-1">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={linkClass}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </nav>

              <button
                type="button"
                onClick={handleLogout}
                className="admin-btn-danger mt-3 w-full"
              >
                Sign out
              </button>
            </aside>
          </div>
        ) : null}

        <section className={`admin-content-shell admin-panel-theme ${adminThemeClass}`}>
          <Outlet />
        </section>
      </div>
    </div>
  );
}

