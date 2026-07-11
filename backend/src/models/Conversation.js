import mongoose from "mongoose";

// A group conversation. 1:1 chats are still derived implicitly from Message
// sender/receiver pairs and do NOT use this collection — only groups do.
const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: 80,
      required: true,
    },
    avatar: {
      type: String,
      default: "",
    },
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    admins: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
