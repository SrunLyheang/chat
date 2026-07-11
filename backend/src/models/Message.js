import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // For 1:1 messages. Required only when the message is not part of a group
    // conversation, so the existing direct-message path is unchanged.
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return !this.conversationId;
      },
    },
    // Set for group messages; absent for 1:1 messages.
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
    },
    text: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    image: {
      type: String,
    },
    replyTo: {
      messageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      text: {
        type: String,
        trim: true,
        maxlength: 2000,
      },
      image: {
        type: String,
      },
      isDeleted: {
        type: Boolean,
        default: false,
      },
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seenAt: {
      type: Date,
    },
  },
  { timestamps: true }
);
// optimize frequent queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, senderId: 1, createdAt: -1 });
// group messages are fetched by conversation, ordered by time
messageSchema.index({ conversationId: 1, createdAt: 1 });
// require at least one of text and image (unless the message was deleted)
messageSchema.pre("validate", function (next) {
  if (!this.isDeleted && !this.text && !this.image) {
    return next(new Error("Either text or image is required"));
  }
  next()
});


const Message = mongoose.model("Message", messageSchema);

export default Message;
