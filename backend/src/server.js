import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { ENV } from "../lib/env.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import { connectDB } from "../lib/db.js";
import cors from "cors"
import { app, server } from "../lib/socket.js";
import { fileURLToPath } from "url";
import streamRoutes from "./routes/stream.route.js";



app.set('trust proxy', true);
const __dirname = path.resolve()

const BASE_PORT = parseInt(ENV.PORT) || 3000;

app.use(express.json({ limit: "10mb" })) // req.body
app.use(cors({ origin: ENV.CLIENT_URL || "http://localhost:5173", credentials: true }))
app.use(cookieParser())

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/stream", streamRoutes);

// Make ready for deployment
if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}

const httpServer = server.listen(BASE_PORT, () => {
    console.log("Server running on port:" + BASE_PORT)
    connectDB()
});

httpServer.on('error', (err) => {
    console.error("Server error:", err);
    process.exit(1);
});