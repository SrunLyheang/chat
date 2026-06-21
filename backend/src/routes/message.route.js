
import express from "express";
import arcjetProtection from "@arcjet/node";
import { getAllContacts, getChatPartners, getMessagesByUserId, sendMessage } from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
const router = express.Router();

// the middleware executes in order -so request get rate limited first, then authenticated
// this is more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);



export default router;