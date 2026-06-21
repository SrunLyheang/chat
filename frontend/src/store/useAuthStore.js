import { create } from 'zustand'
import { axiosInstance } from "../lib/axios"
import { toast } from 'react-hot-toast'

export const useAuthStore = create((set) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,


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
      set({ authUser: res.data })

      toast.success("Sign up successful!")

    } catch (error) {

      toast.error(error.response.data.message || "Sign up failed. Please try again.")
    } finally {
      set({ isSigningUp: false })
    }
  },
}));
