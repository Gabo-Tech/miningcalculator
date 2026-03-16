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

const readEnv = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = normalizeEnvValue(process.env[key]);
    if (value) return value;
  }
  return undefined;
};

export const getServerEnv = (): ServerEnv => ({
  coinpaprikaApiKey: readEnv("COINPAPRIKA_API_KEY"),
  coinpaprikaBaseUrl:
    readEnv("COINPAPRIKA_BASE_URL") || "https://api.coinpaprika.com/v1",
  openrouterApiKey: readEnv("OPENROUTER_API_KEY", "OPEN_ROUTER_API_KEY"),
  serpApiKey: readEnv("SERPAPI_API_KEY", "SERAPI_API_KEY"),
  serpApiBaseUrl: readEnv("SERPAPI_BASE_URL") || "https://serpapi.com/search",
  ipinfoToken: readEnv("IPINFO_TOKEN", "IPINFO_API_TOKEN"),
  ipinfoBaseUrl: readEnv("IPINFO_BASE_URL") || "https://ipinfo.io",
  exchangerateApiKey: readEnv("EXCHANGERATE_API_KEY", "EXCHANGE_RATE_API_KEY"),
  exchangerateBaseUrl:
    readEnv("EXCHANGERATE_BASE_URL", "EXCHANGE_RATE_BASE_URL") ||
    "https://v6.exchangerate-api.com/v6",
  upstashRedisRestUrl: readEnv("UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"),
  upstashRedisRestToken: readEnv("UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"),
});

