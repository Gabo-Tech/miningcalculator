import type { ServerEnvGetter } from "./env";
import { getServerEnv } from "./env";
import { withCache } from "./cache";
import {
  buildMinerRow,
  catalogBitcoinAsics,
  expectedBtcPerDay,
  type BtcMarketResult,
  type BtcMarketSnapshot,
  type MarketSource,
} from "../mining/btc-profit";

const MEMPOOL_HASHRATE = "https://mempool.space/api/v1/mining/hashrate/3d";
const MEMPOOL_REWARDS = "https://mempool.space/api/v1/mining/reward-stats/144";
const MEMPOOL_PRICES = "https://mempool.space/api/v1/prices";
const BLOCKCHAIN_DIFFICULTY = "https://blockchain.info/q/getdifficulty";
const BLOCKCHAIN_REWARD = "https://blockchain.info/q/bcperblock";
const BLOCKCHAIN_TICKER = "https://blockchain.info/ticker";
const WHATTOMINE_BTC = "https://whattomine.com/coins/1.json";

const SNAPSHOT_TTL_SECONDS = 600;

type PriceReading = {
  usd: number;
  updatedAt: string | null;
  source: MarketSource;
};

type NetworkReading = {
  difficulty: number;
  avgBlockRewardBtc: number;
  blockRewardIncludesFees: boolean;
  sources: MarketSource[];
};

const asNumber = (value: unknown, min: number, max: number): number | null => {
  const parsed = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
};

