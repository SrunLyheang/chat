import { useEffect, useRef } from 'react'
import ChatPage from './pages/ChatPage'
import { useCallStore } from './store/useCallStore'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import PageLoader from './components/PageLoader'
import { RequireAuth, RequireGuest, RequirePendingOrGuest } from './components/RouteGuards'

import { Toaster } from 'react-hot-toast'
import CallModal from './components/CallModal'
import IncomingCallToast from './components/IncomingCallToast'
// side-effect import: applies the stored theme to <html> before first paint
import './store/useThemeStore'

function App() {
  const { checkAuth, isCheckingAuth } = useAuthStore()
  const { activeCall, leaveCall } = useCallStore()
  const activeCallRef = useRef(activeCall)

  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    return () => {
      if (activeCallRef.current) {
        void leaveCall()
      }
    }
  }, [leaveCall])

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="relative min-h-screen bg-ground">
      {/* DECORATORS - GRID BG & GLOW SHAPES (theme-aware via CSS variables).
          Kept in their own fixed, clipped layer so tall pages can scroll on
          small screens without the glow shapes creating overflow. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(var(--edge)/.22)_1px,transparent_1px),linear-gradient(to_bottom,rgb(var(--edge)/.22)_1px,transparent_1px)] bg-[size:14px_24px]" />
        <div className="absolute top-0 -left-4 size-96 bg-accent opacity-20 blur-[100px]" />
        <div className="absolute bottom-0 -right-4 size-96 bg-primary opacity-20 blur-[100px]" />
      </div>

      <Routes>
        <Route path="/" element={<RequireAuth><ChatPage /></RequireAuth>} />
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/signup" element={<RequireGuest><SignUpPage /></RequireGuest>} />
        <Route
          path="/verify-email"
          element={<RequirePendingOrGuest><VerifyEmailPage /></RequirePendingOrGuest>}
        />
      </Routes>
      <CallModal />
      <IncomingCallToast />
      <Toaster />
    </div>
  )
}

export default App
