import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";

type NavbarProps = {
  forceScrolled?: boolean;
  brightness?: "dark" | "light";
};

type NavIconName =
  | "home"
  | "announcements"
  | "departments"
  | "leaders"
  | "groups"
  | "church"
  | "media";

const links = [
  { label: "Mwanzo", type: "anchor", href: "/", icon: "home" as NavIconName },
  { label: "Matukio", type: "route", to: "/matukio", icon: "announcements" as NavIconName },
  { label: "Viongozi", type: "route", to: "/viongozi", icon: "leaders" as NavIconName }
] as const;

const mediaMenuLinks = [
  { label: "Picha", to: "/media?category=photos" },
  { label: "Video", to: "/media?category=videos" }
] as const;

const churchMenuLinks = [
  { label: "Ramani", to: "/kanisa/ramani" },
  { label: "Contacts", to: "/kanisa/contacts" },
  { label: "Kuhusu Kanisa", to: "/kanisa/kuhusu" },
  { label: "Maktaba", to: "/kanisa/maktaba" }
] as const;

function navItemClass(isActive: boolean, useLightText: boolean, compact = false) {
  const sizeClass = compact ? "px-3 py-2.5" : "px-3 py-2";
  const activeClass = useLightText
    ? "border-sky-400 bg-white/10 !text-white visited:!text-white shadow-[0_0_0_1px_rgba(56,189,248,.22)]"
    : "border-sky-500 bg-black/10 !text-slate-950 visited:!text-slate-950 shadow-[0_0_0_1px_rgba(14,165,233,.18)]";
  const idleClass = useLightText
    ? "border-transparent !text-white visited:!text-white hover:border-white/20 hover:bg-white/10 hover:!text-white"
    : "border-transparent !text-slate-950 visited:!text-slate-950 hover:border-black/10 hover:bg-black/5 hover:!text-slate-950";

  return `inline-flex items-center gap-1.5 rounded-lg border ${sizeClass} text-sm lg:text-base font-semibold transition ${isActive ? activeClass : idleClass}`;
}

