import { MINERS } from "../catalog/hardware";
import { OG_IMAGE_URL, SITE_NAME, absoluteUrl } from "../seo/site";
import { INDEX_DESCRIPTION, INDEX_PATH, INDEX_TITLE } from "../seo/resources";

/** USD/kWh scenarios. These are comparison rates, not regional quotes. */
export const ELECTRICITY_SCENARIOS_USD_PER_KWH = [0.03, 0.05, 0.08, 0.1, 0.15] as const;

export const DEFAULT_EMBED_ELECTRICITY_USD = 0.08;

const SECONDS_PER_DAY = 86_400;
const TWO_POW_32 = 2 ** 32;
const HASH_UNIT: Record<string, number> = {
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  T: 1e12,
  P: 1e15,
  E: 1e18,
};

export type MarketSource = {
  role: "price" | "difficulty" | "block_reward";
  name: string;
  url: string;
  detail: string;
};

export type ElectricityScenario = {
  electricityUsdPerKwh: number;
  dailyCostUsd: number;
  dailyProfitUsd: number;
};

export type MinerSpec = {
  id: string;
  name: string;
  hashRateLabel: string;
  hashRateHs: number;
  powerWatts: number;
  poolFeePct: number;
};

export type ProfitabilityMiner = MinerSpec & {
  dailyBtcBeforePool: number;
  dailyBtcAfterPool: number;
  dailyRevenueUsd: number;
  breakEvenUsdPerKwh: number;
  scenarios: ElectricityScenario[];
};

export type BtcMarketSnapshot = {
  fetchedAt: string;
  btcPriceUsd: number;
  priceUpdatedAt: string | null;
  difficulty: number;
  avgBlockRewardBtc: number;
  blockRewardIncludesFees: boolean;
  revenuePerThPerDayUsd: number;
  sources: MarketSource[];
  miners: ProfitabilityMiner[];
};

export type BtcMarketResult =
  | { ok: true; snapshot: BtcMarketSnapshot }
  | { ok: false; error: string };

