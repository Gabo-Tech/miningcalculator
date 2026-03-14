import type { RequestHandler } from "@builder.io/qwik-city";
import { getProviderHealth } from "~/lib/server/services";
import { rateLimit, sanitizePublicError } from "~/lib/server/security";

export const onGet: RequestHandler = async ({ json, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "provider-health",
    max: 12,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  try {
    const providers = await getProviderHealth();
    const hasError = providers.some((provider) => provider.status === "error");
    const hasMissing = providers.some((provider) => provider.status === "missing");
    json(200, {
      providers: providers.map((provider) => ({
        provider: provider.provider,
        status: provider.status,
        detail: provider.detail,
      })),
      overall: hasError ? "degraded" : hasMissing ? "partial" : "healthy",
      checkedAt: Date.now(),
    });
  } catch {
    const safe = sanitizePublicError("provider_health_failed");
    json(safe.status, {
      providers: [],
      overall: "down",
      checkedAt: Date.now(),
      ...safe.payload,
    });
  }
};

