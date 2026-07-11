import mongoose from "mongoose";
import User from "../models/User.js";

// Toggle whether the logged-in user has blocked another user.
// Blocking is one-directional and only affects the blocker's own view:
// the blocked user disappears from the blocker's contacts/chats/search and
// their realtime messages stop being delivered to the blocker. The blocked
// user's experience is unchanged.
export const toggleBlock = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user." });
    }
    if (myId.equals(targetId)) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const target = await User.findById(targetId).select("_id");
    if (!target) {
      return res.status(404).json({ message: "User not found." });
    }

    const isCurrentlyBlocked = (req.user.blockedUsers || []).some(
      (id) => id.toString() === targetId
    );
    await User.updateOne(
      { _id: myId },
      isCurrentlyBlocked
        ? { $pull: { blockedUsers: targetId } }
        : { $addToSet: { blockedUsers: targetId } }
    );

    res.status(200).json({ userId: targetId, isBlocked: !isCurrentlyBlocked });
  } catch (error) {
    console.log("Error in toggleBlock controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Return the full user docs for everyone the logged-in user has blocked.
// Needed to populate the "unblock" UI, since blocked users are excluded from
// the normal contacts list.
export const getBlockedUsers = async (req, res) => {
  try {
    const blockedIds = req.user.blockedUsers || [];
    const blockedUsers = await User.find({ _id: { $in: blockedIds } }).select("-password");
    res.status(200).json(blockedUsers);
  } catch (error) {
    console.log("Error in getBlockedUsers controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
