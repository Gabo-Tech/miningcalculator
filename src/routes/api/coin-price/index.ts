import type { RequestHandler } from "@builder.io/qwik-city";
import { getCoinPriceUsd } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ env, json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "coin-price",
    max: 120,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const symbol = limitString(query.get("symbol"), {
    fallback: "",
    minLength: 2,
    maxLength: 12,
    pattern: /^[A-Z0-9]+$/i,
    transform: (value) => value.toUpperCase(),
  });
  if (!symbol) {
    json(400, { error: "Missing symbol query param" });
    return;
  }

  try {
    const priceUsd = await getCoinPriceUsd(symbol, env);
    json(200, {
      symbol,
      priceUsd,
      source: "coinpaprika",
      ts: Date.now(),
    });
  } catch {
    const safe = sanitizePublicError("coin_price_failed");
    json(safe.status, { symbol, ...safe.payload });
  }
};

