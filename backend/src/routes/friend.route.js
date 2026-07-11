import express from "express";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  getFriends,
  getIncomingRequests,
  getSentRequests,
} from "../controllers/friend.controller.js";

const router = express.Router();

// rate limit first, then authenticate (mirrors message.route.js)
router.use(arcjetProtection, protectRoute);

router.get("/", getFriends);
router.get("/requests", getIncomingRequests);
router.get("/requests/sent", getSentRequests);

router.post("/request/:id", sendFriendRequest);
router.put("/request/:id/accept", acceptFriendRequest);
router.put("/request/:id/decline", declineFriendRequest);
router.delete("/request/:id", cancelFriendRequest);

router.delete("/:id", unfriend);

export default router;
