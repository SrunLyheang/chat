import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { tr } from "./useI18nStore";

const toId = (value) => (value ? value.toString() : "");

export const useFriendStore = create((set, get) => ({
  friends: [],
  incomingRequests: [],
  sentRequests: [],
  isFriendsLoading: false,

  // Pull everything the Friends tab needs in one shot.
  loadFriendData: async () => {
    set({ isFriendsLoading: true });
    try {
      const [friends, incoming, sent] = await Promise.all([
        axiosInstance.get("/friends"),
        axiosInstance.get("/friends/requests"),
        axiosInstance.get("/friends/requests/sent"),
      ]);
      set({
        friends: friends.data,
        incomingRequests: incoming.data,
        sentRequests: sent.data,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.loadFriendsFailed"));
    } finally {
      set({ isFriendsLoading: false });
    }
  },

  // Relationship of the logged-in user to `userId`, for one-click affordances.
  // Returns "friends" | "incoming" | "sent" | "none".
  relationshipTo: (userId) => {
    const id = toId(userId);
    const { friends, incomingRequests, sentRequests } = get();
    if (friends.some((u) => toId(u._id) === id)) return "friends";
    if (incomingRequests.some((u) => toId(u._id) === id)) return "incoming";
    if (sentRequests.some((u) => toId(u._id) === id)) return "sent";
    return "none";
  },

  sendRequest: async (user) => {
    const id = toId(user?._id);
    if (!id) return;
    try {
      const res = await axiosInstance.post(`/friends/request/${id}`);
      if (res.data.status === "accepted") {
        // Reciprocal request — we're now friends. Clean up any pending lists.
        set((state) => ({
          friends: state.friends.some((u) => toId(u._id) === id)
            ? state.friends
            : [...state.friends, user],
          incomingRequests: state.incomingRequests.filter((u) => toId(u._id) !== id),
          sentRequests: state.sentRequests.filter((u) => toId(u._id) !== id),
        }));
        toast.success(tr("toast.nowFriends"));
      } else {
        set((state) => ({
          sentRequests: state.sentRequests.some((u) => toId(u._id) === id)
            ? state.sentRequests
            : [...state.sentRequests, user],
        }));
        toast.success(tr("toast.requestSent"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.requestFailed"));
    }
  },

  acceptRequest: async (user) => {
    const id = toId(user?._id);
    if (!id) return;
    try {
      await axiosInstance.put(`/friends/request/${id}/accept`);
      set((state) => ({
        friends: state.friends.some((u) => toId(u._id) === id)
          ? state.friends
          : [...state.friends, user],
        incomingRequests: state.incomingRequests.filter((u) => toId(u._id) !== id),
      }));
      toast.success(tr("toast.requestAccepted"));
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.acceptFailed"));
    }
  },

  declineRequest: async (userId) => {
    const id = toId(userId);
    if (!id) return;
    try {
      await axiosInstance.put(`/friends/request/${id}/decline`);
      set((state) => ({
        incomingRequests: state.incomingRequests.filter((u) => toId(u._id) !== id),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.declineFailed"));
    }
  },

  cancelRequest: async (userId) => {
    const id = toId(userId);
    if (!id) return;
    try {
      await axiosInstance.delete(`/friends/request/${id}`);
      set((state) => ({
        sentRequests: state.sentRequests.filter((u) => toId(u._id) !== id),
      }));
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.cancelFailed"));
    }
  },

  unfriend: async (userId) => {
    const id = toId(userId);
    if (!id) return;
    try {
      await axiosInstance.delete(`/friends/${id}`);
      set((state) => ({
        friends: state.friends.filter((u) => toId(u._id) !== id),
      }));
      toast.success(tr("toast.friendRemoved"));
    } catch (error) {
      toast.error(error.response?.data?.message || tr("toast.removeFriendFailed"));
    }
  },
}));
