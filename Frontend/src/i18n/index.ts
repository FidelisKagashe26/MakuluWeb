import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const defaultLanguage = (() => {
  if (typeof window === "undefined") return "sw";
  return window.localStorage.getItem("app_lang") ?? "sw";
})();

void i18n.use(initReactI18next).init({
  resources: {
    sw: {
      translation: {
        nav: {
          home: "Mwanzo",
          admin: "Admin"
        },
        ui: {
          dark: "Dark",
          light: "Light",
          language: "Lugha"
        },
        hero: {
          ctaPrimary: "Angalia Matukio",
          ctaSecondary: "Wasiliana Nasi"
        }
      }
    },
    en: {
      translation: {
        nav: {
          home: "Home",
          admin: "Admin"
        },
        ui: {
          dark: "Dark",
          light: "Light",
          language: "Language"
        },
        hero: {
          ctaPrimary: "View Events",
          ctaSecondary: "Contact Us"
        }
      }
    }
  },
  lng: defaultLanguage,
  fallbackLng: "sw",
  interpolation: {
    escapeValue: false
  }
});

i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("app_lang", language);
  }
});

export default i18n;
