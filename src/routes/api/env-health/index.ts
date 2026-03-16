import type { RequestHandler } from "@builder.io/qwik-city";
import { rateLimit } from "~/lib/server/security";

const hasValue = (value: string | undefined): boolean => {
  if (!value) return false;
  return value.trim().length > 0;
};

const firstPresentKey = (
  env: { get: (key: string) => string | undefined },
  ...keys: string[]
): string | null => {
  for (const key of keys) {
    if (hasValue(env.get(key) ?? process.env[key])) return key;
  }
  return null;
};

export const onGet: RequestHandler = async ({ env, json, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "env-health",
    max: 20,
    windowSeconds: 60,
    envGetter: env,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  const checks = [
    { expected: "OPENROUTER_API_KEY", aliases: ["OPENROUTER_API_KEY", "OPEN_ROUTER_API_KEY"] },
    { expected: "SERPAPI_API_KEY", aliases: ["SERPAPI_API_KEY", "SERAPI_API_KEY"] },
    { expected: "IPINFO_TOKEN", aliases: ["IPINFO_TOKEN", "IPINFO_API_TOKEN"] },
    { expected: "EXCHANGERATE_API_KEY", aliases: ["EXCHANGERATE_API_KEY", "EXCHANGE_RATE_API_KEY"] },
    { expected: "UPSTASH_REDIS_REST_URL", aliases: ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"] },
    {
      expected: "UPSTASH_REDIS_REST_TOKEN",
      aliases: ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"],
    },
  ];

  json(200, {
    runtime: {
      edgeRuntime:
        typeof (globalThis as { EdgeRuntime?: unknown }).EdgeRuntime === "string"
          ? (globalThis as { EdgeRuntime?: string }).EdgeRuntime
          : null,
      hasProcess: typeof process !== "undefined",
      nodeEnv: env.get("NODE_ENV") ?? process.env.NODE_ENV ?? null,
    },
    request: {
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
      vercelProxySignature: request.headers.get("x-vercel-proxy-signature"),
      vercelIpCountry: request.headers.get("x-vercel-ip-country"),
    },
    env: {
      vercel: env.get("VERCEL") ?? process.env.VERCEL ?? null,
      vercelEnv: env.get("VERCEL_ENV") ?? process.env.VERCEL_ENV ?? null,
      vercelUrl: env.get("VERCEL_URL") ?? process.env.VERCEL_URL ?? null,
      projectProductionUrl:
        env.get("VERCEL_PROJECT_PRODUCTION_URL") ?? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
    },
    checks: checks.map((check) => {
      const presentAs = firstPresentKey(env, ...check.aliases);
      return {
        expected: check.expected,
        present: !!presentAs,
        presentAs,
      };
    }),
  });
};

