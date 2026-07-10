import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../src/models/User.js";

// Usage:
//   node scripts/seedBot.js
//     -> creates the original Gemini bot (bot@yourapp.local), same as before
//
//   node scripts/seedBot.js groq-bot@yourapp.local "Groq Bot" groq llama-3.3-70b-versatile
//     -> creates a second bot backed by Groq

const [, , emailArg, nameArg, providerArg, modelArg] = process.argv;

const email = emailArg || "bot@yourapp.local";
const fullName = nameArg || "AI Assistant";
const botProvider = providerArg || "gemini";
const botModel = modelArg || "gemini-3.5-flash";

await connectDB();

const existing = await User.findOne({ email });
if (existing) {
  // Bots created before botProvider/botModel existed on the schema won't
  // have them set. Previously this branch just exited, which is why
  // "Unknown AI provider undefined" kept happening even after re-running
  // this script — backfill instead.
  if (!existing.botProvider || !existing.botModel) {
    existing.isBot = true;
    existing.botProvider = existing.botProvider || botProvider;
    existing.botModel = existing.botModel || botModel;
    await existing.save();
    console.log(`Bot "${email}" was missing provider/model — backfilled to ${existing.botProvider}/${existing.botModel}.`);
  } else {
    console.log(`Bot "${email}" already exists and is fully configured (${existing.botProvider}/${existing.botModel}).`);
  }
  console.log("Its ID is:", existing._id.toString());
  process.exit(0);
}

const bot = await User.create({
  email,
  fullName,
  password: "not-a-real-login-" + Math.random().toString(36), // never used to log in
  isEmailVerified: true,
  isBot: true,
  botProvider,
  botModel,
});

console.log(`Bot "${fullName}" created (${botProvider}/${botModel})! Its ID is:`, bot._id.toString());
console.log("Copy that ID into your .env file — see message.controller.js for how bot IDs are used.");
process.exit(0);
