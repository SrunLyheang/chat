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
let messagePinnedHandler = null;
let messagesSeenHandler = null;
let userTypingHandler = null;
let userStoppedTypingHandler = null;



const toUserId = (value) => (value ? value.toString() : "");

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  blockedUsers: [],
  activeTab: "chats",
  selectedUser: null,
  replyingTo: null,
  unreadChats: {},
  showIncomingMessagePreview: localStorage.getItem("showIncomingMessagePreview") !== "false",
  isUserLoading: false,
  isMessagesLoading: false, // Fixed: Changed 'IsMessagesLoading' to 'isMessagesLoading'
  isSoundEnabled: localStorage.getItem('isSoundEnabled') === 'true',
  isTyping: false, // Fixed: Capitalized 'S' to match toggleSound
  isBotThinking: false,
  highlightedMessageId: null,

  toggleSound: () => {
    const nextSoundState = !get().isSoundEnabled;
    localStorage.setItem("isSoundEnabled", String(nextSoundState));
    set({ isSoundEnabled: nextSoundState });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => set((state) => {
    const remainingUnreadChats = { ...state.unreadChats };
    const selectedUserId = toUserId(selectedUser?._id);

    if (selectedUserId) {
      delete remainingUnreadChats[selectedUserId];
    }

    return {
      selectedUser,
      replyingTo: null,
      unreadChats: remainingUnreadChats,
    };
  }),
  setReplyingTo: (message) => set({ replyingTo: message }),
  clearReplyingTo: () => set({ replyingTo: null }),
  setHighlightedMessageId: (messageId) => set({ highlightedMessageId: messageId }),
  toggleIncomingMessagePreview: () => {
    const nextValue = !get().showIncomingMessagePreview;
    localStorage.setItem("showIncomingMessagePreview", String(nextValue));
    set({ showIncomingMessagePreview: nextValue });
  },
  promoteChatForMessage: (message, sender, options = {}) => set((state) => {
    const { authUser } = useAuthStore.getState();
    const authUserId = toUserId(authUser?._id);
    const messageSenderId = toUserId(message.senderId);
    const messageReceiverId = toUserId(message.receiverId);
    const chatUserId = toUserId(messageSenderId === authUserId ? messageReceiverId : messageSenderId);
    const currentUnread = state.unreadChats[chatUserId];
    const isIncoming = messageSenderId !== authUserId;
    const shouldIncrementUnread = options.shouldIncrementUnread ?? true;
    const preview = message.image
      ? (messageSenderId === authUserId ? "You: 📷 Photo" : "📷 Photo")
      : message.text || "New message";
    const existingChat =
      state.chats.find((chat) => toUserId(chat._id) === chatUserId) ||
      state.allContacts.find((contact) => toUserId(contact._id) === chatUserId) ||
      sender ||
      { _id: chatUserId, fullName: "New message", profilePic: null };

    const existingChatWithPreview = {
      ...existingChat,
      lastMessage: {
        _id: message._id,
        text: message.text,
        image: message.image,
        senderId: message.senderId,
        createdAt: message.createdAt,
        isDeleted: message.isDeleted,
      },
      lastMessagePreview: messageSenderId === authUserId
        ? `You: ${message.text || "📷 Photo"}`
        : preview,
      lastMessageAt: message.createdAt,
    };

    const otherChats = state.chats.filter((chat) => toUserId(chat._id) !== chatUserId);

    return {
      chats: [existingChatWithPreview, ...otherChats],
      unreadChats: {
        ...state.unreadChats,
        [chatUserId]: isIncoming && shouldIncrementUnread
          ? {
            count: (currentUnread?.count || 0) + 1,
            preview,
          }
          : currentUnread || state.unreadChats[chatUserId],
      },
      activeTab: "chats",
    };
  }),

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

  getGroupMessages: async (conversationId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/conversations/${conversationId}/messages`);
      set({ messages: sortMessages(res.data) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  // Append a realtime group message to the open conversation, deduping by _id
  // (the sender already has their own copy from the optimistic update).
  appendGroupMessage: (message) => {
    const { messages, selectedUser } = get();
    if (!selectedUser?.isGroup) return;
    if (toUserId(message.conversationId) !== toUserId(selectedUser._id)) return;
    if (messages.some((m) => m._id === message._id)) return;
    set({ messages: sortMessages([...messages, message]) });
  },

  // Move a group to the top of the chat list with an updated preview / unread
  // badge. If we don't have the group locally yet, refresh the whole list.
  promoteGroupForMessage: (message, options = {}) => {
    const { authUser } = useAuthStore.getState();
    const authUserId = toUserId(authUser?._id);
    const conversationId = toUserId(message.conversationId);
    const existing = get().chats.find(
      (chat) => chat.isGroup && toUserId(chat._id) === conversationId
    );

    if (!existing) {
      // Brand-new group we haven't loaded — pull the fresh list.
      get().getMyChatPartners();
      return;
    }

    const isIncoming = toUserId(message.senderId) !== authUserId;
    const shouldIncrementUnread = (options.shouldIncrementUnread ?? true) && isIncoming;
    const preview = message.image ? "📷 Photo" : message.text || "New message";

    set((state) => {
      const currentUnread = state.unreadChats[conversationId];
      const updatedChat = {
        ...existing,
        lastMessage: {
          _id: message._id,
          text: message.text,
          image: message.image,
          senderId: message.senderId,
          createdAt: message.createdAt,
          isDeleted: message.isDeleted,
        },
        lastMessagePreview: toUserId(message.senderId) === authUserId ? `You: ${message.text || "📷 Photo"}` : preview,
        lastMessageAt: message.createdAt,
      };
      const otherChats = state.chats.filter((chat) => toUserId(chat._id) !== conversationId);

      return {
        chats: [updatedChat, ...otherChats],
        unreadChats: shouldIncrementUnread
          ? {
            ...state.unreadChats,
            [conversationId]: { count: (currentUnread?.count || 0) + 1, preview },
          }
          : state.unreadChats,
      };
    });
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages, replyingTo } = get();
    const { authUser } = useAuthStore.getState();
    const isGroup = !!selectedUser.isGroup;
    const tempId = `temp-${Date.now()}`;
    const replySnapshot = replyingTo
      ? {
        messageId: replyingTo._id,
        senderId: replyingTo.senderId,
        text: replyingTo.text,
        image: replyingTo.image,
        isDeleted: replyingTo.isDeleted,
      }
      : undefined;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      // group messages carry conversationId; 1:1 messages carry receiverId
      ...(isGroup ? { conversationId: selectedUser._id } : { receiverId: selectedUser._id }),
      text: messageData.text,
      image: messageData.image,
      replyTo: replySnapshot,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    // Immediately update the UI with the optimistic message
    set({ messages: sortMessages([...messages, optimisticMessage]), replyingTo: null });
    if (!isGroup && selectedUser.isBot && messageData.text) {
      set({ isBotThinking: true });
    }

    const endpoint = isGroup
      ? `/conversations/${selectedUser._id}/messages`
      : `/messages/send/${selectedUser._id}`;

    try {
      const res = await axiosInstance.post(endpoint, {
        ...messageData,
        replyTo: replySnapshot ? { messageId: replySnapshot.messageId } : undefined,
      });

      // Replace the temporary optimistic message with the saved message
      set({
        messages: sortMessages(
          get().messages.map((msg) => msg._id === tempId ? res.data : msg)
        ),
      });

      if (isGroup) {
        get().promoteGroupForMessage(res.data, { shouldIncrementUnread: false });
      } else {
        get().promoteChatForMessage(res.data, selectedUser, { shouldIncrementUnread: false });
      }
    } catch (error) {
      set({ messages: messages, replyingTo, isBotThinking: false });
      toast.error(error.response?.data?.message || "Something went wrong");


    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    newMessageHandler = (newMessage) => {
      const currentMessages = get().messages;
      const selectedUserId = toUserId(get().selectedUser?._id);
      const messageSenderId = toUserId(newMessage.senderId);
      const isMessageSentFromSelectedUser = messageSenderId === selectedUserId;

      if (isMessageSentFromSelectedUser) {
        set({ messages: sortMessages([...currentMessages, newMessage]) });
      }
      if (isMessageSentFromSelectedUser && get().selectedUser?.isBot) {
        set({ isBotThinking: false });
      }

      const sender = get().chats.find((chat) => toUserId(chat._id) === messageSenderId) || get().allContacts.find((contact) => toUserId(contact._id) === messageSenderId);
      const shouldNotify = !isMessageSentFromSelectedUser;
      get().promoteChatForMessage(
        newMessage,
        sender || { _id: newMessage.senderId, fullName: "New message", profilePic: null },
        { shouldIncrementUnread: shouldNotify }
      );
      // if (shouldNotify && get().isSoundEnabled) {
      //   const notificationSound = new Audio("/sounds/notification.mp3");

      //   notificationSound.currentTime = 0; // reset to start
      //   notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      // }
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
      const { messages: currentMessages, replyingTo } = get();
      set({
        messages: currentMessages.map((msg) =>
          msg._id === deletedMessage._id ? deletedMessage : msg
        ),
        replyingTo: replyingTo?._id === deletedMessage._id ? null : replyingTo,
      });
    };
    socket.on("messageDeleted", messageDeletedHandler);

    messagePinnedHandler = (updatedMessage) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ),
      });
    };
    socket.on("messagePinned", messagePinnedHandler);

    messagesSeenHandler = ({ seenBy }) => {
      const { authUser } = useAuthStore.getState();
      const currentMessages = get().messages;
      set({
        messages: currentMessages.map((msg) =>
          toUserId(msg.senderId) === toUserId(authUser._id) && toUserId(msg.receiverId) === toUserId(seenBy)
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
    if (messagePinnedHandler) socket.off("messagePinned", messagePinnedHandler);
    if (messagesSeenHandler) socket.off("messagesSeen", messagesSeenHandler);
    if (userTypingHandler) socket.off("userTyping", userTypingHandler);
    if (userStoppedTypingHandler) socket.off("userStoppedTyping", userStoppedTypingHandler);
    newMessageHandler = null;
    messageEditedHandler = null;
    messageDeletedHandler = null;
    messagePinnedHandler = null;
    messagesSeenHandler = null;
    userTypingHandler = null;
    userStoppedTypingHandler = null;
    set({ isTyping: false, isBotThinking: false });
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

  togglePinMessage: async (messageId) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}/pin`);
      set({
        messages: get().messages.map((msg) => (msg._id === res.data._id ? res.data : msg)),
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin message");
    }
  },

  togglePinChat: async (contactId) => {
    try {
      const res = await axiosInstance.put(`/messages/contacts/${contactId}/pin`);
      const { isPinnedChat } = res.data;
      const applyPin = (user) =>
        toUserId(user._id) === toUserId(contactId) ? { ...user, isPinnedChat } : user;

      set((state) => ({
        allContacts: state.allContacts.map(applyPin),
        chats: state.chats.map(applyPin),
        selectedUser: state.selectedUser ? applyPin(state.selectedUser) : state.selectedUser,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to pin chat");
    }
  },

  getBlockedUsers: async () => {
    try {
      const res = await axiosInstance.get("/users/blocked");
      set({ blockedUsers: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load blocked users");
    }
  },

  // Block or unblock a user. On block we also strip them from the visible
  // contacts/chat lists and close the chat if it's currently open, so the UI
  // matches the server-side "hide from the blocker" behavior immediately.
  toggleBlockUser: async (targetUser) => {
    const targetId = toUserId(targetUser?._id);
    if (!targetId) return;
    try {
      const res = await axiosInstance.put(`/users/${targetId}/block`);
      const { isBlocked } = res.data;

      set((state) => {
        if (isBlocked) {
          return {
            allContacts: state.allContacts.filter((u) => toUserId(u._id) !== targetId),
            chats: state.chats.filter((u) => toUserId(u._id) !== targetId),
            blockedUsers: state.blockedUsers.some((u) => toUserId(u._id) === targetId)
              ? state.blockedUsers
              : [...state.blockedUsers, targetUser],
            selectedUser:
              toUserId(state.selectedUser?._id) === targetId ? null : state.selectedUser,
          };
        }
        return {
          blockedUsers: state.blockedUsers.filter((u) => toUserId(u._id) !== targetId),
        };
      });

      toast.success(isBlocked ? "User blocked" : "User unblocked");
      // Refresh contacts so an unblocked user reappears in the directory.
      if (!isBlocked) get().getAllContacts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update block status");
    }
  },

  setNickname: async (contactId, nickname) => {
    try {
      const res = await axiosInstance.put(`/messages/contacts/${contactId}/nickname`, { nickname });
      const savedNickname = res.data.nickname || undefined;
      const applyNickname = (user) =>
        toUserId(user._id) === toUserId(contactId) ? { ...user, nickname: savedNickname } : user;

      set((state) => ({
        allContacts: state.allContacts.map(applyNickname),
        chats: state.chats.map(applyNickname),
        selectedUser: state.selectedUser ? applyNickname(state.selectedUser) : state.selectedUser,
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to set nickname");
    }
  },

  deleteMessage: async (messageId) => {
    const previousMessages = get().messages;
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}`);
      const deletedMessages = res.data.deletedMessages || [res.data];
      const updatedMessages = res.data.updatedMessages || [];
      const deletedMessageMap = new Map(
        deletedMessages.map((deletedMessage) => [deletedMessage._id, deletedMessage])
      );
      const updatedMessageMap = new Map(
        updatedMessages.map((updatedMessage) => [updatedMessage._id, updatedMessage])
      );

      set({
        messages: get().messages.map((msg) =>
          deletedMessageMap.get(msg._id) || updatedMessageMap.get(msg._id) || msg
        ),
        replyingTo: deletedMessageMap.has(get().replyingTo?._id) ? null : get().replyingTo,
      });
    } catch (error) {
      set({ messages: previousMessages });
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },
}));
