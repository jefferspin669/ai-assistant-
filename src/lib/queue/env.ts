export type QueueDriver = "file" | "bullmq";

export function redisUrl() {
  return process.env.REDIS_URL?.trim() || "";
}

export function queueDriver(): QueueDriver {
  return redisUrl() ? "bullmq" : "file";
}
