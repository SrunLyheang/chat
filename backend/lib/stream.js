import { StreamClient } from "@stream-io/node-sdk";
import { ENV } from "./env.js";

if (!ENV.STREAM_API_KEY || !ENV.STREAM_API_SECRET) {
  console.warn("Missing Stream API key/secret — video calling will not work.");
}

export const streamClient = new StreamClient(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);