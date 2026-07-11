import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { tr } from "./useI18nStore";
import { useChatStore } from "./useChatStore";
import { useAuthStore } from "./useAuthStore";

// Shape a populated Conversation into the pseudo-"selectedUser" object the chat
// components consume (they branch on `isGroup` the same way they do on `isBot`).
export const toGroupSelected = (conversation) => ({
  _id: conversation._id,
  isGroup: true,
  fullName: conversation.name,
  groupAvatar: conversation.avatar,
  participants: conversation.participants || [],
  admins: conversation.admins || [],
  createdBy: conversation.createdBy,
});

export const useGroupStore = create((set) => ({
  isCreating: false,

  createGroup: async (name, participantIds) => {
    set({ isCreating: true });
    try {
      const res = await axiosInstance.post("/conversations", { name, participantIds });
      const group = toGroupSelected(res.data);

      // Make sure our own socket is in the room (server also force-joins).
      useAuthStore.getState().socket?.emit("joinConversation", { conversationId: group._id });

      const chatStore = useChatStore.getState();
      await chatStore.getMyChatPartners();
      chatStore.setSelectedUser(group);
      chatStore.setActiveTab("chats");
      toast.success(tr("toast.groupCreated"));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.createGroupFailed"));
      return false;
    } finally {
      set({ isCreating: false });
    }
  },

  renameGroup: async (conversationId, name) => {
    try {
      const res = await axiosInstance.put(`/conversations/${conversationId}/rename`, { name });
      const group = toGroupSelected(res.data);
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id?.toString() === conversationId.toString()) {
        chatStore.setSelectedUser(group);
      }
      chatStore.getMyChatPartners();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.renameGroupFailed"));
      return false;
    }
  },

  addParticipants: async (conversationId, participantIds) => {
    try {
      const res = await axiosInstance.put(`/conversations/${conversationId}/participants`, {
        participantIds,
      });
      const group = toGroupSelected(res.data);
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id?.toString() === conversationId.toString()) {
        chatStore.setSelectedUser(group);
      }
      chatStore.getMyChatPartners();
      toast.success(tr("toast.membersAdded"));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.addMembersFailed"));
      return false;
    }
  },

  removeParticipant: async (conversationId, userId) => {
    try {
      const res = await axiosInstance.delete(
        `/conversations/${conversationId}/participants/${userId}`
      );
      const group = toGroupSelected(res.data);
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id?.toString() === conversationId.toString()) {
        chatStore.setSelectedUser(group);
      }
      chatStore.getMyChatPartners();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.removeMemberFailed"));
      return false;
    }
  },

  leaveGroup: async (conversationId) => {
    try {
      await axiosInstance.post(`/conversations/${conversationId}/leave`);
      useAuthStore.getState().socket?.emit("leaveConversation", { conversationId });
      const chatStore = useChatStore.getState();
      if (chatStore.selectedUser?._id?.toString() === conversationId.toString()) {
        chatStore.setSelectedUser(null);
      }
      chatStore.getMyChatPartners();
      toast.success(tr("toast.leftGroup"));
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.leaveGroupFailed"));
      return false;
    }
  },
}));
