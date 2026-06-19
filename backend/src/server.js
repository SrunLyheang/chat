
import express from "express";
<<<<<<< HEAD

import path from "path";
import { ENV } from "../lib/env.js";
=======
import dotenv from "dotenv";
import path from "path";
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js"
import { connectDB } from "../lib/db.js";

<<<<<<< HEAD

=======
dotenv.config();
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b

const app = express();
const __dirname = path.resolve()

<<<<<<< HEAD
const PORT = ENV.PORT || 3000;
=======
const PORT = process.env.PORT || 3000;
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b

app.use(express.json()) // req.body

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Make ready for deployment
<<<<<<< HEAD
if (ENV.NODE_ENV === "production") {
=======
if (process.env.NODE_ENV === "production") {
>>>>>>> 457c702afcc6c769ce6866198198b0fd87e2692b
    app.use(express.static(path.join(__dirname, "../frontend/dist")));

    app.get("*", (req,res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist" ,"index.html"))
    } )
}
app.listen(PORT, () => {
    console.log("Server running on port:" + PORT)
    connectDB()

});