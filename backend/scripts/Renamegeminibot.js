import { connectDB } from "../lib/db.js";
import User from "../src/models/User.js";

// Renames whichever bot is on the "gemini" provider to "Gemini Bot".
// Run once: node scripts/renameGeminiBot.js

await connectDB();

const bot = await User.findOne({ isBot: true, botProvider: "gemini" });

if (!bot) {
  console.log("No Gemini-provider bot found.");
  process.exit(0);
}

bot.fullName = "Gemini Bot";
await bot.save();

console.log(`Renamed bot (${bot.email}) to "Gemini Bot".`);
process.exit(0);