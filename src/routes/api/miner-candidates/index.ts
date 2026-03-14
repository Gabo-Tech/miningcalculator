import type { RequestHandler } from "@builder.io/qwik-city";
import { getMinerCandidates } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "miner-candidates",
    max: 24,
    windowSeconds: 60,
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
  const country = limitString(query.get("country"), { fallback: "global", maxLength: 80 });
  if (!symbol) {
    json(400, { error: "Missing symbol query param" });
    return;
  }

  try {
    const data = await getMinerCandidates(symbol, country);
    json(200, {
      symbol,
      country,
      ...data,
      ts: Date.now(),
    });
  } catch {
    const safe = sanitizePublicError("miner_candidates_failed");
    json(safe.status, {
      symbol,
      country,
      miners: [],
      sources: [],
      offers: [],
      sourceMode: "fallback",
      ...safe.payload,
    });
  }
};

