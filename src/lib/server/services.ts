import { COUNTRY_DEFAULTS } from "./country-defaults";
import { pingCache } from "./cache";
import { withCache } from "./cache";
import {
  crawlOffersFromSearchResults,
  getCrawlerHealth,
  minerNameMatchesOffer,
} from "./crawlers";
import { getServerEnv, type ServerEnvGetter } from "./env";
import { BASE_MINER_CANDIDATES, type MinerCandidate } from "./miner-candidates";
import { limitString, safeHttpUrl } from "./security";

const COINPAPRIKA_BY_SYMBOL: Record<string, string> = {
  BTC: "btc-bitcoin",
  LTC: "ltc-litecoin",
  DOGE: "doge-dogecoin",
  ETC: "etc-ethereum-classic",
  KAS: "kas-kaspa",
  XMR: "xmr-monero",
  ETH: "eth-ethereum",
  XRP: "xrp-xrp",
  SOL: "sol-solana",
  ADA: "ada-cardano",
};

const COIN_NAME_BY_SYMBOL: Record<string, string> = {
  BTC: "Bitcoin",
  LTC: "Litecoin",
  DOGE: "Dogecoin",
  KAS: "Kaspa",
  ETC: "Ethereum Classic",
  XMR: "Monero",
  ETH: "Ethereum",
  XRP: "XRP",
  SOL: "Solana",
  ADA: "Cardano",
};

const KNOWN_NON_MINEABLE_SYMBOLS = new Set([
  "ETH",
  "XRP",
  "SOL",
  "ADA",
  "BNB",
  "TRX",
  "DOT",
  "AVAX",
  "ATOM",
  "MATIC",
  "USDT",
  "USDC",
]);

const KNOWN_MINEABLE_SYMBOLS = new Set([
  "BTC",
  "LTC",
  "DOGE",
  "KAS",
  "ETC",
  "XMR",
  "RVN",
  "ZEC",
  "DASH",
  "BCH",
]);

type SearchResult = {
  title: string;
  snippet: string;
  link: string;
};

const sanitizeSearchResult = (item: {
  title?: string;
  snippet?: string;
  link?: string;
}): SearchResult | null => {
  const link = safeHttpUrl(item.link || "");
  if (!link) return null;
  return {
    title: limitString(item.title, { fallback: "Untitled", maxLength: 140 }),
    snippet: limitString(item.snippet, { fallback: "", maxLength: 280 }),
    link,
  };
};

const TRUSTED_BUY_DOMAINS = [
  "bitmain.com",
  "shop.bitmain.com",
  "microbt.com",
  "whatsminer.com",
  "kaboomracks.com",
  "bt-miners.com",
  "coinminingcentral.com",
  "asicmarketplace.com",
  "ebay.com",
  "amazon.com",
  "newegg.com",
  "pcpartpicker.com",
];

const hasTrustedBuyDomain = (url: string): boolean => {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return TRUSTED_BUY_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
};

const isLikelyCommerceResult = (result: SearchResult): boolean => {
  const text = `${result.title} ${result.snippet}`.toLowerCase();
  const signals = /(buy|shop|store|price|order|in stock|add to cart|product|deal|sale|used|seller)/;
  return hasTrustedBuyDomain(result.link) && signals.test(text);
};

type RegionEstimate = {
  electricity: number;
  taxRate: number;
};

const REGION_ESTIMATES: Record<string, RegionEstimate> = {
  Europe: { electricity: 0.29, taxRate: 0.24 },
  Asia: { electricity: 0.14, taxRate: 0.18 },
  Africa: { electricity: 0.15, taxRate: 0.16 },
  Oceania: { electricity: 0.24, taxRate: 0.23 },
  Americas: { electricity: 0.18, taxRate: 0.21 },
};

const COUNTRY_ALIAS_TO_CODE: Record<string, string> = {
  SWITZERLAND: "CH",
  SUIZERLAND: "CH",
  SWIZERLAND: "CH",
  SCHWEIZ: "CH",
  SUISSE: "CH",
  SVIZZERA: "CH",
  UNITEDSTATES: "US",
  USA: "US",
  UK: "GB",
  UNITEDKINGDOM: "GB",
};

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  CH: "Switzerland",
  US: "United States",
  GB: "United Kingdom",
};

