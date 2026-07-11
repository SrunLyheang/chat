import express from "express";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createGroup,
  getMyGroups,
  getGroupMessages,
  sendGroupMessage,
  renameGroup,
  addParticipants,
  removeParticipant,
  leaveGroup,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/", getMyGroups);
router.post("/", createGroup);
router.get("/:id/messages", getGroupMessages);
router.post("/:id/messages", sendGroupMessage);
router.put("/:id/rename", renameGroup);
router.put("/:id/participants", addParticipants);
router.delete("/:id/participants/:userId", removeParticipant);
router.post("/:id/leave", leaveGroup);

export default router;
