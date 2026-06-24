import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-md">
        <BorderAnimatedContainer>
          <div className="w-full p-8">
            {/* HEADING TEXT */}
            <div className="text-center mb-8">
              <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h2 className="text-2xl font-bold text-slate-200 mb-2">Welcome Back</h2>
              <p className="text-slate-400">Login to access to your account</p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* EMAIL INPUT */}
              <div>
                <label className="auth-input-label">Email</label>
                <div className="relative">
                  <MailIcon className="auth-input-icon" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                    placeholder="YourEmail@gmail.com"
                  />
                </div>
              </div>

              {/* PASSWORD INPUT */}
              <div>
                <label className="auth-input-label">Password</label>
                <div className="relative">
                  <LockIcon className="auth-input-icon" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <button className="auth-btn" type="submit" disabled={isLoggingIn}>
                {isLoggingIn ? (
                  <LoaderIcon className="w-full h-5 animate-spin text-center" />
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/signup" className="auth-link">
                Don't have an account? Sign Up
              </Link>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}
export default LoginPage;