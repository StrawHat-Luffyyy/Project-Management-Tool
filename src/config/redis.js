import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})
redisClient.on("error" , (err) => console.error("Redis Client Connection error :" , err))
redisClient.on("connect" , () => console.log("Redis Client Connected"))

export const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error("Failed to connect to Redis:", err);
    throw err; // Re-throw to let caller decide how to handle
  }
};