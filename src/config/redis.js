import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
})
redisClient.on("error" , (err) => console.error("Redis Client Connection error :" , err))
redisClient.on("connect" , () => console.log("Redis Client Connected"))

await redisClient.connect()