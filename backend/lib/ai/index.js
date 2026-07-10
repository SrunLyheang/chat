import * as gemini from "./providers/gemini.js";
import * as groq from "./providers/groq.js";

// Register every provider you add here. To add a new one later (NVIDIA NIM,
// DeepSeek, etc.), drop a providers/<name>.js file that exports
// generateReply(model, userMessage) and add one line below.
const PROVIDERS = {
  gemini,
  groq,
};

/**
 * @param {Object} bot
 * @param {string} bot.provider - key into PROVIDERS, e.g. "gemini" or "groq"
 * @param {string} bot.model - the specific model string for that provider,
 *   e.g. "gemini-3.5-flash" or "llama-3.3-70b-versatile"
 * @param {string} userMessage
 */
export async function getBotReply(bot, userMessage) {
  const provider = PROVIDERS[bot.provider];

  if (!provider) {
    console.log(`Unknown AI provider "${bot.provider}" — check the bot's provider field.`);
    return { text: "Sorry, I'm having trouble responding right now.", rateLimited: false };
  }

  return provider.generateReply(bot.model, userMessage);
}
