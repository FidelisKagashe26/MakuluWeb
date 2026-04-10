import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ThemeToggle from "@/components/common/ThemeToggle";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-white/20 text-white ring-1 ring-white/40"
      : "text-white/90 hover:bg-white/10 hover:text-white"
  }`;

export default function SiteHeader() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-30 mb-6 rounded-2xl border border-church-400/40 bg-church-900/85 p-3 shadow-soft backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/" className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-church-100/90">
            Adventist Website
          </p>
          <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
            DODOMA MAKULU SDA CHURCH
          </h1>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/35 text-white md:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="fungua menyu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <nav className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
        <NavLink to="/" className={navClass}>
          {t("nav.home")}
        </NavLink>
        <NavLink to="/viongozi" className={navClass}>
          Viongozi
        </NavLink>
        <NavLink to="/matukio" className={navClass}>
          Matukio
        </NavLink>
        <NavLink to="/admin/login" className={navClass}>
          {t("nav.admin")}
        </NavLink>
        <a
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
          href="/#mawasiliano"
        >
          Mawasiliano
        </a>
      </nav>

      {menuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/55"
            aria-label="funga menyu"
            onClick={closeMenu}
          />
          <aside className="absolute left-0 top-0 h-full w-72 max-w-[86vw] overflow-y-auto border-r border-white/20 bg-church-950 p-4 text-white shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-white">Menyu</h3>
              <button
                type="button"
                className="rounded-lg border border-white/35 px-2 py-1 text-sm font-semibold text-white"
                onClick={closeMenu}
              >
                Funga
              </button>
            </div>

            <div className="grid gap-1">
              <NavLink to="/" className={navClass} onClick={closeMenu}>
                {t("nav.home")}
              </NavLink>
              <NavLink to="/viongozi" className={navClass} onClick={closeMenu}>
                Viongozi
              </NavLink>
              <NavLink to="/matukio" className={navClass} onClick={closeMenu}>
                Matukio
              </NavLink>
              <NavLink to="/admin/login" className={navClass} onClick={closeMenu}>
                {t("nav.admin")}
              </NavLink>
              <a
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 hover:text-white"
                href="/#mawasiliano"
                onClick={closeMenu}
              >
                Mawasiliano
              </a>
            </div>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
