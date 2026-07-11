import { create } from "zustand";
import { StreamVideoClient, CallingState } from "@stream-io/video-react-sdk";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";
import { tr } from "./useI18nStore";

let clientPromise = null;
let ringtoneAudio = null;

function startRinging() {
  stopRinging(); // just in case one is already playing
  ringtoneAudio = new Audio("/sounds/ringtone.mp3");
  ringtoneAudio.loop = true;
  ringtoneAudio.play().catch((e) => console.log("Ringtone play failed:", e));
}

function stopRinging() {
  if (ringtoneAudio) {
    ringtoneAudio.pause();
    ringtoneAudio.currentTime = 0;
    ringtoneAudio = null;
  }
}

export const useCallStore = create((set, get) => ({
  videoClient: null,
  activeCall: null,
  incomingCall: null,
  callPeerId: null,
  isCallActionPending: false,
  callStatus: "idle",

  getCallId: (userId1, userId2) => [userId1, userId2].sort().join("-"),

  setCallStatus: (status) => set({ callStatus: status }),

  initVideoClient: async () => {
    if (get().videoClient) return get().videoClient;
    if (clientPromise) return clientPromise;

    const { authUser } = useAuthStore.getState();
    if (!authUser) return null;

    clientPromise = (async () => {
      const res = await axiosInstance.get("/stream/token");
      const { token, apiKey, userId } = res.data;
      const client = new StreamVideoClient({
        apiKey,
        user: { id: userId, name: authUser.fullName, image: authUser.profilePic },
        token,
      });
      set({ videoClient: client });
      return client;
    })();

    try {
      return await clientPromise;
    } finally {
      clientPromise = null;
    }
  },

  startCall: async (otherUser) => {
    const { activeCall, isCallActionPending, callPeerId } = get();
    if (activeCall || isCallActionPending || callPeerId) return;
    const { onlineUsers } = useAuthStore.getState();
    if (!onlineUsers.includes(otherUser._id)) {
      toast.error(tr("toast.userOfflineNow", { name: otherUser.fullName }));
      return;
    }
    set({ isCallActionPending: true, callStatus: "connecting", callPeerId: otherUser._id });

    try {
      const client = await get().initVideoClient();
      const { authUser } = useAuthStore.getState();
      const callId = crypto.randomUUID();

      const call = client.call("default", callId);

      await call.join({ create: true });
      set({ activeCall: call, callStatus: "connected" });

      const socket = useAuthStore.getState().socket;
      socket?.emit("callUser", { receiverId: otherUser._id, callId, callerName: authUser.fullName });
    } catch (error) {
      toast.error(tr("toast.callStartFailed"));
      set({ isCallActionPending: false, callStatus: "idle", callPeerId: null });
      console.log("startCall error:", error);
    }
  },

  answerCall: async () => {
    const { incomingCall, activeCall, isCallActionPending } = get();
    if (!incomingCall || activeCall || isCallActionPending) return;

    set({ isCallActionPending: true, callStatus: "connecting", callPeerId: incomingCall.callerId });
    stopRinging();
    try {
      const client = await get().initVideoClient();
      const call = client.call("default", incomingCall.callId);
      await call.join();

      const { authUser } = useAuthStore.getState();
      const socket = useAuthStore.getState().socket;
      socket?.emit("answerCall", {
        receiverId: incomingCall.callerId,
        callId: incomingCall.callId,
        receiverName: authUser.fullName,
      });

      set({ activeCall: call, incomingCall: null, callStatus: "connected" });
    } catch (error) {
      toast.error(tr("toast.callJoinFailed"));
      set({ isCallActionPending: false, callStatus: "idle", callPeerId: null });
      console.log("answerCall error:", error);
    }
  },

  declineCall: () => {
    const { incomingCall, isCallActionPending } = get();
    if (!incomingCall || isCallActionPending) return;
    stopRinging();
    const socket = useAuthStore.getState().socket;
    if (incomingCall) {
      socket?.emit("declineCall", { receiverId: incomingCall.callerId });
    }

    set({ incomingCall: null, isCallActionPending: false, callStatus: "idle", callPeerId: null });
  },

  setIncomingCall: (payload) => {
    startRinging();
    set({ incomingCall: payload, callStatus: "incoming" });
  },

  leaveCall: async () => {
    stopRinging();
    const { activeCall, callPeerId } = get();
    if (!activeCall) {
      set({ activeCall: null, incomingCall: null, callPeerId: null, isCallActionPending: false, callStatus: "idle" });
      return;
    }

    try {
      const socket = useAuthStore.getState().socket;
      if (callPeerId) {
        socket?.emit("endCall", { receiverId: callPeerId });
      }

      if (activeCall.state.callingState !== CallingState.LEFT) {
        await activeCall.leave();
      }
    } catch (error) {
      console.log("leaveCall: call was already left", error.message);
    } finally {
      set({ activeCall: null, incomingCall: null, callPeerId: null, isCallActionPending: false, callStatus: "idle" });
    }
  },

  handleCallLeft: () => {
    stopRinging();
    set({ activeCall: null, incomingCall: null, callPeerId: null, isCallActionPending: false, callStatus: "idle" });
  },
}));