import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../src/models/User.js";

await connectDB();

const existing = await User.findOne({ email: "bot@yourapp.local" });
if (existing) {
  console.log("Bot already exists. Its ID is:", existing._id.toString());
  process.exit(0);
}

const bot = await User.create({
  email: "bot@yourapp.local",
  fullName: "AI Assistant",
  password: "not-a-real-login-" + Math.random().toString(36), // never used to log in
  isEmailVerified: true,
  isBot: true, // we'll add this field in Step 4
});

console.log("Bot created! Its ID is:", bot._id.toString());
console.log("Copy that ID into BOT_USER_ID in your .env file.");
process.exit(0);