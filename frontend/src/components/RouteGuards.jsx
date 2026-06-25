import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const FullscreenSpinner = () => (
  <div className="w-full h-screen flex items-center justify-center bg-slate-900">
    <div className="w-8 h-8 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

/**
 * Wrap routes that require a fully verified, logged-in user
 * (the main chat layout, settings, profile, etc).
 *
 * A signed-up-but-unverified user gets redirected to /verify-email
 * instead of /login, so they're never "kicked back to square one."
 */
export function RequireAuth({ children }) {
  const { authUser, pendingUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (!authUser && pendingUser) return <Navigate to="/verify-email" replace />;
  if (!authUser) return <Navigate to="/login" replace />;

  return children;
}

/**
 * Wrap "logged-out only" routes like /login and /signup.
 *
 * This is what makes the lockout in Issue #4 actually stick: a user with a
 * pending signup can't dodge /verify-email by just navigating to /signup
 * again — they get bounced back until they verify or use the explicit
 * "Cancel & start over" button (which clears pendingUser server-side first).
 */
export function RequireGuest({ children }) {
  const { authUser, pendingUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (authUser) return <Navigate to="/" replace />;
  if (pendingUser) return <Navigate to="/verify-email" replace />;

  return children;
}

/**
 * Wrap /verify-email itself so an already-verified, logged-in user gets
 * sent home instead of seeing the code-entry screen again.
 */
export function RequirePendingOrGuest({ children }) {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (authUser) return <Navigate to="/" replace />;

  return children;
}
