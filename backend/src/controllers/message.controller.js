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

export const getAllContacts = async (req, res) => {

  try {
    const loggedInUserId = req.user._id;
    const filteredUser = await User.find({ _id: { $ne: loggedInUserId } }).select("-password")
    res.status(200).json(filteredUser);
  } catch (error) {
    console.log("Error in getAllContacts: ", error);
    res.status(500).json({ message: "Server Error" })

  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id
    const { id: userToChatId } = req.params

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
    // Fetch the receiver once — used for both the existence check and,
    // if it's a bot, to know which provider/model to reply with.
    const receiver = await User.findById(receiverId).select("isBot botProvider botModel");
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

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
    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage)
    }
    res.status(201).json(newMessage);

    if (receiver.isBot && text) {
      if (receiver.rateLimitedUntil && receiver.rateLimitedUntil > new Date()) {
        const botMessage = new Message({
          senderId: receiverId,
          receiverId: senderId,
          text: "Bot has hit message limit can not chat now",
        });
        await botMessage.save();
        const userSocketId = getReceiverSocketId(senderId);
        if (userSocketId) io.to(userSocketId).emit("newMessage", botMessage);
      } else {
        const bot = { provider: receiver.botProvider, model: receiver.botModel };
        void getBotReply(bot, text).then(async ({ text: replyText, rateLimited, retryAfterSeconds }) => {
          if (rateLimited) {
            const until = new Date(Date.now() + (retryAfterSeconds || 60) * 1000);
            await User.findByIdAndUpdate(receiverId, { rateLimitedUntil: until });
            io.emit("botRateLimited", { botId: receiverId.toString(), until });
          }

          const botMessage = new Message({ senderId: receiverId, receiverId: senderId, text: replyText });
          await botMessage.save();

          const userSocketId = getReceiverSocketId(senderId);
          if (userSocketId) io.to(userSocketId).emit("newMessage", botMessage);
        }).catch((error) => {
          console.error("Failed to generate bot reply:", error);
          const userSocketId = getReceiverSocketId(senderId);
          if (userSocketId) io.to(userSocketId).emit("botReplyFailed");
        });
      }
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

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const loggedInUserIdStr = loggedInUserId.toString();

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    }).sort({ createdAt: -1 });

    const latestMessagesByPartner = new Map();

    messages.forEach((msg) => {
      const partnerId = msg.senderId.toString() === loggedInUserIdStr
        ? msg.receiverId.toString()
        : msg.senderId.toString();

      if (partnerId === loggedInUserIdStr) return;

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
          ...partner.toObject(),
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
