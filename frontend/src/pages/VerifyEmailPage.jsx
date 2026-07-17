import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useI18nStore } from "../store/useI18nStore";
import { useNavigate } from "react-router-dom";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ThemeSwitcher from "../components/ThemeSwitcher";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { MailCheckIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router-dom";

function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const {
    verifyEmail,
    resendVerification,
    cancelVerification,
    isVerifying,
    isResendingVerification,
    isCancellingVerification,
    pendingUser,
    authUser,
  } = useAuthStore();
  const { t } = useI18nStore();
  const navigate = useNavigate();

  // Belt-and-suspenders: if verification just succeeded, leave this page
  // even if the router guards aren't wired up yet.
  useEffect(() => {
    if (authUser) navigate("/", { replace: true });
  }, [authUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      return;
    }
    const success = await verifyEmail(pendingUser.email, verificationCode);
    if (success) navigate("/", { replace: true });
  };

  const handleResend = async () => {
    if (!pendingUser?.email) return;
    await resendVerification(pendingUser.email);
  };

  // FIX #4: escape hatch — typo'd email or just want to bail out and restart
  const handleCancel = async () => {
    const confirmed = window.confirm(t("auth.cancelConfirm"));
    if (!confirmed) return;
    await cancelVerification();
    navigate("/signup", { replace: true });
  };

  if (!pendingUser) {
    return (
      <div className="relative w-full flex items-center justify-center p-4 pt-16 sm:pt-4 min-h-screen">
        <div className="absolute right-4 top-4 flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="text-center">
          <p className="text-content mb-4">{t("auth.noPending")}</p>
          <Link to="/signup" className="text-primary hover:text-primaryStrong">
            {t("auth.backToSignup")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full flex items-center justify-center p-4 pt-16 sm:pt-4 min-h-screen">
      <div className="absolute right-4 top-4 flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeSwitcher />
      </div>
      <div className="relative w-full max-w-md">
        <BorderAnimatedContainer>
          <div className="p-6 sm:p-8">
            {/* HEADING TEXT */}
            <div className="text-center mb-8">
              <MailCheckIcon className="w-12 h-12 mx-auto text-muted mb-4" />
              <h2 className="text-2xl font-bold text-content mb-2">
                {t("auth.verifyTitle")}
              </h2>
              <p className="text-muted">
                {t("auth.verifySubtitle", { email: pendingUser.email })}
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* VERIFICATION CODE INPUT */}
              <div>
                <label className="block text-sm font-medium text-content mb-2">
                  {t("auth.verificationCode")}
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-2 bg-surface border border-edge rounded-lg text-content placeholder-muted focus:outline-none focus:border-primary text-center tracking-widest text-lg"
                />
                <p className="text-xs text-muted mt-2">
                  {t("auth.codeHint")}
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full px-4 py-3 bg-gradient-to-r from-primary to-primaryStrong text-onPrimary font-semibold rounded-lg hover:from-primaryStrong hover:to-primaryStrong disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    {t("auth.verifying")}
                  </>
                ) : (
                  t("auth.verify")
                )}
              </button>
            </form>

            {/* RESEND — Issue #2 */}
            <div className="text-center mt-6">
              <p className="text-sm text-muted">
                {t("auth.noCode")}{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResendingVerification}
                  className="text-primary hover:text-primaryStrong font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendingVerification ? t("auth.sending") : t("auth.resend")}
                </button>
              </p>
            </div>

            {/* ESCAPE HATCH — Issue #4: wrong email, start over cleanly */}
            <div className="text-center mt-4 pt-4 border-t border-edge">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancellingVerification}
                className="text-muted hover:text-red-400 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isCancellingVerification ? t("auth.cancelling") : t("auth.wrongEmail")}
              </button>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
