import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
import { useNavigate } from "react-router-dom";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { LotusMark, AngkorSilhouette, KbachDivider } from "../components/brand/KhmerMarks";
import { LockIcon, MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router-dom";

function SignUpPage() {
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const { signUp, isSigningUp, pendingUser } = useAuthStore();
  const { t } = useI18nStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (pendingUser) {
      navigate("/verify-email");
    }
  }, [pendingUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    signUp(formData);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-ground">
      <div className="relative w-full max-w-md">
        <BorderAnimatedContainer>
          <div className="relative w-full p-8 overflow-hidden">
            {/* Angkor Wat watermark behind the heading */}
            <AngkorSilhouette className="pointer-events-none absolute left-1/2 top-2 w-56 -translate-x-1/2 text-primary opacity-10" />

            {/* HEADING TEXT */}
            <div className="relative text-center mb-8">
              <LotusMark className="w-14 h-12 mx-auto text-primary mb-3" />
              <h2 className="font-display text-2xl font-bold text-content mb-1">
                {t("app.name")}
              </h2>
              <h3 className="text-lg font-semibold text-primary">{t("auth.createAccount")}</h3>
              <p className="text-muted text-sm mt-1">{t("auth.signupSubtitle")}</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* FULL NAME */}
              <div>
                <label className="auth-input-label">{t("auth.fullName")}</label>
                <div className="relative">
                  <UserIcon className="auth-input-icon" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="input"
                    placeholder={t("auth.fullNamePlaceholder")}
                  />
                </div>
              </div>

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
              <button className="auth-btn" type="submit" disabled={isSigningUp}>
                {isSigningUp ? (
                  <LoaderIcon className="w-full h-5 animate-spin text-center" />
                ) : (
                  t("auth.createAccount")
                )}
              </button>
            </form>

            <KbachDivider className="mx-auto mt-6 h-4 w-40 text-primary/60" />

            <div className="mt-4 text-center">
              <Link to="/login" className="auth-link">
                {t("auth.haveAccount")}
              </Link>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}
export default SignUpPage;
