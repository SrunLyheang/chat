import mongoose from "mongoose";
import User from "../models/User.js";
import FriendRequest, { orderPair } from "../models/FriendRequest.js";

// Send (or re-send) a friend request to another user.
export const sendFriendRequest = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user." });
    }
    if (myId.equals(targetId)) {
      return res.status(400).json({ message: "You cannot friend yourself." });
    }

    const target = await User.findById(targetId).select("isBot blockedUsers");
    if (!target) {
      return res.status(404).json({ message: "User not found." });
    }
    if (target.isBot) {
      return res.status(400).json({ message: "You cannot friend a bot." });
    }

    // Either direction of a block prevents a friend request.
    const iBlockedThem = (req.user.blockedUsers || []).some((id) => id.toString() === targetId);
    const theyBlockedMe = (target.blockedUsers || []).some((id) => id.toString() === myId.toString());
    if (iBlockedThem || theyBlockedMe) {
      return res.status(403).json({ message: "Unable to send a friend request to this user." });
    }

    const pair = orderPair(myId, targetId);
    const existing = await FriendRequest.findOne(pair);

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ message: "You are already friends." });
      }
      if (existing.status === "pending") {
        if (existing.requestedBy.equals(myId)) {
          return res.status(400).json({ message: "Friend request already sent." });
        }
        // They already sent ME a request — sending one back accepts it (mutual).
        // Transaction keeps the request status and both friends arrays in sync.
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(async () => {
            existing.status = "accepted";
            await existing.save({ session });
            await User.updateOne({ _id: myId }, { $addToSet: { friends: targetId } }, { session });
            await User.updateOne({ _id: targetId }, { $addToSet: { friends: myId } }, { session });
          });
        } finally {
          session.endSession();
        }
        return res.status(200).json({ status: "accepted", request: existing });
      }
      // Previously declined — reopen as a fresh pending request from me.
      existing.status = "pending";
      existing.requestedBy = myId;
      await existing.save();
      return res.status(201).json({ status: "pending", request: existing });
    }

    const request = await FriendRequest.create({ ...pair, requestedBy: myId, status: "pending" });
    res.status(201).json({ status: "pending", request });
  } catch (error) {
    // Unique (userA, userB) index: a concurrent request already created the pair.
    if (error.code === 11000) {
      return res.status(409).json({ message: "A friend request between you two already exists." });
    }
    console.log("Error in sendFriendRequest controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept a pending request that the other user sent to me.
export const acceptFriendRequest = async (req, res) => {
  try {
    const { id: requesterId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(requesterId)) {
      return res.status(400).json({ message: "Invalid user." });
    }

    const pair = orderPair(myId, requesterId);
    const request = await FriendRequest.findOne({ ...pair, status: "pending" });

    if (!request || !request.requestedBy.equals(requesterId)) {
      return res.status(404).json({ message: "No pending request from this user." });
    }

    // Transaction keeps the request status and both friends arrays in sync.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        request.status = "accepted";
        await request.save({ session });
        await User.updateOne({ _id: myId }, { $addToSet: { friends: requesterId } }, { session });
        await User.updateOne({ _id: requesterId }, { $addToSet: { friends: myId } }, { session });
      });
    } finally {
      session.endSession();
    }

    res.status(200).json({ userId: requesterId, status: "accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Decline a pending request that the other user sent to me.
export const declineFriendRequest = async (req, res) => {
  try {
    const { id: requesterId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(requesterId)) {
      return res.status(400).json({ message: "Invalid user." });
    }

    const pair = orderPair(myId, requesterId);
    const request = await FriendRequest.findOne({ ...pair, status: "pending" });

    if (!request || !request.requestedBy.equals(requesterId)) {
      return res.status(404).json({ message: "No pending request from this user." });
    }

    request.status = "declined";
    await request.save();

    res.status(200).json({ userId: requesterId, status: "declined" });
  } catch (error) {
    console.log("Error in declineFriendRequest controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Cancel a pending request I sent to someone else.
export const cancelFriendRequest = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user." });
    }

    const pair = orderPair(myId, targetId);
    const request = await FriendRequest.findOne({ ...pair, status: "pending" });

    if (!request || !request.requestedBy.equals(myId)) {
      return res.status(404).json({ message: "No pending request to cancel." });
    }

    await FriendRequest.deleteOne({ _id: request._id });
    res.status(200).json({ userId: targetId, status: "cancelled" });
  } catch (error) {
    console.log("Error in cancelFriendRequest controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove an existing friend (both directions + delete the pair record).
export const unfriend = async (req, res) => {
  try {
    const { id: targetId } = req.params;
    const myId = req.user._id;

    if (!mongoose.isValidObjectId(targetId)) {
      return res.status(400).json({ message: "Invalid user." });
    }

    // Transaction: both sides of the friendship and the pair record go together.
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await User.updateOne({ _id: myId }, { $pull: { friends: targetId } }, { session });
        await User.updateOne({ _id: targetId }, { $pull: { friends: myId } }, { session });
        await FriendRequest.deleteOne(orderPair(myId, targetId), { session });
      });
    } finally {
      session.endSession();
    }

    res.status(200).json({ userId: targetId, status: "removed" });
  } catch (error) {
    console.log("Error in unfriend controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// My accepted friends (read from the denormalized array).
export const getFriends = async (req, res) => {
  try {
    // Exclude anyone I've blocked — they shouldn't resurface in the Friends tab.
    const friends = await User.find({
      _id: { $in: req.user.friends || [], $nin: req.user.blockedUsers || [] },
    }).select("-password");
    res.status(200).json(friends);
  } catch (error) {
    console.log("Error in getFriends controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pending requests other people sent to me.
export const getIncomingRequests = async (req, res) => {
  try {
    const myId = req.user._id;
    const requests = await FriendRequest.find({
      status: "pending",
      requestedBy: { $ne: myId },
      $or: [{ userA: myId }, { userB: myId }],
    }).populate("requestedBy", "-password");

    res.status(200).json(requests.map((r) => r.requestedBy).filter(Boolean));
  } catch (error) {
    console.log("Error in getIncomingRequests controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Pending requests I sent to other people.
export const getSentRequests = async (req, res) => {
  try {
    const myId = req.user._id;
    const requests = await FriendRequest.find({
      status: "pending",
      requestedBy: myId,
    });

    // The recipient is whichever side of the pair isn't me.
    const recipientIds = requests.map((r) =>
      r.userA.equals(myId) ? r.userB : r.userA
    );
    const recipients = await User.find({ _id: { $in: recipientIds } }).select("-password");
    res.status(200).json(recipients);
  } catch (error) {
    console.log("Error in getSentRequests controller : ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
