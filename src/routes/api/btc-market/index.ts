import type { RequestHandler } from "@builder.io/qwik-city";
import { loadBtcMarketSnapshot } from "~/lib/server/btc-market";
import { rateLimit } from "~/lib/server/security";

export const onGet: RequestHandler = async ({
  env,
  headers,
  json,
  request,
}) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "btc-market",
    max: 60,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    headers.set("Cache-Control", "no-store");
    json(429, {
      ok: false,
      error: "rate_limited",
      retryAfterSec: limited.retryAfterSec,
    });
    return;
  }

  const result = await loadBtcMarketSnapshot(env);
  if (!result.ok) {
    headers.set("Cache-Control", "no-store");
    json(503, result);
    return;
  }

  headers.set("Cache-Control", "public, max-age=120, s-maxage=120");
  json(200, result);
};
