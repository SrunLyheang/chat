import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

import { ENV } from "./env.js";

const aj = arcjet({
    key: ENV.ARCJET_KEY,
    rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
            mode: "DRY_RUN", // was "LIVE" — logs only, doesn't block, while we investigate
            allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
        }),
        // Create a token bucket rate limit. Other algorithms are supported.
        slidingWindow({
            mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
            max: 100,
            interval: 60,
        }),
    ],
});

export default aj;