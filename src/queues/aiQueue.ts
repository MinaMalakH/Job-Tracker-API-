import Queue from "bull";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error("REDIS_URL is not set in .env");
}

export const aiQueue = new Queue("ai-processing", {
  redis: redisUrl,
});

aiQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

aiQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

console.log("AI Queue initialized with local Redis");
