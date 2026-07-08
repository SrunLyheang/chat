import { streamClient } from "../../lib/stream.js";

export const getStreamToken = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    // Stream needs to know this user exists on their side too
    await streamClient.upsertUsers([
      {
        id: userId,
        name: req.user.fullName,
        image: req.user.profilePic || undefined,
      },
    ]);

    const token = streamClient.generateUserToken({ user_id: userId });

    res.status(200).json({ token, apiKey: process.env.STREAM_API_KEY, userId });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};