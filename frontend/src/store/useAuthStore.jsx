import { create } from 'zustand'
import { axiosInstance } from "../lib/axios"
import { toast } from 'react-hot-toast'
import { io } from "socket.io-client"
import { useChatStore } from "./useChatStore"
import { tr } from "./useI18nStore";
import { BotIcon, UsersIcon } from "lucide-react"

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
      toast.success(tr("toast.signupSuccess"))
      get().connectSocket()

      return true

    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.signupFailed"))
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
      toast.success(tr("toast.loginSuccess"))
      get().connectSocket()

    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.loginFailed"))
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
      toast.success(tr("toast.emailVerified"))
      return true

    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.verifyFailed"))
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
      toast.success(res.data?.message || tr("toast.resendSuccess"))
      return true
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.resendFailed"))
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
      toast.success(tr("toast.loggedOut"))
      get().disconnectSocket()
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.logoutFailed"))
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true })
    try {
      const res = await axiosInstance.put("/auth/update-profile", data)
      set({ authUser: res.data })
      toast.success(tr("toast.profileUpdated"))
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.profileUpdateFailed"))
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
        toast.error(tr("toast.callDeclined"));
        useCallStore.getState().declineCall();
      });
    });

    socket.on("callAnswered", ({ receiverName }) => {
      import("./useCallStore").then(({ useCallStore }) => {
        toast.success(tr("toast.joinedCall", { name: receiverName }));
        useCallStore.getState().setCallStatus("connected");
      });
    });

    socket.on("callEnded", () => {
      import("./useCallStore").then(({ useCallStore }) => {
        toast(tr("toast.callEnded"), { icon: "📞" });
        useCallStore.getState().handleCallLeft();
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
                sender || { _id: message.senderId, fullName: tr("chat.newMessage"), profilePic: null }
              );
              chatStore.setActiveTab("chats");
              toast.dismiss(t.id);
            }}
            className="max-w-sm w-full bg-surface border border-edge/70 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-3 cursor-pointer hover:bg-surface2/80 transition-colors"
          >
            {sender?.isBot ? (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primaryStrong flex items-center justify-center flex-shrink-0">
                <BotIcon className="w-5 h-5 text-onPrimary" />
              </div>
            ) : (
              <img
                src={sender?.profilePic || "/avatar.png"}
                alt={sender?.fullName || tr("chat.newMessage")}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-content font-medium text-sm truncate">
                {sender?.fullName || tr("chat.newMessage")}
              </p>
              <p className="text-muted text-xs truncate">
                {message.image ? tr("chat.photoPreview") : message.text}
              </p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    })

    // --- Group chat events ---
    socket.on("newGroupMessage", (message) => {
      const chatStore = useChatStore.getState();
      const authUserId = toUserId(get().authUser?._id);
      const isMine = toUserId(message.senderId) === authUserId;
      const isOpen =
        chatStore.selectedUser?.isGroup &&
        toUserId(chatStore.selectedUser._id) === toUserId(message.conversationId);

      if (isOpen) {
        if (!isMine) chatStore.appendGroupMessage(message);
        chatStore.promoteGroupForMessage(message, { shouldIncrementUnread: false });
        return;
      }

      chatStore.promoteGroupForMessage(message, { shouldIncrementUnread: !isMine });
      if (isMine) return;

      const group = chatStore.chats.find(
        (c) => c.isGroup && toUserId(c._id) === toUserId(message.conversationId)
      );
      const sender = group?.participants?.find(
        (p) => toUserId(p._id) === toUserId(message.senderId)
      );
      const groupName = group?.fullName || "Group";
      const preview = message.image ? tr("chat.photoPreview") : message.text || tr("chat.newMessage");

      if (chatStore.isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }

      toast.custom(
        (t) => (
          <div
            onClick={() => {
              // Fall back to a minimal group object so the click still opens
              // the conversation before the chat list has refreshed.
              chatStore.setSelectedUser(
                group || {
                  _id: message.conversationId,
                  isGroup: true,
                  fullName: groupName,
                  participants: [],
                }
              );
              chatStore.setActiveTab("chats");
              toast.dismiss(t.id);
            }}
            className="max-w-sm w-full bg-surface border border-edge/70 shadow-lg rounded-xl pointer-events-auto flex items-center gap-3 p-3 cursor-pointer hover:bg-surface2/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-5 h-5 text-onPrimary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-content font-medium text-sm truncate">{groupName}</p>
              <p className="text-muted text-xs truncate">
                {sender ? `${sender.fullName}: ${preview}` : preview}
              </p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    });

    socket.on("addedToGroup", () => {
      useChatStore.getState().getMyChatPartners();
    });

    socket.on("groupUpdated", (conversation) => {
      const chatStore = useChatStore.getState();
      chatStore.getMyChatPartners();
      if (
        chatStore.selectedUser?.isGroup &&
        toUserId(chatStore.selectedUser._id) === toUserId(conversation._id)
      ) {
        import("./useGroupStore").then(({ toGroupSelected }) => {
          useChatStore.getState().setSelectedUser(toGroupSelected(conversation));
        });
      }
    });

    socket.on("removedFromGroup", ({ conversationId }) => {
      const chatStore = useChatStore.getState();
      if (toUserId(chatStore.selectedUser?._id) === toUserId(conversationId)) {
        chatStore.setSelectedUser(null);
      }
      chatStore.getMyChatPartners();
      toast(tr("toast.removedFromGroup"), { icon: "👋" });
    });
  },
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect()
  }
}));

export default useAuthStore

