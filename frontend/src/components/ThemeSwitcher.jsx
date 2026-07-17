import { useEffect, useRef, useState } from "react";
import { PaletteIcon, CheckIcon } from "lucide-react";
import { useThemeStore, THEMES } from "../store/useThemeStore";
import { useI18nStore } from "../store/useI18nStore";

// Palette button + dropdown for picking the app theme. Used in the chat
// ProfileHeader and on the auth pages (login / signup / verify email).
function ThemeSwitcher({ className = "" }) {
  const { theme, setTheme } = useThemeStore();
  const { t } = useI18nStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        className="text-muted hover:text-primary transition-colors"
        onClick={() => setIsOpen((open) => !open)}
        title={t("profile.theme")}
      >
        <PaletteIcon className="size-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-edge/50 bg-ground shadow-lg z-20 overflow-hidden">
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setTheme(option.id);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-content hover:bg-surface transition-colors"
            >
              <span
                className="size-4 shrink-0 rounded-full border border-edge"
                style={{
                  background: `linear-gradient(135deg, ${option.swatch[0]} 45%, ${option.swatch[1]} 45%)`,
                }}
              />
              <span className="flex-1 truncate">{t(option.labelKey)}</span>
              {theme === option.id && <CheckIcon className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
