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
            mode: "LIVE",
            max: 100,
            interval: 60,
        }),
    ],
});

export default aj;