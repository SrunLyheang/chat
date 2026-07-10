import { GoogleGenAI } from "@google/genai";
import { ENV } from "../../env.js";
import { SYSTEM_PROMPT } from "../systemPrompt.js";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every provider exports the same shape: generateReply(model, userMessage, history) -> string
export async function generateReply(model, userMessage, history = [], attempt = 1) {
  try {
    // Gemini calls the assistant's turns "model", not "assistant" like OpenAI/Groq.
    const contents = [
      ...history.map((turn) => ({
        role: turn.role === "user" ? "user" : "model",
        parts: [{ text: turn.text }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 512,
        // Flash models "think" before replying by default — that reasoning can
        // eat the whole token budget and blow past the timeout for a simple
        // chat reply. Budget 0 turns it off.
        thinkingConfig: { thinkingBudget: 0 },
        httpOptions: { timeout: 30_000 },
      },
    });
    return response.text || "Sorry, I couldn't come up with a reply.";
  } catch (error) {
    const errorMessage = error.message || "";
    const isOverloaded = errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503");
    const isTimeout =
      errorMessage.includes("DEADLINE_EXCEEDED") ||
      errorMessage.includes("504") ||
      errorMessage.toLowerCase().includes("timeout");
    const isRateLimited = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

    if ((isOverloaded || isTimeout) && attempt < 3) {
      console.log(`Gemini ${isTimeout ? "timed out" : "overloaded"}, retrying (attempt ${attempt + 1})...`);
      await sleep(attempt * 1000); // wait 1s, then 2s
      return generateReply(model, userMessage, history, attempt + 1);
    }

    console.log("Gemini error:", errorMessage);

    if (isRateLimited) {
      return "I've hit my message limit for right now! Please try me again a little later.";
    }
    if (isTimeout) {
      return "That one took me too long to answer — please try asking again!";
    }

    return isOverloaded
      ? "I'm getting a lot of requests right now — try me again in a moment!"
      : "Sorry, I'm having trouble responding right now.";
  }
}