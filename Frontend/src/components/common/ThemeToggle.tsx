import { useTranslation } from "react-i18next";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-church-400 hover:text-church-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
      aria-label="toggle theme"
    >
      <span className="text-sm" aria-hidden="true">
        {isDark ? "Sun" : "Moon"}
      </span>
      {isDark ? t("ui.light") : t("ui.dark")}
    </button>
  );
}
