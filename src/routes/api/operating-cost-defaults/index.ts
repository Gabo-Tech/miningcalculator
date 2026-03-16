import type { RequestHandler } from "@builder.io/qwik-city";
import { getOperatingCostDefaults } from "~/lib/server/services";
import { limitString, rateLimit } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ env, json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "operating-cost-defaults",
    max: 40,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const coin = limitString(query.get("coin"), {
    fallback: "BTC",
    minLength: 2,
    maxLength: 12,
    pattern: /^[A-Z0-9]+$/i,
    transform: (value) => value.toUpperCase(),
  });
  const country = limitString(query.get("country"), { fallback: "global", maxLength: 80 });
  const currency = limitString(query.get("currency"), {
    fallback: "USD",
    minLength: 3,
    maxLength: 6,
    pattern: /^[A-Z]+$/i,
    transform: (value) => value.toUpperCase(),
  });
  try {
    const defaults = await getOperatingCostDefaults(coin, country, currency, env);
    json(200, defaults);
  } catch {
    json(200, {
      poolFeePct: 1.5,
      uptimePct: 97,
      coolingOverheadPct: 12,
      staleRejectPct: 1.5,
      maintenanceMonthly: 0,
      difficultyGrowthPct: 2,
      hardwareDegradationPct: 1,
      fxSpreadPct: 0.8,
      withdrawalFeePct: 0,
      financingAprPct: 0,
      importDutyPct: 0,
      source: "fallback",
    });
  }
};

