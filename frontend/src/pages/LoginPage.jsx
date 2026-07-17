import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ThemeSwitcher from "../components/ThemeSwitcher";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { LotusMark, AngkorSilhouette, KbachDivider } from "../components/brand/KhmerMarks";
import { LockIcon, MailIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();
  const { t } = useI18nStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 pt-16 sm:pt-4">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="relative w-full max-w-md">
        <BorderAnimatedContainer>
          <div className="relative w-full p-6 sm:p-8 overflow-hidden">
            {/* Angkor Wat watermark behind the heading */}
            <AngkorSilhouette className="pointer-events-none absolute left-1/2 top-2 w-56 -translate-x-1/2 text-primary opacity-10" />

            {/* HEADING TEXT */}
            <div className="relative text-center mb-8">
              <LotusMark className="w-14 h-12 mx-auto text-primary mb-3" />
              <h2 className="font-display text-2xl font-bold text-content mb-1">
                {t("app.name")}
              </h2>
              <h3 className="text-lg font-semibold text-primary">{t("auth.welcomeBack")}</h3>
              <p className="text-muted text-sm mt-1">{t("auth.loginSubtitle")}</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EMAIL INPUT */}
              <div>
                <label className="auth-input-label">{t("auth.email")}</label>
                <div className="relative">
                  <MailIcon className="auth-input-icon" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder={t("auth.emailPlaceholder")}
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div>
                <label className="auth-input-label">{t("auth.password")}</label>
                <div className="relative">
                  <LockIcon className="auth-input-icon" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    placeholder={t("auth.passwordPlaceholder")}
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <LoaderIcon className="w-full h-5 animate-spin text-center" />
                ) : (
                  t("auth.signIn")
                )}
              </button>
            </form>

            <KbachDivider className="mx-auto mt-6 h-4 w-40 text-primary/60" />

            <div className="mt-4 text-center">
              <Link to="/signup" className="auth-link">
                {t("auth.noAccount")}
              </Link>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}
export default LoginPage;
