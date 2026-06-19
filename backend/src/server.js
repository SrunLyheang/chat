import express from "express";
import path from "path";
import { ENV } from "../lib/env.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { connectDB } from "../lib/db.js";

const app = express();
const __dirname = path.resolve()

const BASE_PORT = parseInt(ENV.PORT) || 3000;

app.use(express.json()) // req.body

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Make ready for deployment
if (ENV.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist" ,"index.html"))
    } )
}

// Recursive function to find available port and start server
function startServer(port) {
    const numPort = parseInt(port);
    
    const server = app.listen(numPort, () => {
        console.log("Server running on port:" + numPort)
        connectDB()
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${numPort} is already in use, trying port ${numPort + 1}...`);
            server.close();
            startServer(numPort + 1);
        } else {
            throw err;
        }
    });
}

startServer(BASE_PORT);