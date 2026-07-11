import { create } from "zustand";

// Registered themes. To add one later: add a [data-theme="..."] token block in
// src/index.css and one entry here — nothing else changes.
export const THEMES = [
  { id: "angkor-night", labelKey: "theme.angkorNight", swatch: ["#171310", "#D9A93E"] },
  { id: "sandstone", labelKey: "theme.sandstone", swatch: ["#ECE2CD", "#B07A18"] },
  { id: "midnight", labelKey: "theme.midnight", swatch: ["#0F172A", "#22D3EE"] },
];

const THEME_KEY = "theme";
const DEFAULT_THEME = "angkor-night";

const applyTheme = (id) => {
  document.documentElement.setAttribute("data-theme", id);
};

const getStoredTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return THEMES.some((t) => t.id === stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
};

const initialTheme = getStoredTheme();
// apply immediately at module load so there's no flash of the wrong theme
applyTheme(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,

  setTheme: (id) => {
    if (!THEMES.some((t) => t.id === id)) return;
    try {
      localStorage.setItem(THEME_KEY, id);
    } catch {
      // ignore (private browsing storage restrictions)
    }
    applyTheme(id);
    set({ theme: id });
  },
}));
