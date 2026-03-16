type ServerEnv = {
  coinpaprikaApiKey?: string;
  coinpaprikaBaseUrl: string;
  openrouterApiKey?: string;
  serpApiKey?: string;
  serpApiBaseUrl: string;
  ipinfoToken?: string;
  ipinfoBaseUrl: string;
  exchangerateApiKey?: string;
  exchangerateBaseUrl: string;
  upstashRedisRestUrl?: string;
  upstashRedisRestToken?: string;
};

export type ServerEnvGetter = {
  get: (key: string) => string | undefined;
};

const normalizeEnvValue = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Accept values copied with surrounding quotes from dashboard/CLI exports.
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    const unquoted = trimmed.slice(1, -1).trim();
    return unquoted || undefined;
  }

  return trimmed;
};

const readEnv = (
  getter: ServerEnvGetter | undefined,
  ...keys: string[]
): string | undefined => {
  for (const key of keys) {
    const value = normalizeEnvValue(getter?.get(key) ?? process.env[key]);
    if (value) return value;
  }
  return undefined;
};

export const getServerEnv = (getter?: ServerEnvGetter): ServerEnv => ({
  coinpaprikaApiKey: readEnv(getter, "COINPAPRIKA_API_KEY"),
  coinpaprikaBaseUrl:
    readEnv(getter, "COINPAPRIKA_BASE_URL") || "https://api.coinpaprika.com/v1",
  openrouterApiKey: readEnv(getter, "OPENROUTER_API_KEY", "OPEN_ROUTER_API_KEY"),
  serpApiKey: readEnv(getter, "SERPAPI_API_KEY", "SERAPI_API_KEY"),
  serpApiBaseUrl: readEnv(getter, "SERPAPI_BASE_URL") || "https://serpapi.com/search",
  ipinfoToken: readEnv(getter, "IPINFO_TOKEN", "IPINFO_API_TOKEN"),
  ipinfoBaseUrl: readEnv(getter, "IPINFO_BASE_URL") || "https://ipinfo.io",
  exchangerateApiKey: readEnv(getter, "EXCHANGERATE_API_KEY", "EXCHANGE_RATE_API_KEY"),
  exchangerateBaseUrl:
    readEnv(getter, "EXCHANGERATE_BASE_URL", "EXCHANGE_RATE_BASE_URL") ||
    "https://v6.exchangerate-api.com/v6",
  upstashRedisRestUrl: readEnv(getter, "UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"),
  upstashRedisRestToken: readEnv(getter, "UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"),
});