export type CoinSearchItem = {
  id: string;
  symbol: string;
  name: string;
  mineable: boolean | null;
  reason: "known_pow" | "known_non_pow" | "token" | "unknown";
};

type ProviderHealthStatus = "ok" | "missing" | "error";
type ProviderHealth = {
  provider:
    | "coinpaprika"
    | "serpapi"
    | "ipinfo"
    | "exchangerate"
    | "openrouter"
    | "upstash"
    | "crawler";
  status: ProviderHealthStatus;
  detail: string;
};

const requireValue = (value: string | undefined, name: string): string => {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const classifyMineability = (
  symbol: string,
  type: string | undefined,
): { mineable: boolean | null; reason: CoinSearchItem["reason"] } => {
  const upper = symbol.toUpperCase();
  if (KNOWN_MINEABLE_SYMBOLS.has(upper)) return { mineable: true, reason: "known_pow" };
  if (KNOWN_NON_MINEABLE_SYMBOLS.has(upper)) return { mineable: false, reason: "known_non_pow" };
  if ((type || "").toLowerCase() === "token") return { mineable: false, reason: "token" };
  return { mineable: null, reason: "unknown" };
};

const getCoinIdBySymbol = async (
  symbol: string,
  envGetter?: ServerEnvGetter,
): Promise<string | null> => {
  const env = getServerEnv(envGetter);
  const normalized = symbol.toUpperCase();
  const fromStatic = COINPAPRIKA_BY_SYMBOL[normalized];
  if (fromStatic) return fromStatic;

  const cacheKey = `coin-id:${normalized}`;
  return withCache(cacheKey, 60 * 60, async () => {
    const url = new URL(`${env.coinpaprikaBaseUrl.replace(/\/$/, "")}/search`);
    url.searchParams.set("q", normalized);
    url.searchParams.set("c", "currencies");
    const response = await fetch(url.toString());
    if (!response.ok) return null;
    const data = (await response.json()) as {
      currencies?: Array<{ id?: string; symbol?: string; rank?: number }>;
    };
    const exact = (data.currencies || [])
      .filter((coin) => (coin.symbol || "").toUpperCase() === normalized && coin.id)
      .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999))[0];
    return exact?.id || null;
  }, envGetter);
};