export function parseHashRateHs(label: string): number | null {
  const match = label.trim().match(/^(\d+(?:\.\d+)?)\s*([kKMGTPE])?H\/s$/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return null;
  const unit = match[2] ? HASH_UNIT[match[2]] : 1;
  if (!unit) return null;
  return value * unit;
}

/**
 * Expected bitcoin per day for a constant hashrate.
 * btc/day = hashrate_Hs * 86400 * block_reward / (difficulty * 2^32)
 */
export function expectedBtcPerDay(
  hashRateHs: number,
  difficulty: number,
  blockRewardBtc: number,
): number {
  if (!(hashRateHs > 0) || !(difficulty > 0) || !(blockRewardBtc > 0)) return 0;
  return (hashRateHs * SECONDS_PER_DAY * blockRewardBtc) / (difficulty * TWO_POW_32);
}

export function dailyPowerCostUsd(powerWatts: number, usdPerKwh: number): number {
  if (!(powerWatts > 0) || !(usdPerKwh >= 0)) return 0;
  return (powerWatts / 1000) * 24 * usdPerKwh;
}

export function breakEvenUsdPerKwh(dailyRevenueUsd: number, powerWatts: number): number {
  const kwhPerDay = (powerWatts / 1000) * 24;
  if (!(dailyRevenueUsd > 0) || !(kwhPerDay > 0)) return 0;
  return dailyRevenueUsd / kwhPerDay;
}

export function catalogBitcoinAsics(): MinerSpec[] {
  const specs: MinerSpec[] = [];
  for (const miner of MINERS) {
    if (miner.coin !== "BTC") continue;
    const hashRateHs = parseHashRateHs(miner.hashRate);
    if (hashRateHs === null || !(miner.powerWatts > 0)) continue;
    const poolFeePct = Math.min(100, Math.max(0, miner.poolFeePct));
    specs.push({
      id: miner.id,
      name: miner.name,
      hashRateLabel: miner.hashRate,
      hashRateHs,
      powerWatts: miner.powerWatts,
      poolFeePct,
    });
  }
  return specs;
}

export function buildMinerRow(
  spec: MinerSpec,
  market: { difficulty: number; avgBlockRewardBtc: number; btcPriceUsd: number },
): ProfitabilityMiner {
  const dailyBtcBeforePool = expectedBtcPerDay(
    spec.hashRateHs,
    market.difficulty,
    market.avgBlockRewardBtc,
  );
  const dailyBtcAfterPool = dailyBtcBeforePool * (1 - spec.poolFeePct / 100);
  const dailyRevenueUsd = dailyBtcAfterPool * market.btcPriceUsd;
  const scenarios = ELECTRICITY_SCENARIOS_USD_PER_KWH.map((electricityUsdPerKwh) => {
    const dailyCostUsd = dailyPowerCostUsd(spec.powerWatts, electricityUsdPerKwh);
    return {
      electricityUsdPerKwh,
      dailyCostUsd,
      dailyProfitUsd: dailyRevenueUsd - dailyCostUsd,
    };
  });
  return {
    ...spec,
    dailyBtcBeforePool,
    dailyBtcAfterPool,
    dailyRevenueUsd,
    breakEvenUsdPerKwh: breakEvenUsdPerKwh(dailyRevenueUsd, spec.powerWatts),
    scenarios,
  };
}

export function scenarioAt(
  miner: ProfitabilityMiner,
  electricityUsdPerKwh: number,
): ElectricityScenario | undefined {
  return miner.scenarios.find(
    (scenario) => Math.abs(scenario.electricityUsdPerKwh - electricityUsdPerKwh) < 1e-9,
  );
}

export function formatUsd(value: number, digits = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatBtc(value: number, digits = 8): string {
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} BTC`;
}

export function formatDifficulty(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

export function formatAsOfUtc(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function formatElectricity(usdPerKwh: number): string {
  return `${formatUsd(usdPerKwh, 2)}/kWh`;
}

export function formatBreakEven(usdPerKwh: number): string {
  if (!(usdPerKwh > 0)) return "n/a";
  return `${formatUsd(usdPerKwh, 4)}/kWh`;
}

export function profitTone(value: number): "profit" | "loss" {
  return value >= 0 ? "profit" : "loss";
}

export function buildProfitabilityIndexJsonLd(snapshot: BtcMarketSnapshot): string {
  const url = absoluteUrl(INDEX_PATH);
  const home = absoluteUrl("/");
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Dataset",
        "@id": `${url}#dataset`,
        name: "Bitcoin Mining Profitability Index",
        description: INDEX_DESCRIPTION,
        url,
        creator: {
          "@type": "Organization",
          name: SITE_NAME,
          url: home,
        },
        dateModified: snapshot.fetchedAt,
        isAccessibleForFree: true,
        keywords: [
          "bitcoin mining profitability",
          "ASIC miner profit",
          "mining electricity break-even",
        ],
        measurementTechnique:
          "Expected bitcoin per day from network difficulty and the trailing average block reward, priced with the published BTC-USD rate, minus the catalog pool fee and electricity.",
        variableMeasured: [
          "Daily revenue in USD after pool fee",
          "Daily electricity cost in USD",
          "Daily profit in USD",
          "Break-even electricity price in USD per kWh",
        ],
        isBasedOn: snapshot.sources.map((source) => ({
          "@type": "CreativeWork",
          name: source.name,
          url: source.url,
        })),
        distribution: [
          {
            "@type": "DataDownload",
            encodingFormat: "text/html",
            contentUrl: url,
          },
          {
            "@type": "DataDownload",
            encodingFormat: "application/json",
            contentUrl: absoluteUrl("/api/btc-market"),
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: INDEX_TITLE,
        description: INDEX_DESCRIPTION,
        dateModified: snapshot.fetchedAt,
        isPartOf: { "@type": "WebSite", name: SITE_NAME, url: home },
        about: { "@id": `${url}#dataset` },
        primaryImageOfPage: OG_IMAGE_URL,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: home },
          {
            "@type": "ListItem",
            position: 2,
            name: "Bitcoin Mining Profitability Index",
            item: url,
          },
        ],
      },
    ],
  };
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
