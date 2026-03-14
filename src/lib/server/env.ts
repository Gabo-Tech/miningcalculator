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

export const getServerEnv = (): ServerEnv => ({
  coinpaprikaApiKey: process.env.COINPAPRIKA_API_KEY || undefined,
  coinpaprikaBaseUrl: process.env.COINPAPRIKA_BASE_URL || "https://api.coinpaprika.com/v1",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || undefined,
  serpApiKey: process.env.SERPAPI_API_KEY || undefined,
  serpApiBaseUrl: process.env.SERPAPI_BASE_URL || "https://serpapi.com/search",
  ipinfoToken: process.env.IPINFO_TOKEN || undefined,
  ipinfoBaseUrl: process.env.IPINFO_BASE_URL || "https://ipinfo.io",
  exchangerateApiKey: process.env.EXCHANGERATE_API_KEY || undefined,
  exchangerateBaseUrl:
    process.env.EXCHANGERATE_BASE_URL || "https://v6.exchangerate-api.com/v6",
  upstashRedisRestUrl: process.env.UPSTASH_REDIS_REST_URL || undefined,
  upstashRedisRestToken: process.env.UPSTASH_REDIS_REST_TOKEN || undefined,
});