const fetchJson = async (url: string, extraHeaders?: Record<string, string>): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json, text/plain, */*",
        "user-agent":
          "MiningProfitLab/1.0 (+https://miningcalculator.gabo.rocks/bitcoin-mining-profitability-index/)",
        ...extraHeaders,
      },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Non-JSON response from ${url}`);
    }
  } finally {
    clearTimeout(timer);
  }
};

const fetchPrice = async (envGetter?: ServerEnvGetter): Promise<PriceReading> => {
  const env = getServerEnv(envGetter);
  const paprikaUrl = `${env.coinpaprikaBaseUrl.replace(/\/$/, "")}/tickers/btc-bitcoin`;
  try {
    const headers: Record<string, string> = {};
    if (env.coinpaprikaApiKey) headers.authorization = `Bearer ${env.coinpaprikaApiKey}`;
    const data = await fetchJson(paprikaUrl, headers);
    const usd = asNumber(data?.quotes?.USD?.price, 100, 10_000_000);
    if (usd === null) throw new Error("CoinPaprika price missing");
    return {
      usd,
      updatedAt: typeof data?.last_updated === "string" ? data.last_updated : null,
      source: {
        role: "price",
        name: "CoinPaprika BTC-USD ticker",
        url: paprikaUrl,
        detail: "Public ticker used by the calculator for the Bitcoin price.",
      },
    };
  } catch (error) {
    console.error("btc price: coinpaprika failed", error);
  }

  try {
    const data = await fetchJson(MEMPOOL_PRICES);
    const usd = asNumber(data?.USD, 100, 10_000_000);
    if (usd === null) throw new Error("mempool price missing");
    return {
      usd,
      updatedAt: null,
      source: {
        role: "price",
        name: "mempool.space BTC-USD price",
        url: MEMPOOL_PRICES,
        detail: "Fallback price used because CoinPaprika was unreachable.",
      },
    };
  } catch (error) {
    console.error("btc price: mempool failed", error);
  }

  try {
    const data = await fetchJson(BLOCKCHAIN_TICKER);
    const usd = asNumber(data?.USD?.last, 100, 10_000_000);
    if (usd === null) throw new Error("blockchain.info price missing");
    return {
      usd,
      updatedAt: null,
      source: {
        role: "price",
        name: "blockchain.info BTC-USD ticker",
        url: BLOCKCHAIN_TICKER,
        detail: "Fallback price used because CoinPaprika and mempool.space were unreachable.",
      },
    };
  } catch (error) {
    console.error("btc price: blockchain.info failed", error);
  }

  const data = await fetchJson(WHATTOMINE_BTC);
  const usd = asNumber(data?.exchange_rate, 100, 10_000_000);
  if (usd === null) throw new Error("Bitcoin price unavailable");
  return {
    usd,
    updatedAt: null,
    source: {
      role: "price",
      name: "WhatToMine Bitcoin exchange rate",
      url: WHATTOMINE_BTC,
      detail: "Fallback BTC-USD rate from the public WhatToMine coin endpoint.",
    },
  };
};

const readMempoolReward = (
  data: any,
): { avgBlockRewardBtc: number; detail: string } | null => {
  const totalRewardSats = asNumber(data?.totalReward, 1, 1e18);
  const start = asNumber(data?.startBlock, 1, 1e9);
  const end = asNumber(data?.endBlock, 1, 1e9);
  if (totalRewardSats === null || start === null || end === null || end < start) return null;
  const blocks = end - start + 1;
  if (blocks < 72 || blocks > 288) return null;
  const avgBlockRewardBtc = totalRewardSats / blocks / 1e8;
  if (avgBlockRewardBtc < 0.5 || avgBlockRewardBtc > 20) return null;
  return {
    avgBlockRewardBtc,
    detail: `Mean totalReward over blocks ${start}–${end} (${blocks} blocks), subsidy plus transaction fees.`,
  };
};

const fetchNetwork = async (): Promise<NetworkReading> => {
  let difficulty: number | null = null;
  let difficultySource: MarketSource | null = null;
  let reward: { avgBlockRewardBtc: number; includesFees: boolean; source: MarketSource } | null =
    null;

  try {
    const data = await fetchJson(MEMPOOL_HASHRATE);
    const value = asNumber(data?.currentDifficulty, 1e12, 1e18);
    if (value === null) throw new Error("mempool difficulty missing");
    difficulty = value;
    difficultySource = {
      role: "difficulty",
      name: "mempool.space current difficulty",
      url: MEMPOOL_HASHRATE,
      detail: "currentDifficulty from the public 3-day mining hashrate endpoint.",
    };
  } catch (error) {
    console.error("btc network: mempool difficulty failed", error);
  }

  try {
    const data = await fetchJson(MEMPOOL_REWARDS);
    const parsed = readMempoolReward(data);
    if (!parsed) throw new Error("mempool reward stats unusable");
    reward = {
      avgBlockRewardBtc: parsed.avgBlockRewardBtc,
      includesFees: true,
      source: {
        role: "block_reward",
        name: "mempool.space 144-block reward stats",
        url: MEMPOOL_REWARDS,
        detail: parsed.detail,
      },
    };
  } catch (error) {
    console.error("btc network: mempool rewards failed", error);
  }

  if (difficulty === null || reward === null) {
    try {
      const data = await fetchJson(WHATTOMINE_BTC);
      if (difficulty === null) {
        const value = asNumber(data?.difficulty, 1e12, 1e18);
        if (value === null) throw new Error("whattomine difficulty missing");
        difficulty = value;
        difficultySource = {
          role: "difficulty",
          name: "WhatToMine Bitcoin difficulty",
          url: WHATTOMINE_BTC,
          detail: "Fallback difficulty from the public WhatToMine Bitcoin coin endpoint.",
        };
      }
      if (reward === null) {
        const value = asNumber(data?.block_reward, 0.5, 20);
        if (value === null) throw new Error("whattomine block reward missing");
        reward = {
          avgBlockRewardBtc: value,
          includesFees: true,
          source: {
            role: "block_reward",
            name: "WhatToMine Bitcoin block reward",
            url: WHATTOMINE_BTC,
            detail: "WhatToMine block_reward, which includes the subsidy and transaction fees.",
          },
        };
      }
    } catch (error) {
      console.error("btc network: whattomine failed", error);
    }
  }

  if (difficulty === null) {
    const value = asNumber(await fetchJson(BLOCKCHAIN_DIFFICULTY), 1e12, 1e18);
    if (value === null) throw new Error("Bitcoin difficulty unavailable");
    difficulty = value;
    difficultySource = {
      role: "difficulty",
      name: "blockchain.info difficulty",
      url: BLOCKCHAIN_DIFFICULTY,
      detail: "Fallback difficulty from blockchain.info.",
    };
  }

  if (reward === null) {
    const value = asNumber(await fetchJson(BLOCKCHAIN_REWARD), 0.5, 20);
    if (value === null) throw new Error("Bitcoin block reward unavailable");
    reward = {
      avgBlockRewardBtc: value,
      includesFees: false,
      source: {
        role: "block_reward",
        name: "blockchain.info block subsidy",
        url: BLOCKCHAIN_REWARD,
        detail: "Block subsidy only. Transaction fees are not included in this snapshot.",
      },
    };
  }

  if (!difficultySource) throw new Error("Bitcoin difficulty unavailable");
  return {
    difficulty,
    avgBlockRewardBtc: reward.avgBlockRewardBtc,
    blockRewardIncludesFees: reward.includesFees,
    sources: [difficultySource, reward.source],
  };
};

const fetchFresh = async (envGetter?: ServerEnvGetter): Promise<BtcMarketSnapshot> => {
  const [price, network] = await Promise.all([fetchPrice(envGetter), fetchNetwork()]);
  const specs = catalogBitcoinAsics();
  if (specs.length === 0) throw new Error("No Bitcoin ASICs in the calculator catalog");
  const market = {
    difficulty: network.difficulty,
    avgBlockRewardBtc: network.avgBlockRewardBtc,
    btcPriceUsd: price.usd,
  };
  return {
    fetchedAt: new Date().toISOString(),
    btcPriceUsd: price.usd,
    priceUpdatedAt: price.updatedAt,
    difficulty: network.difficulty,
    avgBlockRewardBtc: network.avgBlockRewardBtc,
    blockRewardIncludesFees: network.blockRewardIncludesFees,
    revenuePerThPerDayUsd:
      expectedBtcPerDay(1e12, network.difficulty, network.avgBlockRewardBtc) * price.usd,
    sources: [price.source, ...network.sources],
    miners: specs.map((spec) => buildMinerRow(spec, market)),
  };
};

/**
 * Live snapshot for the profitability index and the embed.
 * Cached for 10 minutes. Routes that call this stay server-rendered;
 * do not add them to the Vercel SSG include list or the stamp will freeze at build time.
 */
export const loadBtcMarketSnapshot = async (
  envGetter?: ServerEnvGetter,
): Promise<BtcMarketResult> => {
  try {
    const snapshot = await withCache(
      "btc-market-snapshot-v1",
      SNAPSHOT_TTL_SECONDS,
      () => fetchFresh(envGetter),
      envGetter,
    );
    if (!snapshot || !(snapshot.btcPriceUsd > 0) || !Array.isArray(snapshot.miners) || snapshot.miners.length === 0) {
      throw new Error("invalid snapshot");
    }
    return { ok: true, snapshot };
  } catch (error) {
    console.error("btc market snapshot failed", error);
    return {
      ok: false,
      error: "Live Bitcoin network data is temporarily unavailable.",
    };
  }
};