export const searchCoins = async (
  query: string,
  envGetter?: ServerEnvGetter,
): Promise<CoinSearchItem[]> => {
  const env = getServerEnv(envGetter);
  const q = query.trim();
  if (!q) return [];
  const cacheKey = `coin-search:${q.toLowerCase()}`;
  return withCache(cacheKey, 60 * 10, async () => {
    const url = new URL(`${env.coinpaprikaBaseUrl.replace(/\/$/, "")}/search`);
    url.searchParams.set("q", q);
    url.searchParams.set("c", "currencies");
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`CoinPaprika coin search failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      currencies?: Array<{
        id?: string;
        symbol?: string;
        name?: string;
        rank?: number;
        type?: string;
      }>;
    };
    return (data.currencies || [])
      .filter((coin) => coin.id && coin.symbol && coin.name)
      .sort((a, b) => (a.rank ?? 999999) - (b.rank ?? 999999))
      .slice(0, 12)
      .map((coin) => {
        const classification = classifyMineability(coin.symbol || "", coin.type);
        return {
          id: coin.id || "",
          symbol: (coin.symbol || "").toUpperCase(),
          name: coin.name || "",
          mineable: classification.mineable,
          reason: classification.reason,
        };
      });
  }, envGetter);
};

export const getRequesterIp = (headers: Headers): string | null => {
  const direct = headers.get("cf-connecting-ip") || headers.get("x-real-ip") || headers.get("x-client-ip");
  if (direct?.trim()) return direct.trim();
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return null;
};

const pickCurrencyFromRest = (
  currencies?: Record<string, { name?: string; symbol?: string }>,
): string | null => {
  if (!currencies) return null;
  const first = Object.keys(currencies)[0];
  return first ? first.toUpperCase() : null;
};

export const resolveCountryProfile = async (rawValue: string) => {
  const value = rawValue.trim();
  if (!value) {
    const fallback = COUNTRY_DEFAULTS.default;
    return {
      countryCode: "default",
      country: "Global Average",
      currency: fallback.currency,
      electricityPrice: fallback.electricity,
      taxRate: fallback.taxRate,
      source: "global_estimate" as const,
    };
  }

  const normalized = value.toUpperCase();
  const aliasCode = COUNTRY_ALIAS_TO_CODE[normalized.replace(/[^A-Z]/g, "")];
  const directCode = aliasCode || normalized;

  if (COUNTRY_DEFAULTS[directCode]) {
    const local = COUNTRY_DEFAULTS[directCode];
    return {
      countryCode: directCode,
      country: COUNTRY_CODE_TO_NAME[directCode] || directCode,
      currency: local.currency,
      electricityPrice: local.electricity,
      taxRate: local.taxRate,
      source: "hardcoded" as const,
    };
  }

  const cacheKey = `country-profile:${normalized}`;
  return withCache(cacheKey, 60 * 60 * 6, async () => {
    const url = /^[A-Z]{2}$/.test(normalized)
      ? `https://restcountries.com/v3.1/alpha/${normalized}`
      : `https://restcountries.com/v3.1/name/${encodeURIComponent(value)}`;

    const response = await fetch(url);
    if (!response.ok) {
      const fallback = COUNTRY_DEFAULTS.default;
      return {
        countryCode: "default",
        country: value,
        currency: fallback.currency,
        electricityPrice: fallback.electricity,
        taxRate: fallback.taxRate,
        source: "global_estimate" as const,
      };
    }

    const countries = (await response.json()) as Array<{
      cca2?: string;
      name?: { common?: string };
      region?: string;
      currencies?: Record<string, { name?: string; symbol?: string }>;
    }>;
    const country = countries?.[0];
    if (!country) {
      const fallback = COUNTRY_DEFAULTS.default;
      return {
        countryCode: "default",
        country: value,
        currency: fallback.currency,
        electricityPrice: fallback.electricity,
        taxRate: fallback.taxRate,
        source: "global_estimate" as const,
      };
    }

    const code = (country.cca2 || "default").toUpperCase();
    const localDefaults = COUNTRY_DEFAULTS[code];
    const regionDefaults = REGION_ESTIMATES[country.region || ""] || COUNTRY_DEFAULTS.default;
    const currency =
      pickCurrencyFromRest(country.currencies) ||
      localDefaults?.currency ||
      COUNTRY_DEFAULTS.default.currency;

    return {
      countryCode: code,
      country: country.name?.common || value,
      currency,
      electricityPrice: localDefaults?.electricity ?? regionDefaults.electricity,
      taxRate: localDefaults?.taxRate ?? regionDefaults.taxRate,
      source: localDefaults ? ("hardcoded" as const) : ("regional_estimate" as const),
    };
  });
};

export const getGeoProfile = async (ip: string | null, envGetter?: ServerEnvGetter) => {
  const env = getServerEnv(envGetter);
  const token = requireValue(env.ipinfoToken, "IPINFO_TOKEN");
  const cacheKey = `geo:${ip ?? "self"}`;
  return withCache(cacheKey, 60 * 60, async () => {
    const url = new URL(`${env.ipinfoBaseUrl.replace(/\/$/, "")}/json`);
    if (ip) url.searchParams.set("ip", ip);
    url.searchParams.set("token", token);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`IPinfo request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      country?: string;
      country_name?: string;
      city?: string;
    };
    const countryCode = data.country || "default";
    const defaults = COUNTRY_DEFAULTS[countryCode] ?? COUNTRY_DEFAULTS.default;
    return {
      countryCode,
      country: data.country_name || countryCode,
      city: data.city || "",
      currency: defaults.currency,
      electricityPrice: defaults.electricity,
      taxRate: defaults.taxRate,
    };
  }, envGetter);
};

export const getUsdFxRate = async (
  targetCurrency: string,
  envGetter?: ServerEnvGetter,
): Promise<number> => {
  if (!targetCurrency || targetCurrency === "USD") return 1;
  const env = getServerEnv(envGetter);
  const apiKey = env.exchangerateApiKey;
  if (!apiKey) return 1;

  const normalized = targetCurrency.toUpperCase();
  const cacheKey = `fx:USD:${normalized}`;
  return withCache(cacheKey, 60 * 30, async () => {
    const url = `${env.exchangerateBaseUrl.replace(/\/$/, "")}/${apiKey}/latest/USD`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ExchangeRate API request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      conversion_rates?: Record<string, number>;
    };
    return data.conversion_rates?.[normalized] || 1;
  }, envGetter);
};

export const getCoinPriceUsd = async (
  symbol: string,
  envGetter?: ServerEnvGetter,
): Promise<number | null> => {
  const env = getServerEnv(envGetter);
  const normalized = symbol.toUpperCase();
  const coinId = await getCoinIdBySymbol(normalized, envGetter);
  if (!coinId) return null;

  const cacheKey = `coin:${normalized}`;
  return withCache(cacheKey, 60, async () => {
    const url = `${env.coinpaprikaBaseUrl.replace(/\/$/, "")}/tickers/${coinId}`;
    const response = await fetch(url, {
      headers: env.coinpaprikaApiKey
        ? { Authorization: `Bearer ${env.coinpaprikaApiKey}` }
        : undefined,
    });
    if (!response.ok) {
      throw new Error(`CoinPaprika request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      quotes?: { USD?: { price?: number } };
    };
    const price = data.quotes?.USD?.price;
    return typeof price === "number" ? price : null;
  }, envGetter);
};