function NavIcon({ name, className }: { name: NavIconName; className?: string }) {
  if (name === "home") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 11.5L12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.5V20h11v-9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "announcements") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 10l12-5v14L4 14v-4Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 10h2a2 2 0 0 1 0 4h-2" strokeLinecap="round" />
        <path d="M6 14l1.5 5h3L9 13" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "departments") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 10h18M9 20V10" />
      </svg>
    );
  }

  if (name === "leaders") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "groups") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="8" cy="9" r="2.5" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3.5 19a4.5 4.5 0 0 1 9 0M11.5 19a4.5 4.5 0 0 1 9 0" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "church") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v5M10 5h4" strokeLinecap="round" />
        <path d="M6 10h12v11H6z" />
        <path d="M12 14v7M9 21h6" />
      </svg>
    );
  }

  if (name === "media") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="8" cy="10" r="1.5" />
        <path d="M21 15l-4-4-6 7-2-2-6 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4Z" />
      <path d="M9.5 12l1.8 1.8 3.2-3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Navbar({ forceScrolled, brightness = "dark" }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledByPage, setScrolledByPage] = useState(false);
  const [churchDropdownOpen, setChurchDropdownOpen] = useState(false);
  const [mediaDropdownOpen, setMediaDropdownOpen] = useState(false);
  const [mobileChurchOpen, setMobileChurchOpen] = useState(false);
  const [mobileMediaOpen, setMobileMediaOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const isScrolled = forceScrolled ?? scrolledByPage;
  const barRef = useRef<HTMLDivElement | null>(null);
  const desktopChurchMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopMediaMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setChurchDropdownOpen(false);
    setMediaDropdownOpen(false);
    setMobileChurchOpen(false);
    setMobileMediaOpen(false);
  }, [isScrolled, location.pathname, location.hash, location.search]);

  useEffect(() => {
    if (forceScrolled !== undefined) return;

    const handleScroll = () => {
      setScrolledByPage(window.scrollY > 18);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [forceScrolled]);

  useEffect(() => {
    if (!mediaDropdownOpen && !churchDropdownOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (desktopChurchMenuRef.current && !desktopChurchMenuRef.current.contains(target)) {
        setChurchDropdownOpen(false);
      }
      if (desktopMediaMenuRef.current && !desktopMediaMenuRef.current.contains(target)) {
        setMediaDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [churchDropdownOpen, mediaDropdownOpen]);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const height = barRef.current?.offsetHeight ?? 0;
      if (height > 0) {
        document.documentElement.style.setProperty("--navbar-height", `${height}px`);
      }
    };

    updateNavbarHeight();
    window.addEventListener("resize", updateNavbarHeight);
    return () => window.removeEventListener("resize", updateNavbarHeight);
  }, [isScrolled]);

  const theme = useMemo(() => {
    if (isDark) {
      return {
        text: "text-white",
        glass: "bg-black/65 border-black/45 shadow-[0_12px_30px_rgba(0,0,0,.28)] backdrop-blur-md",
        menuSurface: "border-white/10 bg-black shadow-[0_18px_40px_rgba(0,0,0,.35)] backdrop-blur-md",
        dropdownSurface: "border-white/12 bg-slate-950/85 shadow-[0_18px_40px_rgba(0,0,0,.35)] backdrop-blur-md",
        iconButton: "border-white/15 bg-white/10 text-white hover:bg-white/20",
        logoRing: "ring-white/25",
        lightText: true
      };
    }

    return {
      text: "text-slate-950",
      glass:
        brightness === "dark"
          ? "bg-white/75 border-white/65 shadow-[0_12px_30px_rgba(15,23,42,.16)] backdrop-blur-md"
          : "bg-white/82 border-white/70 shadow-[0_12px_30px_rgba(15,23,42,.14)] backdrop-blur-md",
      menuSurface: "border-slate-200/80 bg-white shadow-[0_18px_40px_rgba(15,23,42,.12)] backdrop-blur-md",
      dropdownSurface: "border-slate-200/80 bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,.12)] backdrop-blur-md",
      iconButton: "border-black/10 bg-black/5 text-slate-950 hover:bg-black/10",
      logoRing: "ring-black/15",
      lightText: false
    };
  }, [brightness, isDark]);

  const isHomeHashActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/" && (location.hash === "" || location.hash === "#");
    }
    return false;
  };

  const activeMediaCategory = new URLSearchParams(location.search).get("category");
  const isMediaActive = location.pathname === "/media";
  const isChurchActive = location.pathname.startsWith("/kanisa");

  return (
    <div
      className={`left-0 right-0 top-0 z-40 w-full transition-all duration-500 ${isScrolled ? "fixed" : "absolute"}`}
    >
      <div ref={barRef} className={`w-full border-b ${theme.glass}`}>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center px-3 py-2.5 sm:px-6 lg:px-10">
          <Link to="/" className="inline-flex min-w-0 items-center gap-2">
            <img
              src="/adventistLogo.png"
              alt="Adventist logo"
              className={`h-9 w-9 rounded-full object-cover ring-1 ${theme.logoRing}`}
              loading="eager"
              decoding="async"
            />
            <span
              className={`truncate text-xs font-extrabold uppercase tracking-[0.08em] sm:text-sm lg:text-[0.95rem] ${theme.text}`}
            >
              DODOMA MAKULU SDA CHURCH
            </span>
          </Link>

          <nav className="hidden items-center justify-center gap-1 lg:flex">
            {links.map((item) => {
              if (item.type === "route") {
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) => navItemClass(isActive, theme.lightText)}
                  >
                    <NavIcon name={item.icon} className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                );
              }

              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={navItemClass(isHomeHashActive(item.href), theme.lightText)}
                >
                  <NavIcon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </a>
              );
            })}

            <div className="relative" ref={desktopChurchMenuRef}>
              <button
                type="button"
                className={navItemClass(isChurchActive || churchDropdownOpen, theme.lightText)}
                onClick={() => {
                  setMediaDropdownOpen(false);
                  setChurchDropdownOpen((prev) => !prev);
                }}
                aria-expanded={churchDropdownOpen}
                aria-label="open church menu"
              >
                <NavIcon name="church" className="h-4 w-4" />
                Kanisa
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 transition ${churchDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {churchDropdownOpen ? (
                <div
                  className={`absolute left-0 top-full z-20 mt-2 w-44 rounded-xl border p-1.5 shadow-xl ${theme.dropdownSurface}`}
                >
                  {churchMenuLinks.map((entry) => (
                    <NavLink
                      key={entry.to}
                      to={entry.to}
                      onClick={() => setChurchDropdownOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? theme.lightText
                              ? "border-sky-400 bg-white/10 !text-white visited:!text-white shadow-[0_0_0_1px_rgba(56,189,248,.22)]"
                              : "border-sky-500 bg-black/10 !text-slate-950 visited:!text-slate-950 shadow-[0_0_0_1px_rgba(14,165,233,.18)]"
                            : theme.lightText
                              ? "border-transparent !text-white visited:!text-white hover:border-white/20 hover:bg-white/10 hover:!text-white"
                              : "border-transparent !text-slate-950 visited:!text-slate-950 hover:border-black/10 hover:bg-black/5 hover:!text-slate-950"
                        }`
                      }
                    >
                      {entry.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="relative" ref={desktopMediaMenuRef}>
              <button
                type="button"
                className={navItemClass(isMediaActive || mediaDropdownOpen, theme.lightText)}
                onClick={() => {
                  setChurchDropdownOpen(false);
                  setMediaDropdownOpen((prev) => !prev);
                }}
                aria-expanded={mediaDropdownOpen}
                aria-label="open media menu"
              >
                <NavIcon name="media" className="h-4 w-4" />
                Media
                <svg
                  viewBox="0 0 24 24"
                  className={`h-4 w-4 transition ${mediaDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>

              {mediaDropdownOpen ? (
                <div
                  className={`absolute left-0 top-full z-20 mt-2 w-40 rounded-xl border p-1.5 shadow-xl ${theme.dropdownSurface}`}
                >
                  {mediaMenuLinks.map((entry) => {
                    const isActive =
                      isMediaActive &&
                      (entry.to.includes("videos")
                        ? activeMediaCategory === "videos"
                        : activeMediaCategory !== "videos");

                    return (
                      <NavLink
                        key={entry.to}
                        to={entry.to}
                        onClick={() => setMediaDropdownOpen(false)}
                        className={`block rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                          isActive
                            ? theme.lightText
                              ? "border-sky-400 bg-white/10 !text-white visited:!text-white shadow-[0_0_0_1px_rgba(56,189,248,.22)]"
                              : "border-sky-500 bg-black/10 !text-slate-950 visited:!text-slate-950 shadow-[0_0_0_1px_rgba(14,165,233,.18)]"
                            : theme.lightText
                              ? "border-transparent !text-white visited:!text-white hover:border-white/20 hover:bg-white/10 hover:!text-white"
                              : "border-transparent !text-slate-950 visited:!text-slate-950 hover:border-black/10 hover:bg-black/5 hover:!text-slate-950"
                        }`}
                      >
                        {entry.label}
                      </NavLink>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </nav>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition ${theme.iconButton}`}
            aria-label={isDark ? "badili kuwa light mode" : "badili kuwa dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M12 3v2M12 19v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M3 12h2M19 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path
                  d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition lg:hidden ${theme.iconButton}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="fungua menyu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-slate-950/55 lg:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="funga menyu"
            />
            <motion.aside
              initial={{ x: "100%", opacity: 0.6 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.7 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={`fixed right-0 top-0 z-50 h-full w-[18rem] max-w-[88vw] border-l p-4 shadow-2xl lg:hidden ${theme.menuSurface}`}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-sm font-bold uppercase tracking-[0.16em] ${theme.text}`}>Menyu</h3>
                <button
                  type="button"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border ${theme.iconButton}`}
                  onClick={() => setMenuOpen(false)}
                  aria-label="funga menyu"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-1.5">
                {links.map((item) => {
                  if (item.type === "route") {
                    return (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => navItemClass(isActive, theme.lightText, true)}
                      >
                        <NavIcon name={item.icon} className="h-4 w-4" />
                        {item.label}
                      </NavLink>
                    );
                  }

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={navItemClass(isHomeHashActive(item.href), theme.lightText, true)}
                    >
                      <NavIcon name={item.icon} className="h-4 w-4" />
                      {item.label}
                    </a>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMediaOpen(false);
                    setMobileChurchOpen((prev) => !prev);
                  }}
                  className={navItemClass(isChurchActive || mobileChurchOpen, theme.lightText, true)}
                  aria-expanded={mobileChurchOpen}
                >
                  <NavIcon name="church" className="h-4 w-4" />
                  <span className="flex-1 text-left">Kanisa</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition ${mobileChurchOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {mobileChurchOpen ? (
                  <div className="grid gap-1 pl-6">
                    {churchMenuLinks.map((entry) => (
                      <NavLink
                        key={entry.to}
                        to={entry.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) => navItemClass(isActive, theme.lightText, true)}
                      >
                        <NavIcon name="church" className="h-4 w-4" />
                        {entry.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    setMobileChurchOpen(false);
                    setMobileMediaOpen((prev) => !prev);
                  }}
                  className={navItemClass(isMediaActive || mobileMediaOpen, theme.lightText, true)}
                  aria-expanded={mobileMediaOpen}
                >
                  <NavIcon name="media" className="h-4 w-4" />
                  <span className="flex-1 text-left">Media</span>
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 transition ${mobileMediaOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {mobileMediaOpen ? (
                  <div className="grid gap-1 pl-6">
                    {mediaMenuLinks.map((entry) => (
                      <NavLink
                        key={entry.to}
                        to={entry.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          navItemClass(
                            isActive ||
                              (location.pathname === "/media" &&
                                (entry.to.includes("videos")
                                  ? activeMediaCategory === "videos"
                                  : activeMediaCategory !== "videos")),
                            theme.lightText,
                            true
                          )
                        }
                      >
                        <NavIcon name="media" className="h-4 w-4" />
                        {entry.label}
                      </NavLink>
                    ))}
                  </div>
                ) : null}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
