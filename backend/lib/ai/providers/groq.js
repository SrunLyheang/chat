import { ENV } from "../../env.js";
import { SYSTEM_PROMPT } from "../systemPrompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every provider exports the same shape: generateReply(model, userMessage) -> string
export async function generateReply(model, userMessage, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          max_tokens: 256,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const status = res.status;
        const retryAfterHeader = res.headers.get("retry-after");
        const body = await res.text().catch(() => "");
        const error = new Error(`Groq ${status}: ${body}`);
        error.status = status;
        error.retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : null;
        throw error;
      }

      const data = await res.json();
    } finally {
      clearTimeout(timeout);
    }
    const text = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with a reply.";
    return { text, rateLimited: false };
  } catch (error) {
    const status = error.status;
    const isRateLimited = status === 429;
    const isOverloaded = status === 503 || status === 502;

    if (isOverloaded && attempt < 3) {
      console.log(`Groq overloaded, retrying (attempt ${attempt + 1})...`);
      await sleep(attempt * 1000);
      return generateReply(model, userMessage, attempt + 1);
    }

    console.log("Groq error:", error.message || error);

    if (isRateLimited) {
      return {
        text: "Bot has hit message limit can not chat now",
        rateLimited: true,
        retryAfterSeconds: error.retryAfterSeconds || 60,
      };
    }

    return {
      text: isOverloaded
        ? "I'm getting a lot of requests right now — try me again in a moment!"
        : "Sorry, I'm having trouble responding right now.",
      rateLimited: false,
    };
  }
}
