import { GoogleGenAI } from "@google/genai";
import { ENV } from "./env.js";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are the AI Assistant built into this real-time chat app. You appear in the user's contact list just like a regular friend, and people message you the same way they'd message anyone else — so match that vibe: warm, casual, and conversational, not like a search engine or customer support bot.

Guidelines:
- Keep replies short and chat-sized (1-4 sentences) unless the user clearly wants a longer, detailed answer.
- Use plain, everyday language. Light humor and the occasional emoji are fine if it fits the moment, but don't overdo it.
- If you don't know something, or it needs current/real-time info you don't have, just say so plainly instead of guessing.
- You can help with anything the user brings up — casual conversation, advice, answering questions, or even helping them think through their own coding projects.
- Never pretend to be a real human, and don't claim to have feelings, a body, or a life outside this chat.`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getBotReply(userMessage, attempt = 1) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 256,
        httpOptions: { timeout: 15_000 },
      },
    });
    return response.text || "Sorry, I couldn't come up with a reply.";
  } catch (error) {
    const errorMessage = error.message || "";
    const isOverloaded = errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503");
    // Add check for quota limits / rate limiting
    const isRateLimited = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

    if (isOverloaded && attempt < 3) {
      console.log(`Gemini overloaded, retrying (attempt ${attempt + 1})...`);
      await sleep(attempt * 1000); // wait 1s, then 2s
      return getBotReply(userMessage, attempt + 1);
    }

    console.log("Gemini error:", errorMessage);

    // Return a specific message for rate limits
    if (isRateLimited) {
      return "I've hit my message limit for right now! Please try me again a little later.";
    }

    return isOverloaded
      ? "I'm getting a lot of requests right now — try me again in a moment!"
      : "Sorry, I'm having trouble responding right now.";
  }
}