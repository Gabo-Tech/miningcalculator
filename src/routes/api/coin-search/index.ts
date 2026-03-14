import type { RequestHandler } from "@builder.io/qwik-city";
import { searchCoins } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "coin-search",
    max: 80,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const q = limitString(query.get("q"), { fallback: "", maxLength: 80 });
  if (!q.trim()) {
    json(200, { coins: [] });
    return;
  }

  try {
    const coins = await searchCoins(q);
    json(200, { coins, ts: Date.now() });
  } catch {
    const safe = sanitizePublicError("coin_search_failed");
    json(safe.status, {
      coins: [],
      ...safe.payload,
    });
  }
};

