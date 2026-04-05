import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const changeLanguage = (lang: "sw" | "en") => {
    void i18n.changeLanguage(lang);
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white/80 p-1 dark:border-slate-700 dark:bg-slate-900/70">
      <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t("ui.language")}
      </span>
      <button
        type="button"
        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
          i18n.language.startsWith("sw")
            ? "bg-church-700 text-white"
            : "text-slate-700 dark:text-slate-200"
        }`}
        onClick={() => changeLanguage("sw")}
      >
        SW
      </button>
      <button
        type="button"
        className={`rounded-lg px-2 py-1 text-xs font-semibold ${
          i18n.language.startsWith("en")
            ? "bg-church-700 text-white"
            : "text-slate-700 dark:text-slate-200"
        }`}
        onClick={() => changeLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
