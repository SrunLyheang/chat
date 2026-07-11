import arcjet, { shield, detectBot, slidingWindow, cloudflare } from "@arcjet/node";

import { ENV } from "./env.js";

const aj = arcjet({
    key: ENV.ARCJET_KEY,
    proxies: [cloudflare()], // tell Arcjet to trust Cloudflare and read the real client IP from it
    rules: [
        shield({ mode: "LIVE" }),
        detectBot({
            mode: "LIVE", // flip this back to LIVE now that proxies is set
            allow: [
                "CATEGORY:SEARCH_ENGINE",
                "CATEGORY:PREVIEW",
            ],
        }),
        slidingWindow({
            // LIVE in production so traffic spikes can't hammer the free-tier MongoDB;
            // DRY_RUN in dev because all local requests share one IP bucket and
            // normal clicking around trips the limit, 429-ing every API call.
            mode: ENV.NODE_ENV === "production" ? "LIVE" : "DRY_RUN",
            max: 100,
            interval: 60,
        }),
    ],
});

export default aj;