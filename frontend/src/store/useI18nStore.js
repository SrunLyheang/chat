import { create } from "zustand";
import en from "../i18n/en";
import km from "../i18n/km";

// Registered languages. To add one later: create src/i18n/<code>.js and add it
// to DICTS + LANGS below.
const DICTS = { en, km };
export const LANGS = [
  { id: "km", label: "ខ្មែរ" },
  { id: "en", label: "EN" },
];

const LANG_KEY = "lang";
const DEFAULT_LANG = "km"; // Khmer-first

const getStoredLang = () => {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    return DICTS[stored] ? stored : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
};

// Components should read with `const { t } = useI18nStore()` (no selector) so
// they re-render when the language changes. Non-React call sites (store toasts)
// use useI18nStore.getState().t(...) which always reads the current language.
export const useI18nStore = create((set, get) => ({
  lang: getStoredLang(),

  setLang: (lang) => {
    if (!DICTS[lang]) return;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore (private browsing storage restrictions)
    }
    set({ lang });
  },

  // Translate a key with optional {var} interpolation. Falls back to English,
  // then to the key itself, so a missing translation never crashes the UI.
  t: (key, vars) => {
    const { lang } = get();
    let str = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        str = str.split(`{${name}}`).join(String(value));
      }
    }
    return str;
  },

  // BCP-47 locale for date/time formatting.
  locale: () => (get().lang === "km" ? "km-KH" : "en-US"),
}));

// Convenience for non-React call sites (store toasts etc.).
export const tr = (key, vars) => useI18nStore.getState().t(key, vars);
