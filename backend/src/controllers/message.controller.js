import mongoose from "mongoose";
import { uploadImage } from "../../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { getBotReply } from "../../lib/ai/index.js";

const getPreviewText = (message, currentUserId) => {
  if (!message) return "";
  if (message.isDeleted) return "Message deleted";

  if (message.image) {
    return message.senderId?.toString() === currentUserId.toString()
      ? "You: 📷 Photo"
      : "📷 Photo";
  }

  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text) return "New message";

  return message.senderId?.toString() === currentUserId.toString()
    ? `You: ${text}`
    : text;
};

// Overlay the viewer's private per-contact data (nickname, pinned chat) onto a user object.
const withViewerMeta = (userDoc, viewer) => {
  const user = typeof userDoc.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  const userId = user._id.toString();
  const nickname = viewer.nicknames?.get?.(userId);
  if (nickname) user.nickname = nickname;
  user.isPinnedChat = (viewer.pinnedChats || []).some((id) => id.toString() === userId);
  return user;
};

export const getAllContacts = async (req, res) => {

  try {
    const loggedInUserId = req.user._id;
    // Hide anyone this user has blocked from their contact directory.
    const blockedIds = req.user.blockedUsers || [];
    const filteredUser = await User.find({
      _id: { $ne: loggedInUserId, $nin: blockedIds },
    }).select("-password")
    res.status(200).json(filteredUser.map((user) => withViewerMeta(user, req.user)));
  } catch (error) {
    console.log("Error in getAllContacts: ", error);
    res.status(500).json({ message: "Server Error" })

  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id
    const { id: userToChatId } = req.params

    // If the viewer has blocked this user, hide the conversation from the
    // viewer only. We check the viewer's OWN blockedUsers list — never the
    // other user's — so a block never hides the blocked person's own history.
    const blockedByMe = (req.user.blockedUsers || []).some(
      (id) => id.toString() === userToChatId
    );
    if (blockedByMe) {
      return res.status(200).json([]);
    }

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 }); // oldest -> newest, matches existing indexes

    // mark any messages the other user sent to me as seen, and let them know in real time
    const seenResult = await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, seen: false },
      { $set: { seen: true, seenAt: new Date() } }
    );
    if (seenResult.modifiedCount > 0) {
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesSeen", { seenBy: myId });
      }
      // reflect the update in the response we're about to send back
      messages.forEach((msg) => {
        if (msg.senderId.toString() === userToChatId && msg.receiverId.toString() === myId.toString() && !msg.seen) {
          msg.seen = true;
        }
      });
    }

    res.status(200).json(messages)

  } catch (error) {
    console.log("Error in getMessages controller", error.message);
    res.status(500).json({ error: "Internal server error" });

  }

};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }

    // Don't let a user message someone they've blocked.
    const iBlockedReceiver = (req.user.blockedUsers || []).some(
      (id) => id.toString() === receiverId
    );
    if (iBlockedReceiver) {
      return res.status(403).json({ message: "You have blocked this user. Unblock them to send messages." });
    }

    // Fetch the receiver once — used for the existence check, to know which
    // provider/model to reply with if it's a bot, and to see whether the
    // receiver has blocked the sender (blockedUsers must be selected or the
    // check below silently no-ops).
    const receiver = await User.findById(receiverId).select("isBot botProvider botModel blockedUsers");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    // If the receiver has blocked the sender, we still save the message so the
    // sender's own view is unaffected (no error, message appears in their
    // thread), but we skip realtime delivery so the blocker never sees it.
    const receiverBlockedSender = (receiver.blockedUsers || []).some(
      (id) => id.toString() === senderId.toString()
    );

    let replySnapshot;
    if (replyTo) {
      const replyMessageId = typeof replyTo === "string" ? replyTo : replyTo.messageId;
      if (!replyMessageId || !mongoose.isValidObjectId(replyMessageId)) {
        return res.status(400).json({ message: "Invalid reply message." });
      }

      const originalMessage = await Message.findById(replyMessageId);

      if (!originalMessage) {
        return res.status(404).json({ message: "Reply message not found." });
      }

      const isSameConversation =
        (originalMessage.senderId.equals(senderId) && originalMessage.receiverId.equals(receiverId)) ||
        (originalMessage.senderId.equals(receiverId) && originalMessage.receiverId.equals(senderId));

      if (!isSameConversation) {
        return res.status(400).json({ message: "Cannot reply to a message outside this chat." });
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
      // upload base64 image to cloudinary
      const uploadResponse = await uploadImage(image, {
        folder: "chat-app/messages",
      });
      imageUrl = uploadResponse.secure_url;
    }
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replySnapshot,
    });
    await newMessage.save();
    // Skip realtime delivery if the receiver has blocked the sender — the
    // message is saved but the blocker never gets pinged (and won't see it on
    // next fetch, since getMessagesByUserId returns [] for blocked partners).
    if (!receiverBlockedSender) {
      const receiverSocketId = getReceiverSocketId(receiverId)
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage)
      }
    }
    res.status(201).json(newMessage);

    if (receiver.isBot && text && !receiverBlockedSender) {
      const bot = { provider: receiver.botProvider, model: receiver.botModel };

      // Pull recent turns from this conversation so the bot has memory.
      // Capped at 10 messages (~5 back-and-forth exchanges) to keep prompts
      // small — Groq's free tier charges tokens per request either way.
      const recentMessages = await Message.find({
        _id: { $ne: newMessage._id },
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        isDeleted: { $ne: true },
        text: { $exists: true, $ne: null },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("senderId text");

      const history = recentMessages
        .reverse()
        .map((m) => ({
          role: m.senderId.toString() === senderId.toString() ? "user" : "assistant",
          text: m.text,
        }));

      void getBotReply(bot, text, history).then(async (replyText) => {
        const botMessage = new Message({
          senderId: receiverId,
          receiverId: senderId,
          text: replyText,
        });
        await botMessage.save();

        const userSocketId = getReceiverSocketId(senderId);
        if (userSocketId) {
          io.to(userSocketId).emit("newMessage", botMessage);
        }
      }).catch((error) => {
        console.error("Failed to generate bot reply:", error);
        const userSocketId = getReceiverSocketId(senderId);
        if (userSocketId) io.to(userSocketId).emit("botReplyFailed");
      });
    }

  } catch (error) {
    console.log("Error in sendMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });


  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const myId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (!message.senderId.equals(myId)) {
      return res.status(403).json({ message: "You can only edit your own messages." });
    }
    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted message." });
    }

    message.text = text.trim();
    message.isEdited = true;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (!message.senderId.equals(myId)) {
      return res.status(403).json({ message: "You can only delete your own messages." });
    }

    message.isDeleted = true;
    message.text = undefined;
    message.image = undefined;
    // a deleted message has nothing left to show in the pinned bar
    message.isPinned = false;
    message.pinnedAt = undefined;
    message.pinnedBy = undefined;
    await message.save();

    const replyMessages = await Message.find({
      "replyTo.messageId": message._id,
      isDeleted: false,
    });

    const updatedReplyMessages = await Promise.all(
      replyMessages.map((replyMessage) => {
        replyMessage.replyTo.text = undefined;
        replyMessage.replyTo.image = undefined;
        replyMessage.replyTo.isDeleted = true;
        return replyMessage.save();
      })
    );

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", message);
      updatedReplyMessages.forEach((updatedReplyMessage) => {
        io.to(receiverSocketId).emit("messageEdited", updatedReplyMessage);
      });
    }

    res.status(200).json({
      deletedMessages: [message],
      updatedMessages: updatedReplyMessages,
    });
  } catch (error) {
    console.log("Error in deleteMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const togglePinMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const myId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }
    if (!message.senderId.equals(myId) && !message.receiverId.equals(myId)) {
      return res.status(403).json({ message: "You can only pin messages in your own chats." });
    }
    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot pin a deleted message." });
    }

    message.isPinned = !message.isPinned;
    message.pinnedAt = message.isPinned ? new Date() : undefined;
    message.pinnedBy = message.isPinned ? myId : undefined;
    await message.save();

    // let the other participant's open chat reflect the pin in real time
    const otherUserId = message.senderId.equals(myId) ? message.receiverId : message.senderId;
    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit("messagePinned", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in togglePinMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const togglePinChat = async (req, res) => {
  try {
    const { id: contactId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(400).json({ message: "Invalid contact." });
    }
    if (myId.equals(contactId)) {
      return res.status(400).json({ message: "Cannot pin a chat with yourself." });
    }

    const contact = await User.findById(contactId).select("_id");
    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    const isCurrentlyPinned = (req.user.pinnedChats || []).some((id) => id.toString() === contactId);
    await User.updateOne(
      { _id: myId },
      isCurrentlyPinned
        ? { $pull: { pinnedChats: contactId } }
        : { $addToSet: { pinnedChats: contactId } }
    );

    res.status(200).json({ contactId, isPinnedChat: !isCurrentlyPinned });
  } catch (error) {
    console.log("Error in togglePinChat controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const setNickname = async (req, res) => {
  try {
    const { id: contactId } = req.params;
    const myId = req.user._id;
    const nickname = typeof req.body.nickname === "string" ? req.body.nickname.trim() : "";

    if (!mongoose.isValidObjectId(contactId)) {
      return res.status(400).json({ message: "Invalid contact." });
    }
    if (myId.equals(contactId)) {
      return res.status(400).json({ message: "Cannot set a nickname for yourself." });
    }
    if (nickname.length > 50) {
      return res.status(400).json({ message: "Nickname must be 50 characters or less." });
    }

    const contact = await User.findById(contactId).select("_id");
    if (!contact) {
      return res.status(404).json({ message: "Contact not found." });
    }

    // $set/$unset directly so pre-existing users without a `nicknames` field work too
    if (nickname) {
      await User.updateOne({ _id: myId }, { $set: { [`nicknames.${contactId}`]: nickname } });
    } else {
      await User.updateOne({ _id: myId }, { $unset: { [`nicknames.${contactId}`]: "" } });
    }

    res.status(200).json({ contactId, nickname: nickname || null });
  } catch (error) {
    console.log("Error in setNickname controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const loggedInUserIdStr = loggedInUserId.toString();
    // Partners the viewer has blocked should not appear in their chat list.
    const blockedIdSet = new Set((req.user.blockedUsers || []).map((id) => id.toString()));

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    }).sort({ createdAt: -1 });

    const latestMessagesByPartner = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.senderId.toString() === loggedInUserIdStr
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (partnerId === loggedInUserIdStr) return;
      if (blockedIdSet.has(partnerId)) return;

      const currentLatest = latestMessagesByPartner.get(partnerId);
      if (!currentLatest || new Date(msg.createdAt) > new Date(currentLatest.createdAt)) {
        latestMessagesByPartner.set(partnerId, msg);
      }
    });

    const orderedPartnerIds = [...latestMessagesByPartner.keys()];
    const chatPartners = await User.find({ _id: { $in: orderedPartnerIds } }).select("-password");
    const chatPartnersById = new Map(chatPartners.map((user) => [user._id.toString(), user]));

    const response = orderedPartnerIds
      .map((partnerId) => {
        const partner = chatPartnersById.get(partnerId);
        const lastMessage = latestMessagesByPartner.get(partnerId);

        if (!partner || !lastMessage) return null;

        return {
          ...withViewerMeta(partner, req.user),
          lastMessage: {
            _id: lastMessage._id,
            text: lastMessage.text,
            image: lastMessage.image,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            isDeleted: lastMessage.isDeleted,
          },
          lastMessagePreview: getPreviewText(lastMessage, loggedInUserId),
          lastMessageAt: lastMessage.createdAt,
        };
      })
      .filter(Boolean);

    res.status(200).json(response);
  } catch (error) {
    console.log("Error in getChatPartners controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
