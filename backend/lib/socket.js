import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";

import { socketAuthMiddleware } from "../src/middleware/socket.auth.middleware.js";
import Conversation from "../src/models/Conversation.js";


const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);
// Check if user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId]
}



// this is for storing online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Join a Socket.IO room per group this user belongs to, so group messages
  // can be delivered with io.to(conversationId).emit(...). Unlike the 1:1
  // userSocketMap (one socket per user), each socket joins rooms independently.
  Conversation.find({ participants: userId })
    .select("_id")
    .then((conversations) => {
      conversations.forEach((conv) => socket.join(conv._id.toString()));
    })
    .catch((error) => console.log("Error joining conversation rooms:", error.message));

  // When a user is added to a new group (or creates one) while already
  // connected, the client asks to join that room without reconnecting.
  socket.on("joinConversation", async ({ conversationId }) => {
    if (!conversationId) return;
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      }).select("_id");
      if (conversation) socket.join(conversationId.toString());
    } catch (error) {
      console.log("Error validating conversation membership:", error.message);
    }
  });

  socket.on("leaveConversation", ({ conversationId }) => {
    if (conversationId) socket.leave(conversationId.toString());
  });

  // with socket.on we listen for events from clients
  socket.on("typing", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });
  socket.on("callUser", ({ receiverId, callId, callerName }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("incomingCall", {
        callId,
        callerId: userId,
        callerName,
      });
    } else {
      socket.emit("callFailed", { callId, reason: "user_offline" });
    }
  });

  socket.on("declineCall", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callDeclined");
    }
  });

  socket.on("answerCall", ({ receiverId, callId, receiverName }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callAnswered", { callId, receiverName });
    }
  });

  socket.on("endCall", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("callEnded");
    }
  });

  socket.on("stopTyping", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };