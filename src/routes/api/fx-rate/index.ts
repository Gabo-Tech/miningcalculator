import type { RequestHandler } from "@builder.io/qwik-city";
import { getUsdFxRate } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ env, json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "fx-rate",
    max: 120,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const currency = limitString(query.get("currency"), {
    fallback: "USD",
    minLength: 3,
    maxLength: 6,
    pattern: /^[A-Z]+$/i,
    transform: (value) => value.toUpperCase(),
  });
  try {
    const usdRate = await getUsdFxRate(currency, env);
    json(200, { currency, usdRate, ts: Date.now() });
  } catch {
    const safe = sanitizePublicError("fx_rate_failed");
    json(safe.status, {
      currency,
      usdRate: 1,
      ...safe.payload,
    });
  }
};

