import Redis from "ioredis";
import { REDIS_URL } from "./env.js";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
});

redis.on("connect", () => console.log("Redis connected."));
redis.on("error", (err) => console.error("Redis error:", err));