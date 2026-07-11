import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";

const FullscreenSpinner = () => (
  <div className="w-full h-screen flex items-center justify-center bg-ground">
    <div className="w-8 h-8 border-2 border-edge border-t-primary rounded-full animate-spin" />
  </div>
);

export function RequireAuth({ children }) {
  const { authUser, pendingUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (!authUser && pendingUser) return <Navigate to="/verify-email" replace />;
  if (!authUser) return <Navigate to="/login" replace />;

  return children;
}


export function RequireGuest({ children }) {
  const { authUser, pendingUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (authUser) return <Navigate to="/" replace />;
  if (pendingUser) return <Navigate to="/verify-email" replace />;

  return children;
}


export function RequirePendingOrGuest({ children }) {
  const { authUser, isCheckingAuth } = useAuthStore();

  if (isCheckingAuth) return <FullscreenSpinner />;
  if (authUser) return <Navigate to="/" replace />;

  return children;
}
