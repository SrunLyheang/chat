import mongoose from "mongoose";
import { uploadImage } from "../../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../../lib/socket.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

const participantSelect = "fullName profilePic isBot";

// Is `userId` a participant of `conversation`?
const isParticipant = (conversation, userId) =>
  conversation.participants.some((id) => id.toString() === userId.toString());

const isAdmin = (conversation, userId) =>
  conversation.admins.some((id) => id.toString() === userId.toString());

// Force every currently-connected participant socket into (or out of) the
// group's room so realtime delivery works without a reconnect.
const joinParticipantsToRoom = (participantIds, conversationId) => {
  participantIds.forEach((pid) => {
    const socketId = getReceiverSocketId(pid.toString());
    if (socketId) io.to(socketId).socketsJoin(conversationId.toString());
  });
};

const leaveParticipantRoom = (participantId, conversationId) => {
  const socketId = getReceiverSocketId(participantId.toString());
  if (socketId) io.to(socketId).socketsLeave(conversationId.toString());
};

export const createGroup = async (req, res) => {
  try {
    const myId = req.user._id;
    const { name, participantIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }
    if (!Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({ message: "A group needs at least one other member." });
    }

    const validIds = participantIds.filter((id) => mongoose.isValidObjectId(id));
    // Only real (non-bot) users, excluding the creator (added separately).
    const others = await User.find({
      _id: { $in: validIds, $ne: myId },
      isBot: { $ne: true },
    }).select("_id");

    if (others.length === 0) {
      return res.status(400).json({ message: "No valid members to add." });
    }

    const participants = [myId, ...others.map((u) => u._id)];
    const conversation = await Conversation.create({
      name: name.trim(),
      participants,
      admins: [myId],
      createdBy: myId,
    });

    joinParticipantsToRoom(participants, conversation._id);

    const populated = await Conversation.findById(conversation._id).populate(
      "participants",
      participantSelect
    );

    // Let members refresh their chat list to show the new group.
    participants.forEach((pid) => {
      const socketId = getReceiverSocketId(pid.toString());
      if (socketId) io.to(socketId).emit("addedToGroup", populated);
    });

    res.status(201).json(populated);
  } catch (error) {
    console.log("Error in createGroup controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyGroups = async (req, res) => {
  try {
    const groups = await Conversation.find({ participants: req.user._id })
      .populate("participants", participantSelect)
      .sort({ updatedAt: -1 });
    res.status(200).json(groups);
  } catch (error) {
    console.log("Error in getMyGroups controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isParticipant(conversation, req.user._id)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    const messages = await Message.find({ conversationId }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { text, image, replyTo } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isParticipant(conversation, senderId)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    let replySnapshot;
    if (replyTo) {
      const replyMessageId = typeof replyTo === "string" ? replyTo : replyTo.messageId;
      if (!replyMessageId || !mongoose.isValidObjectId(replyMessageId)) {
        return res.status(400).json({ message: "Invalid reply message." });
      }
      const originalMessage = await Message.findById(replyMessageId);
      if (!originalMessage || originalMessage.conversationId?.toString() !== conversationId) {
        return res.status(400).json({ message: "Cannot reply to a message outside this group." });
      }
      replySnapshot = {
        messageId: originalMessage._id,
        senderId: originalMessage.senderId,
        text: originalMessage.text,
        image: originalMessage.image,
        isDeleted: originalMessage.isDeleted,
      };
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await uploadImage(image, { folder: "chat-app/messages" });
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      conversationId,
      text,
      image: imageUrl,
      replyTo: replySnapshot,
    });

    // Bump the group so it sorts to the top of members' chat lists.
    conversation.updatedAt = new Date();
    await conversation.save();

    io.to(conversationId.toString()).emit("newGroupMessage", newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendGroupMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const renameGroup = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }
    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only admins can rename the group." });
    }

    conversation.name = name.trim();
    await conversation.save();

    const populated = await Conversation.findById(conversationId).populate(
      "participants",
      participantSelect
    );
    io.to(conversationId.toString()).emit("groupUpdated", populated);
    res.status(200).json(populated);
  } catch (error) {
    console.log("Error in renameGroup controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addParticipants = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const { participantIds } = req.body;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only admins can add members." });
    }

    const validIds = (participantIds || []).filter((id) => mongoose.isValidObjectId(id));
    const existing = new Set(conversation.participants.map((id) => id.toString()));
    const users = await User.find({
      _id: { $in: validIds },
      isBot: { $ne: true },
    }).select("_id");
    const toAdd = users.map((u) => u._id).filter((id) => !existing.has(id.toString()));

    if (toAdd.length === 0) {
      return res.status(400).json({ message: "No new members to add." });
    }

    conversation.participants.push(...toAdd);
    await conversation.save();
    joinParticipantsToRoom(toAdd, conversation._id);

    const populated = await Conversation.findById(conversationId).populate(
      "participants",
      participantSelect
    );
    // New members refresh their list; existing members see the roster change.
    toAdd.forEach((pid) => {
      const socketId = getReceiverSocketId(pid.toString());
      if (socketId) io.to(socketId).emit("addedToGroup", populated);
    });
    io.to(conversationId.toString()).emit("groupUpdated", populated);
    res.status(200).json(populated);
  } catch (error) {
    console.log("Error in addParticipants controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { id: conversationId, userId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isAdmin(conversation, req.user._id)) {
      return res.status(403).json({ message: "Only admins can remove members." });
    }
    // Self-removal must go through leaveGroup, which handles admin handoff and
    // empty-group cleanup. Blocking it here also guarantees the group keeps at
    // least one participant and one admin (the requester) after any removal.
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "Use leave group to remove yourself." });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== userId
    );
    conversation.admins = conversation.admins.filter((id) => id.toString() !== userId);
    await conversation.save();
    leaveParticipantRoom(userId, conversationId);

    const populated = await Conversation.findById(conversationId).populate(
      "participants",
      participantSelect
    );
    const removedSocketId = getReceiverSocketId(userId);
    if (removedSocketId) io.to(removedSocketId).emit("removedFromGroup", { conversationId });
    io.to(conversationId.toString()).emit("groupUpdated", populated);
    res.status(200).json(populated);
  } catch (error) {
    console.log("Error in removeParticipant controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation." });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found." });
    }
    if (!isParticipant(conversation, myId)) {
      return res.status(400).json({ message: "You are not a member of this group." });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== myId.toString()
    );
    conversation.admins = conversation.admins.filter((id) => id.toString() !== myId.toString());
    leaveParticipantRoom(myId, conversationId);

    if (conversation.participants.length === 0) {
      // Last one out — clean up the empty group and its messages.
      await Message.deleteMany({ conversationId });
      await Conversation.deleteOne({ _id: conversationId });
    } else {
      // Never leave a group without an admin.
      if (conversation.admins.length === 0) {
        conversation.admins = [conversation.participants[0]];
      }
      await conversation.save();
      const populated = await Conversation.findById(conversationId).populate(
        "participants",
        participantSelect
      );
      io.to(conversationId.toString()).emit("groupUpdated", populated);
    }

    res.status(200).json({ conversationId, left: true });
  } catch (error) {
    console.log("Error in leaveGroup controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
