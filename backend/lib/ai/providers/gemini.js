import { GoogleGenAI } from "@google/genai";
import { ENV } from "../../env.js";
import { SYSTEM_PROMPT } from "../systemPrompt.js";

const ai = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every provider exports the same shape: generateReply(model, userMessage) -> string
export async function generateReply(model, userMessage, attempt = 1) {
  try {
    const response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 256,
        httpOptions: { timeout: 15_000 },
      },
    });
    return { text: response.text || "Sorry, I couldn't come up with a reply.", rateLimited: false };
  } catch (error) {
    const errorMessage = error.message || "";
    const isOverloaded = errorMessage.includes("UNAVAILABLE") || errorMessage.includes("503");
    const isRateLimited = errorMessage.includes("429") || errorMessage.includes("RESOURCE_EXHAUSTED");

    if (isOverloaded && attempt < 3) {
      console.log(`Gemini overloaded, retrying (attempt ${attempt + 1})...`);
      await sleep(attempt * 1000);
      return generateReply(model, userMessage, attempt + 1);
    }

    console.log("Gemini error:", errorMessage);

    if (isRateLimited) {
      return { text: "Bot has hit message limit can not chat now", rateLimited: true, retryAfterSeconds: 60 };
    }

    return {
      text: isOverloaded
        ? "I'm getting a lot of requests right now — try me again in a moment!"
        : "Sorry, I'm having trouble responding right now.",
      rateLimited: false,
    };
  }
}