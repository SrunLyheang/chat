import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MailCheckIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router-dom";

function VerifyEmailPage() {
  const [verificationCode, setVerificationCode] = useState("");
  const { verifyEmail, isVerifying, pendingUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      return;
    }
    await verifyEmail(pendingUser.email, verificationCode);
  };

  if (!pendingUser) {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-slate-900 min-h-screen">
        <div className="text-center">
          <p className="text-slate-300 mb-4">No pending verification</p>
          <Link to="/signup" className="text-blue-400 hover:text-blue-300">
            Go back to signup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900 min-h-screen">
      <div className="relative w-full max-w-md">
        <BorderAnimatedContainer>
          <div className="p-8">
            {/* HEADING TEXT */}
            <div className="text-center mb-8">
              <MailCheckIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-200 mb-2">
                Verify Your Email
              </h2>
              <p className="text-slate-400">
                We've sent a verification code to {pendingUser.email}
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* VERIFICATION CODE INPUT */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  placeholder="000000"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-center tracking-widest text-lg"
                />
                <p className="text-xs text-slate-400 mt-2">
                  Enter the 6-digit code sent to your email
                </p>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={isVerifying || verificationCode.length !== 6}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <LoaderIcon className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>

            {/* RESEND LINK */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-400">
                Didn't receive the code?{" "}
                <button className="text-blue-400 hover:text-blue-300 font-medium">
                  Resend
                </button>
              </p>
            </div>

            {/* BACK TO SIGNUP */}
            <div className="text-center mt-4">
              <Link to="/signup" className="text-slate-400 hover:text-slate-300 text-sm">
                Back to signup
              </Link>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default VerifyEmailPage;
