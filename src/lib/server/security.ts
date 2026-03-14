import { getRedisClient } from "./cache";

const inMemoryRateWindow = new Map<string, { count: number; resetAt: number }>();

const withTimeout = async <T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error("request_timeout")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
};

const cleanupInMemoryRateWindow = (now: number): void => {
  if (inMemoryRateWindow.size < 5000) return;
  for (const [key, record] of inMemoryRateWindow.entries()) {
    if (record.resetAt <= now) inMemoryRateWindow.delete(key);
  }
};

export const getRequesterIpSafe = (headers: Headers): string => {
  const direct =
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-client-ip") ||
    "";
  if (direct.trim()) return direct.trim();

  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return "unknown";
  const first = forwarded.split(",")[0]?.trim();
  return first || "unknown";
};

export const limitString = (
  value: unknown,
  options: {
    fallback: string;
    minLength?: number;
    maxLength: number;
    pattern?: RegExp;
    transform?: (value: string) => string;
  },
): string => {
  const raw = typeof value === "string" ? value : options.fallback;
  const transformed = options.transform ? options.transform(raw) : raw;
  const trimmed = transformed.trim();
  const minLength = options.minLength ?? 0;
  if (trimmed.length < minLength || trimmed.length > options.maxLength) return options.fallback;
  if (options.pattern && !options.pattern.test(trimmed)) return options.fallback;
  return trimmed;
};

export const limitNumber = (
  value: unknown,
  options: { fallback: number; min: number; max: number },
): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return options.fallback;
  return Math.max(options.min, Math.min(options.max, parsed));
};

export const sanitizePublicError = (
  code: string,
  status = 500,
): { status: number; payload: { error: string } } => ({
  status,
  payload: { error: code },
});

export const safeHttpUrl = (value: string): string | null => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
};

export const rateLimit = async (
  headers: Headers,
  options: {
    keyPrefix: string;
    max: number;
    windowSeconds: number;
  },
): Promise<{ allowed: boolean; retryAfterSec: number }> => {
  const ip = getRequesterIpSafe(headers);
  const key = `ratelimit:${options.keyPrefix}:${ip}`;
  const redis = getRedisClient();
  const retryAfter = options.windowSeconds;

  if (redis) {
    try {
      const count = await withTimeout(redis.incr(key), 2500);
      if (count === 1) {
        await withTimeout(redis.expire(key, options.windowSeconds), 2500);
      }
      if (count > options.max) {
        return { allowed: false, retryAfterSec: retryAfter };
      }
      return { allowed: true, retryAfterSec: 0 };
    } catch {}
  }

  const now = Date.now();
  cleanupInMemoryRateWindow(now);
  const record = inMemoryRateWindow.get(key);
  if (!record || record.resetAt <= now) {
    inMemoryRateWindow.set(key, { count: 1, resetAt: now + options.windowSeconds * 1000 });
    return { allowed: true, retryAfterSec: 0 };
  }
  record.count += 1;
  if (record.count > options.max) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((record.resetAt - now) / 1000)),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
};
