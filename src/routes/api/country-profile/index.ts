import type { RequestHandler } from "@builder.io/qwik-city";
import { resolveCountryProfile } from "~/lib/server/services";
import { limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ json, query, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "country-profile",
    max: 60,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const value = limitString(query.get("value"), { fallback: "", maxLength: 100 });
  try {
    const profile = await resolveCountryProfile(value);
    json(200, { ...profile, ts: Date.now() });
  } catch {
    const safe = sanitizePublicError("country_profile_failed");
    json(safe.status, {
      countryCode: "default",
      country: value || "Global Average",
      currency: "USD",
      electricityPrice: 0.2,
      taxRate: 0.2,
      source: "global_estimate",
      ...safe.payload,
    });
  }
};

