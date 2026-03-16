import type { RequestHandler } from "@builder.io/qwik-city";
import { searchMiningHardware } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ env, json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "miner-search",
    max: 20,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const coin = limitString(query.get("coin"), { fallback: "", minLength: 2, maxLength: 40 });
  const country = limitString(query.get("country"), { fallback: "global", maxLength: 80 });

  if (!coin) {
    json(400, { error: "Missing coin query param" });
    return;
  }

  try {
    const results = await searchMiningHardware(coin, country, env);
    json(200, { coin, country, results, ts: Date.now() });
  } catch {
    const safe = sanitizePublicError("miner_search_failed");
    json(safe.status, {
      coin,
      country,
      ...safe.payload,
      results: [],
    });
  }
};

