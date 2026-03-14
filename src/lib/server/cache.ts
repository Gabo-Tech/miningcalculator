import { Redis } from "@upstash/redis";
import { getServerEnv } from "./env";

const memoryCache = new Map<string, { expiresAt: number; value: string }>();

export const getRedisClient = (): Redis | null => {
  const env = getServerEnv();
  if (!env.upstashRedisRestUrl || !env.upstashRedisRestToken) return null;
  return new Redis({
    url: env.upstashRedisRestUrl,
    token: env.upstashRedisRestToken,
  });
};

export const getCached = async <T>(key: string): Promise<T | null> => {
  const now = Date.now();
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return JSON.parse(cached.value) as T;
  }
  if (cached) memoryCache.delete(key);

  const redis = getRedisClient();
  if (!redis) return null;

  const raw = await redis.get<unknown>(key);
  if (!raw) return null;
  if (typeof raw === "string") return JSON.parse(raw) as T;
  return raw as T;
};

export const setCached = async <T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> => {
  const serialized = JSON.stringify(value);
  memoryCache.set(key, {
    expiresAt: Date.now() + ttlSeconds * 1000,
    value: serialized,
  });

  const redis = getRedisClient();
  if (!redis) return;
  await redis.set(key, serialized, { ex: ttlSeconds });
};

export const withCache = async <T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> => {
  const cached = await getCached<T>(key);
  if (cached) return cached;
  const fresh = await fn();
  await setCached(key, fresh, ttlSeconds);
  return fresh;
};

export const pingCache = async (): Promise<{
  provider: "upstash";
  status: "ok" | "missing" | "error";
  detail: string;
}> => {
  const redis = getRedisClient();
  if (!redis) {
    return {
      provider: "upstash",
      status: "missing",
      detail: "UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set",
    };
  }

  try {
    const key = `health:${Date.now()}`;
    await redis.set(key, "1", { ex: 30 });
    await redis.get(key);
    return { provider: "upstash", status: "ok", detail: "Redis cache reachable" };
  } catch (error) {
    return {
      provider: "upstash",
      status: "error",
      detail: error instanceof Error ? error.message : "Cache ping failed",
    };
  }
};

