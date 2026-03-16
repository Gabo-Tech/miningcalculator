import type { RequestHandler } from "@builder.io/qwik-city";
import { getGeoProfile, getRequesterIp, getUsdFxRate } from "~/lib/server/services";
import { rateLimit } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ env, json, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "bootstrap",
    max: 40,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  try {
    const ip = getRequesterIp(request.headers);
    const geo = await getGeoProfile(ip, env);
    const usdRate = await getUsdFxRate(geo.currency, env);
    json(200, { ...geo, usdRate });
  } catch {
    json(200, {
      countryCode: "default",
      country: "Unknown",
      city: "",
      currency: "USD",
      electricityPrice: 0.2,
      taxRate: 0.2,
      usdRate: 1,
      fallback: true,
      error: "bootstrap_failed",
    });
  }
};

