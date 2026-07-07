import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import useAuthStore from './useAuthStore';


const sortMessages = (msgs) =>
  [...msgs].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

// Keep references to the exact handler functions currently bound to the socket,
// so unsubscribeFromMessages can remove ONLY these listeners with socket.off(event, handler).
// Calling socket.off(event) with no handler removes ALL listeners for that event —
// which was wiping out the global notification listener in useAuthStore too.
let newMessageHandler = null;
let messageEditedHandler = null;
let messageDeletedHandler = null;
let messagesSeenHandler = null;
let userTypingHandler = null;
let userStoppedTypingHandler = null;



export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUserLoading: false,
  isMessagesLoading: false, // Fixed: Changed 'IsMessagesLoading' to 'isMessagesLoading'
  isSoundEnabled: localStorage.getItem('isSoundEnabled') === 'true',
  isTyping: false, // Fixed: Capitalized 'S' to match toggleSound

  toggleSound: () => {
    const nextSoundState = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", String(nextSoundState));
    set({ isSoundEnabled: nextSoundState });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set({ selectedUser }),

  getAllContacts: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUserLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUserLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: sortMessages(res.data) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Immediately update the UI with the optimistic message
    set({ messages: sortMessages([...messages, optimisticMessage]) });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);

      // Fixed: Replace the temporary optimistic message with the actual saved message from the backend
      set({
        messages: sortMessages(
          get().messages.map((msg) => msg._id === tempId ? res.data : msg)
        )
      });
    } catch (error) {
      set({ messages: messages });
      toast.error(error.response?.data?.message || "Something went wrong");


    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    newMessageHandler = (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId === get().selectedUser?._id;
      if (!isMessageSentFromSelectedUser) return;
      const currentMessages = get().messages
      set({ messages: sortMessages([...currentMessages, newMessage]) })
      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");

        notificationSound.currentTime = 0; // reset to start
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }
    };
    socket.on("newMessage", newMessageHandler);

    messageEditedHandler = (updatedMessage) => {
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      });
    };
    socket.on("messageEdited", messageEditedHandler);

    messageDeletedHandler = (deletedMessage) => {
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((msg) =>
          msg._id === deletedMessage._id ? deletedMessage : msg
        ),
      });
    };
    socket.on("messageDeleted", messageDeletedHandler);

    messagesSeenHandler = ({ seenBy }) => {
      const { authUser } = useAuthStore.getState();
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((msg) =>
          msg.senderId === authUser._id && msg.receiverId === seenBy
            ? { ...msg, seen: true }
            : msg
        ),
      });
    };
    socket.on("messagesSeen", messagesSeenHandler);

    userTypingHandler = ({ userId }) => {
      if (userId === get().selectedUser?._id) set({ isTyping: true });
    };
    socket.on("userTyping", userTypingHandler);

    userStoppedTypingHandler = ({ userId }) => {
      if (userId === get().selectedUser?._id) set({ isTyping: false });
    };
    socket.on("userStoppedTyping", userStoppedTypingHandler);
  },
  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    if (newMessageHandler) socket.off("newMessage", newMessageHandler);
    if (messageEditedHandler) socket.off("messageEdited", messageEditedHandler);
    if (messageDeletedHandler) socket.off("messageDeleted", messageDeletedHandler);
    if (messagesSeenHandler) socket.off("messagesSeen", messagesSeenHandler);
    if (userTypingHandler) socket.off("userTyping", userTypingHandler);
    if (userStoppedTypingHandler) socket.off("userStoppedTyping", userStoppedTypingHandler);
    newMessageHandler = null;
    messageEditedHandler = null;
    messageDeletedHandler = null;
    messagesSeenHandler = null;
    userTypingHandler = null;
    userStoppedTypingHandler = null;
    set({ isTyping: false });
  },

  startTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("typing", { receiverId: selectedUser._id });
  },

  stopTyping: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    const socket = useAuthStore.getState().socket;
    socket?.emit("stopTyping", { receiverId: selectedUser._id });
  },

  editMessage: async (messageId, text) => {
    const previousMessages = get().messages;
    // optimistic update
    set({
      messages: previousMessages.map((msg) =>
        msg._id === messageId ? { ...msg, text, isEdited: true } : msg
      ),
    });
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text });
      set({
        messages: get().messages.map((msg) => (msg._id === messageId ? res.data : msg)),
      });
    } catch (error) {
      set({ messages: previousMessages });
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  deleteMessage: async (messageId) => {
    const previousMessages = get().messages;
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      set({
        messages: get().messages.map((msg) => (msg._id === messageId ? res.data : msg)),
      });
    } catch (error) {
      set({ messages: previousMessages });
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },
}));