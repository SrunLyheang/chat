import { create } from 'zustand'
import { axiosInstance } from "../lib/axios"
import { toast } from 'react-hot-toast'
import { io } from "socket.io-client"
import { useChatStore } from "./useChatStore"

const toUserId = (value) => (value ? value.toString() : "");

const PENDING_EMAIL_KEY = "pendingVerificationEmail";
const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";


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
const storedEmail = getStoredPendingEmail();
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
  socket: null,
  onlineUsers: [],
  isVerifying: false,
  isResendingVerification: false,
  isCancellingVerification: false,
  isUpdatingProfile: false,
  pendingUser: storedEmail ? { email: storedEmail } : null,


  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check")
      set({ authUser: res.data, pendingUser: null })
      setStoredPendingEmail(null)
      get().connectSocket()


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
      get().connectSocket()

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
      get().connectSocket()

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
      get().disconnectSocket()
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
  connectSocket: () => {
    const { authUser } = get()
    if (!authUser || get().socket?.connected) return

    const socket = io(BASE_URL, {
      withCredentials: true
    })
    socket.connect()

    set({ socket })

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds })
    })
    socket.on("incomingCall", (payload) => {
      import("./useCallStore").then(({ useCallStore }) => {
        useCallStore.getState().setIncomingCall(payload);
      });
    });

    socket.on("callDeclined", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        toast.error("The other person declined the call.");
        useCallStore.setState({
          incomingCall: null,
          isCallActionPending: false,
          callStatus: "idle",
          callPeerId: null,
        });
      });
    });

    socket.on("callAnswered", ({ receiverName }) => {
      import("./useCallStore").then(({ useCallStore }) => {
        toast.success(`${receiverName} joined the call`);
        useCallStore.setState({ callStatus: "connected" });
      });
    });

    socket.on("callEnded", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        toast("The call has ended.", { icon: "📞" });
        useCallStore.setState({
          activeCall: null,
          incomingCall: null,
          isCallActionPending: false,
          callStatus: "idle",
          callPeerId: null,
        });
      });
    });

    socket.on("newMessage", (message) => {
      const chatStore = useChatStore.getState();
      const isChatOpen = toUserId(chatStore.selectedUser?._id) === toUserId(message.senderId);
      if (isChatOpen) return;

      const sender =
        chatStore.chats.find((c) => toUserId(c._id) === toUserId(message.senderId)) ||
        chatStore.allContacts.find((c) => toUserId(c._id) === toUserId(message.senderId));

      chatStore.promoteChatForMessage(message, sender, { shouldIncrementUnread: false });

      if (!isChatOpen && chatStore.isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              chatStore.setSelectedUser(
                sender || { _id: message.senderId, fullName: "New message", profilePic: null }
              );
              chatStore.setActiveTab("chats");
              toast.dismiss(t.id);
            }}
            className="max-w-sm w-full bg-slate-800 border border-slate-700/70 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/80 transition-colors"
          >
            <img
              src={sender?.profilePic || "/avatar.png"}
              alt={sender?.fullName || "New message"}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-slate-100 font-medium text-sm truncate">
                {sender?.fullName || "New message"}
              </p>
              <p className="text-slate-400 text-xs truncate">
                {message.image ? "📷 Photo" : message.text}
              </p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    })
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect()
  }
}));

export default useAuthStore

