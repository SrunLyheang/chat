import { connectDB } from "../lib/db.js";
import User from "../src/models/User.js";

// One-time fix for bots created before botProvider/botModel existed on the
// User schema. New Mongo documents get schema defaults, but EXISTING
// documents don't retroactively gain new fields — that's what was causing
// "Unknown AI provider undefined" at reply time. Run this once:
//   node scripts/fixBotProviders.js

await connectDB();

const brokenBots = await User.find({
  isBot: true,
  $or: [
    { botProvider: { $exists: false } },
    { botProvider: null },
    { botProvider: "" },
    { botModel: { $exists: false } },
    { botModel: null },
    { botModel: "" },
  ],
});

if (brokenBots.length === 0) {
  console.log("No broken bots found — every bot already has a provider set.");
  process.exit(0);
}

for (const bot of brokenBots) {
  bot.botProvider = bot.botProvider || "gemini";
  bot.botModel = bot.botModel || "gemini-3.5-flash";
  await bot.save();
  console.log(`Fixed "${bot.fullName}" (${bot.email}) -> ${bot.botProvider}/${bot.botModel}`);
}

console.log(`Done — fixed ${brokenBots.length} bot(s).`);
process.exit(0);