export const searchMiningHardware = async (
  coinName: string,
  country: string,
  envGetter?: ServerEnvGetter,
): Promise<SearchResult[]> => {
  const env = getServerEnv(envGetter);
  const apiKey = requireValue(env.serpApiKey, "SERPAPI_API_KEY");
  const query = `${coinName} mining hardware best cpu gpu asic buy ${country}`;
  const cacheKey = `serp:${query}`;
  return withCache(cacheKey, 60 * 30, async () => {
    const url = new URL(env.serpApiBaseUrl);
    url.searchParams.set("engine", "google");
    url.searchParams.set("q", query);
    url.searchParams.set("num", "8");
    url.searchParams.set("api_key", apiKey);
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }
    const data = (await response.json()) as {
      organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
    };
    return (data.organic_results || [])
      .slice(0, 10)
      .map(sanitizeSearchResult)
      .filter((item): item is SearchResult => !!item)
      .slice(0, 6);
  }, envGetter);
};

export const getAiRecommendation = async (payload: {
  coinSymbol: string;
  coinName: string;
  country: string;
  currency: string;
  electricityPrice: number;
  taxRate: number;
  coinPriceUsd: number | null;
  links: SearchResult[];
}, envGetter?: ServerEnvGetter) => {
  const env = getServerEnv(envGetter);
  const apiKey = env.openrouterApiKey;
  if (!apiKey) {
    return [
      "### Best Setup",
      "- Start with efficient hardware that has known wattage and market availability in your region.",
      "",
      "### Why",
      "- This keeps power costs predictable while you validate real-world uptime and maintenance.",
      "",
      "### Risks",
      "- Profitability can swing with network difficulty, token price, and exchange spread.",
      "",
      "### Next Steps",
      "- Add API keys in deployment settings to unlock live market and AI-enriched recommendations.",
    ].join("\n");
  }
  const safeLinks = payload.links
    .slice(0, 6)
    .map((item) => {
      const link = safeHttpUrl(item.link);
      if (!link) return null;
      return {
        title: limitString(item.title, { fallback: "Untitled", maxLength: 140 }),
        link,
      };
    })
    .filter((item): item is { title: string; link: string } => !!item);
  const cacheKey = `ai:v2:${payload.coinSymbol}:${payload.country}:${payload.currency}:${payload.coinPriceUsd ?? "na"}`;
  return withCache(cacheKey, 60 * 10, async () => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a crypto mining advisor. Give concise and practical recommendations with risk warnings. Never invent exact profitability figures if missing.",
          },
          {
            role: "user",
            content: `Build a recommendation for mining ${payload.coinName} (${payload.coinSymbol}) in ${payload.country}. Currency: ${payload.currency}. Electricity: ${payload.electricityPrice}/kWh. Tax rate: ${payload.taxRate}. Current coin price USD: ${payload.coinPriceUsd}. Source links: ${safeLinks
              .map((link) => `${link.title} - ${link.link}`)
              .join(" | ")}. Return markdown with sections: Best Setup, Why, Risks, Next Steps.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed: ${response.status}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return (
      data.choices?.[0]?.message?.content ||
      "No recommendation available right now. Please retry."
    );
  }, envGetter);
};

type OperatingCostDefaults = {
  poolFeePct: number;
  uptimePct: number;
  coolingOverheadPct: number;
  staleRejectPct: number;
  maintenanceMonthly: number;
  difficultyGrowthPct: number;
  hardwareDegradationPct: number;
  fxSpreadPct: number;
  withdrawalFeePct: number;
  financingAprPct: number;
  importDutyPct: number;
  source: "ai" | "fallback";
};

const FALLBACK_POOL_FEE_BY_COIN: Record<string, number> = {
  BTC: 1.5,
  LTC: 2,
  DOGE: 2,
  KAS: 1.5,
  ETC: 1.5,
  XMR: 1.25,
};

const parseMaybeJson = (raw: string): Record<string, unknown> | null => {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
};

const clampNum = (value: unknown, fallback: number, min: number, max: number): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

export const getOperatingCostDefaults = async (
  coinSymbol: string,
  country: string,
  currency: string,
  envGetter?: ServerEnvGetter,
): Promise<OperatingCostDefaults> => {
  const symbol = (coinSymbol || "BTC").toUpperCase();
  const localDefaults = FALLBACK_POOL_FEE_BY_COIN[symbol] ?? 1.75;
  const fallback: OperatingCostDefaults = {
    poolFeePct: localDefaults,
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
  };

  const env = getServerEnv(envGetter);
  if (!env.openrouterApiKey) return fallback;
  const cacheKey = `operating-defaults:v2:${symbol}:${country}:${currency}`;
  return withCache(cacheKey, 60 * 30, async () => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.openrouterApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "Return realistic defaults for single-miner/home operating assumptions. Maintenance should default to 0 unless there is a strong explicit reason. Respond with JSON only, no markdown.",
            },
            {
              role: "user",
              content: `Coin: ${symbol}, country: ${country}, currency: ${currency}. Return object with numeric keys: poolFeePct, uptimePct, coolingOverheadPct, staleRejectPct, maintenanceMonthly, difficultyGrowthPct, hardwareDegradationPct, fxSpreadPct, withdrawalFeePct, financingAprPct, importDutyPct.`,
            },
          ],
        }),
      });
      if (!response.ok) return fallback;
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content || "";
      const parsed = parseMaybeJson(content);
      if (!parsed) return fallback;
      return {
        poolFeePct: clampNum(parsed.poolFeePct, fallback.poolFeePct, 0, 8),
        uptimePct: clampNum(parsed.uptimePct, fallback.uptimePct, 60, 100),
        coolingOverheadPct: clampNum(parsed.coolingOverheadPct, fallback.coolingOverheadPct, 0, 80),
        staleRejectPct: clampNum(parsed.staleRejectPct, fallback.staleRejectPct, 0, 10),
        maintenanceMonthly: 0,
        difficultyGrowthPct: clampNum(parsed.difficultyGrowthPct, fallback.difficultyGrowthPct, 0, 20),
        hardwareDegradationPct: clampNum(parsed.hardwareDegradationPct, fallback.hardwareDegradationPct, 0, 10),
        fxSpreadPct: clampNum(parsed.fxSpreadPct, fallback.fxSpreadPct, 0, 5),
        withdrawalFeePct: 0,
        financingAprPct: 0,
        importDutyPct: clampNum(parsed.importDutyPct, fallback.importDutyPct, 0, 50),
        source: "ai",
      };
    } catch {
      return fallback;
    }
  }, envGetter);
};

export const getMinerCandidates = async (
  coinSymbol: string,
  country: string,
  envGetter?: ServerEnvGetter,
): Promise<{
  miners: MinerCandidate[];
  sources: SearchResult[];
  offers: Array<{
    source: string;
    url: string;
    title: string;
    priceUsd: number | null;
    availability: "in_stock" | "out_of_stock" | "unknown";
    confidence: number;
  }>;
  sourceMode: "live" | "fallback";
}> => {
  const symbol = coinSymbol.toUpperCase();
  const cacheKey = `miner-candidates:${symbol}:${country}`;
  return withCache(cacheKey, 60 * 15, async () => {
    const baseline = BASE_MINER_CANDIDATES.filter((miner) => miner.coin === symbol);
    if (!baseline.length) {
      return { miners: [], sources: [], offers: [], sourceMode: "fallback" };
    }

    const coinName = COIN_NAME_BY_SYMBOL[symbol] || symbol;
    try {
      const sources = await searchMiningHardware(coinName, country || "global", envGetter);
      const offers = await crawlOffersFromSearchResults(sources);
      const primaryBuyResult = sources.find(isLikelyCommerceResult);
      const primaryUrl = primaryBuyResult?.link;
      const miners = baseline.map((miner) => {
        const match = offers.find((offer) => minerNameMatchesOffer(miner.name, offer.title));
        const matchUrl = match?.url && hasTrustedBuyDomain(match.url) ? match.url : null;
        const buyUrl = matchUrl || primaryUrl || miner.buyUrl;
        const dataOrigin: MinerCandidate["dataOrigin"] = match
          ? "crawler_enriched"
          : primaryUrl
            ? "search_enriched"
            : "baseline";
        return {
          ...miner,
          buyUrl,
          purchaseUsd: match?.priceUsd || miner.purchaseUsd,
          availability: match?.availability || "unknown",
          offerSource: match?.source,
          dataOrigin,
        };
      });
      return {
        miners,
        sources,
        offers,
        sourceMode: sources.length > 0 || offers.length > 0 ? "live" : "fallback",
      };
    } catch {
      return {
        miners: baseline.map((miner) => ({ ...miner, dataOrigin: "baseline" })),
        sources: [],
        offers: [],
        sourceMode: "fallback",
      };
    }
  }, envGetter);
};

const checkProvider = async (
  provider: ProviderHealth["provider"],
  checker: () => Promise<void>,
): Promise<ProviderHealth> => {
  try {
    await checker();
    return { provider, status: "ok", detail: "reachable" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown failure";
    if (message.includes("Missing required environment variable")) {
      return { provider, status: "missing", detail: message };
    }
    return { provider, status: "error", detail: message };
  }
};

export const getProviderHealth = async (envGetter?: ServerEnvGetter): Promise<ProviderHealth[]> => {
  const env = getServerEnv(envGetter);
  return withCache("provider-health", 60, async () => {
    const coinpaprika = await checkProvider("coinpaprika", async () => {
      const url = `${env.coinpaprikaBaseUrl.replace(/\/$/, "")}/global`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`CoinPaprika health request failed: ${response.status}`);
    });

    const serpapi = await checkProvider("serpapi", async () => {
      const key = requireValue(env.serpApiKey, "SERPAPI_API_KEY");
      const url = new URL(env.serpApiBaseUrl);
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", "bitcoin mining hardware");
      url.searchParams.set("num", "1");
      url.searchParams.set("api_key", key);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`SerpAPI health request failed: ${response.status}`);
    });

    const ipinfo = await checkProvider("ipinfo", async () => {
      const token = requireValue(env.ipinfoToken, "IPINFO_TOKEN");
      const url = new URL(`${env.ipinfoBaseUrl.replace(/\/$/, "")}/json`);
      url.searchParams.set("token", token);
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`IPinfo health request failed: ${response.status}`);
    });

    const exchangerate = await checkProvider("exchangerate", async () => {
      const key = requireValue(env.exchangerateApiKey, "EXCHANGERATE_API_KEY");
      const url = `${env.exchangerateBaseUrl.replace(/\/$/, "")}/${key}/latest/USD`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`ExchangeRate health request failed: ${response.status}`);
    });

    const openrouter = await checkProvider("openrouter", async () => {
      const key = requireValue(env.openrouterApiKey, "OPENROUTER_API_KEY");
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!response.ok) throw new Error(`OpenRouter health request failed: ${response.status}`);
    });

    const cache = await pingCache(envGetter);
    const crawler = await getCrawlerHealth();

    return [coinpaprika, serpapi, ipinfo, exchangerate, openrouter, cache, crawler];
  }, envGetter);
};

