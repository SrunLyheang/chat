import { useI18nStore, LANGS } from "../store/useI18nStore";

// With two languages a single button cycles; more languages later can turn
// this into a menu like ThemeSwitcher.
function LanguageSwitcher() {
  const { t, lang, setLang } = useI18nStore();

  const toggleLang = () => {
    const currentIndex = LANGS.findIndex((l) => l.id === lang);
    const next = LANGS[(currentIndex + 1) % LANGS.length];
    setLang(next.id);
  };

  const currentLangLabel = LANGS.find((l) => l.id === lang)?.label || lang;

  return (
    <button
      type="button"
      onClick={toggleLang}
      title={t("profile.language")}
      className="rounded-md border border-edge/60 px-1.5 py-0.5 text-xs font-semibold text-muted hover:text-primary hover:border-primary/50 transition-colors"
    >
      {currentLangLabel}
    </button>
  );
}

export default LanguageSwitcher;
