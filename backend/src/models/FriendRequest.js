import mongoose from "mongoose";

// One document represents the relationship between a pair of users, whatever
// its state. The pair is normalized (userA < userB by string comparison) so a
// pair has exactly ONE record regardless of who sent the request — this makes
// "are we already friends / is there a pending request either way" a single
// lookup and lets the unique index below prevent duplicate/racing requests.
const friendRequestSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Who initiated the current pending request (or the last one, if accepted).
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
  },
  { timestamps: true }
);

friendRequestSchema.index({ userA: 1, userB: 1 }, { unique: true });

// Order two ids into the normalized (userA, userB) pair used above.
export const orderPair = (id1, id2) => {
  const a = id1.toString();
  const b = id2.toString();
  return a < b ? { userA: id1, userB: id2 } : { userA: id2, userB: id1 };
};

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

export default FriendRequest;
