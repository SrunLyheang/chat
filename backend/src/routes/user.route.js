import express from "express";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { toggleBlock, getBlockedUsers } from "../controllers/user.controller.js";

const router = express.Router();

// rate limit first, then authenticate (mirrors message.route.js)
router.use(arcjetProtection, protectRoute);

router.get("/blocked", getBlockedUsers);
router.put("/:id/block", toggleBlock);

export default router;
