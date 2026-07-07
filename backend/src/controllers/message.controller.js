import { uploadImage } from "../../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";



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
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
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
    });
    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId)
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage)
    }
    res.status(201).json(newMessage);

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

    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in deleteMessage controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const loggedInUserIdStr = loggedInUserId.toString(); // <-- the fix

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserIdStr
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ].filter((id) => id !== loggedInUserIdStr); // belt-and-suspenders

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");
    res.status(200).json(chatPartners);
  } catch (error) {
    console.log("Error in getChatPartners controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};