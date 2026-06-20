import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import { ENV } from "../lib/env.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "../lib/db.js";

const app = express();
const __dirname = path.resolve()

const BASE_PORT = parseInt(ENV.PORT) || 3000;

app.use(express.json()) // req.body
app.use(cookieParser())

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Make ready for deployment
if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"))
    })
}

// Recursive function to find available port and start server
function startServer(port, maxRetries = 10, retryCount = 0) {
    const numPort = parseInt(port);
    const MAX_PORT = 65535;

    // Check if port exceeds maximum allowed port
    if (numPort > MAX_PORT) {
        const error = new Error(`Cannot bind to port ${numPort}: exceeds maximum port 65535`);
        console.error(error.message);
        process.exit(1);
    }

    // Check if max retries exceeded
    if (retryCount >= maxRetries) {
        const error = new Error(`Failed to find available port after ${maxRetries} attempts (tried ports ${numPort - maxRetries} to ${numPort})`);
        console.error(error.message);
        process.exit(1);
    }

    const server = app.listen(numPort, () => {
        console.log("Server running on port:" + numPort)
        connectDB()
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${numPort} is already in use, trying port ${numPort + 1}...`);
            server.close();
            startServer(numPort + 1, maxRetries, retryCount + 1);
        } else {
            throw err;
        }
    });
}

startServer(BASE_PORT);