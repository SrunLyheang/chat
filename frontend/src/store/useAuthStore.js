import { create } from 'zustand'
import { axiosInstance } from "../lib/axios"
import { toast } from 'react-hot-toast'

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  isVerifying: false,
  pendingUser: null,


  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check")
      set({ authUser: res.data })
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
      toast.success("Signup successful! Check your email for verification code.")

    } catch (error) {
      toast.error(error.response.data.message || "Sign up failed. Please try again.")
    } finally {
      set({ isSigningUp: false })
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true })
    try {
      const res = await axiosInstance.post("/auth/login", data)
      set({ authUser: res.data })
      toast.success("Login successful!")

    } catch (error) {
      toast.error(error.response.data.message || "Login failed. Please try again.")
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
      toast.success("Email verified successfully!")

    } catch (error) {
      toast.error(error.response.data.message || "Verification failed. Please try again.")
    } finally {
      set({ isVerifying: false })
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout")
      set({ authUser: null })
      toast.success("Logged out successfully")
    } catch (error) {
      toast.error(error.response.data.message || "Logout failed")
    }
  }
}))

export default useAuthStore