import type { RequestHandler } from "@builder.io/qwik-city";
import { getAiRecommendation } from "~/lib/server/services";
import { limitNumber, limitString, rateLimit, sanitizePublicError, safeHttpUrl } from "~/lib/server/security";

type RecommendationPayload = {
  coinSymbol: string;
  coinName: string;
  country: string;
  currency: string;
  electricityPrice: number;
  taxRate: number;
  coinPriceUsd: number | null;
  links: Array<{ title: string; snippet: string; link: string }>;
};

export const onPost: RequestHandler = async ({ env, json, parseBody, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "ai-recommendation",
    max: 20,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  let payload: RecommendationPayload;
  try {
    payload = (await parseBody()) as RecommendationPayload;
  } catch {
    json(400, { error: "Invalid JSON payload" });
    return;
  }

  const coinSymbol = limitString(payload.coinSymbol, {
    fallback: "",
    minLength: 2,
    maxLength: 12,
    pattern: /^[A-Z0-9]+$/i,
    transform: (value) => value.toUpperCase(),
  });
  const coinName = limitString(payload.coinName, {
    fallback: "",
    minLength: 2,
    maxLength: 80,
  });
  if (!coinSymbol || !coinName) {
    json(400, { error: "coinSymbol and coinName are required" });
    return;
  }

  const links = Array.isArray(payload.links)
    ? payload.links
        .slice(0, 6)
        .map((item) => {
          const title = limitString(item?.title, { fallback: "Untitled", maxLength: 140 });
          const snippet = limitString(item?.snippet, { fallback: "", maxLength: 280 });
          const link = safeHttpUrl(typeof item?.link === "string" ? item.link : "");
          if (!link) return null;
          return { title, snippet, link };
        })
        .filter((item): item is { title: string; snippet: string; link: string } => !!item)
    : [];

  const safePayload: RecommendationPayload = {
    coinSymbol,
    coinName,
    country: limitString(payload.country, { fallback: "global", maxLength: 80 }),
    currency: limitString(payload.currency, {
      fallback: "USD",
      maxLength: 6,
      pattern: /^[A-Z]{3,6}$/i,
      transform: (value) => value.toUpperCase(),
    }),
    electricityPrice: limitNumber(payload.electricityPrice, { fallback: 0.2, min: 0, max: 2 }),
    taxRate: limitNumber(payload.taxRate, { fallback: 0.2, min: 0, max: 1 }),
    coinPriceUsd: payload.coinPriceUsd === null
      ? null
      : limitNumber(payload.coinPriceUsd, { fallback: 0, min: 0, max: 10_000_000 }),
    links,
  };

  try {
    const recommendation = await getAiRecommendation(safePayload, env);
    json(200, { recommendation });
  } catch {
    const safe = sanitizePublicError("ai_recommendation_failed");
    json(safe.status, { ...safe.payload, recommendation: "AI recommendation is temporarily unavailable." });
  }
};

