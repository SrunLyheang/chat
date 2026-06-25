import { create } from 'zustand'
import { axiosInstance } from "../lib/axios"
import { toast } from 'react-hot-toast'

const PENDING_EMAIL_KEY = "pendingVerificationEmail";

// Page refreshes wipe in-memory zustand state, but a user mid-verification
// shouldn't lose their place — so we keep just the email in localStorage,
// enough for the verify-email screen to rehydrate itself.
const getStoredPendingEmail = () => {
  try {
    return localStorage.getItem(PENDING_EMAIL_KEY) || null;
  } catch {
    return null;
  }
};

const setStoredPendingEmail = (email) => {
  try {
    if (email) localStorage.setItem(PENDING_EMAIL_KEY, email);
    else localStorage.removeItem(PENDING_EMAIL_KEY);
  } catch {
    // ignore (e.g. private browsing storage restrictions)
  }
};

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isVerifying: false,
  isResendingVerification: false,
  isCancellingVerification: false,
  isUpdatingProfile: false,
  pendingUser: getStoredPendingEmail() ? { email: getStoredPendingEmail() } : null,


  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check")
      set({ authUser: res.data, pendingUser: null })
      setStoredPendingEmail(null)

    } catch (error) {
      console.log("Error in authCheck: ", error)
      set({ authUser: null })

    } finally {
      set({ isCheckingAuth: false });
    }

  },
  signUp: async (data) => {
    set({ isSigningUp: true })
    try {
      const res = await axiosInstance.post("/auth/signup", data)
      set({ pendingUser: res.data })
      setStoredPendingEmail(res.data.email)
      toast.success("Signup successful! Check your email for verification code.")
      return true

    } catch (error) {
      toast.error(error.response?.data?.message || "Sign up failed. Please try again.")
      return false
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true })
    try {
      const res = await axiosInstance.post("/auth/login", data)
      set({ authUser: res.data, pendingUser: null })
      setStoredPendingEmail(null)
      toast.success("Login successful!")

    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.")
    } finally {
      set({ isLoggingIn: false })
    }
  },

  verifyEmail: async (email, verificationCode) => {
    set({ isVerifying: true })
    try {
      const res = await axiosInstance.post("/auth/verify-email", {
        email,
        verificationCode
      })
      set({ authUser: res.data, pendingUser: null })
      setStoredPendingEmail(null)
      toast.success("Email verified successfully!")
      return true

    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed. Please try again.")
      return false
    } finally {
      set({ isVerifying: false })
    }
  },

  // Issue #2: let a user on the verify-email screen request a fresh code
  resendVerification: async (email) => {
    set({ isResendingVerification: true })
    try {
      const res = await axiosInstance.post("/auth/resend-verification", { email })
      toast.success(res.data?.message || "Verification email resent.")
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend verification email.")
      return false
    } finally {
      set({ isResendingVerification: false })
    }
  },

  // Issue #4: escape hatch — wipes the unverified record server-side and
  // clears all local state so the user can sign up again with a different email
  cancelVerification: async () => {
    const email = get().pendingUser?.email
    set({ isCancellingVerification: true })
    try {
      if (email) {
        await axiosInstance.post("/auth/cancel-verification", { email })
      }
      await axiosInstance.post("/auth/logout").catch(() => { }) // defensive cookie clear
    } catch (error) {
      // Even on failure, clear local state below so the user isn't stuck —
      // worst case is a harmless stale, unverified record on the backend.
      console.log("Error in cancelVerification: ", error)
    } finally {
      setStoredPendingEmail(null)
      set({ pendingUser: null, authUser: null, isCancellingVerification: false })
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout")
      set({ authUser: null })
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed")
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put("/auth/update-profile", data)
      set({ authUser: res.data })
      toast.success("Profile updated successfully!")
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed. Please try again.")
    } finally {
      set({ isUpdatingProfile: false })
    }
  },
}));

export default useAuthStore