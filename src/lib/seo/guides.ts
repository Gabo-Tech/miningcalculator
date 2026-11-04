import { CRYPTOS, MINERS, REFERENCE_COIN_PRICE_USD, type CatalogMiner } from "../catalog/hardware";
import { absoluteUrl, type FaqItem } from "./site";

export type CoinGuide = {
  slug: string;
  symbol: string;
  name: string;
  algorithm: string;
  pathname: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  miners: CatalogMiner[];
  referencePriceUsd: number | null;
  faqs: FaqItem[];
};

export type MinerGuide = {
  slug: string;
  pathname: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  miner: CatalogMiner;
  coin: CoinGuide | null;
  faqs: FaqItem[];
};

const COIN_COPY: Record<string, { slug: string; algorithm: string; note: string }> = {
  BTC: {
    slug: "bitcoin",
    algorithm: "SHA-256",
    note: "The reference catalog compares Bitcoin ASICs such as the Antminer S21 Pro and WhatsMiner M60S+. Revenue baselines move with the Bitcoin price inside the calculator.",
  },
  LTC: {
    slug: "litecoin",
    algorithm: "Scrypt",
    note: "Litecoin is modeled with the Antminer L9 reference unit. Scrypt hashrate, watts, and your power price drive the monthly result.",
  },
  DOGE: {
    slug: "dogecoin",
    algorithm: "Scrypt",
    note: "Dogecoin is modeled separately from Litecoin here, using the Elphapex DG1+ catalog baseline. Enter your own electricity rate before treating any figure as a plan.",
  },
  KAS: {
    slug: "kaspa",
    algorithm: "kHeavyHash",
    note: "Kaspa profitability in this catalog starts from the IceRiver KS5 Pro. High power draw makes the local electricity price especially important.",
  },
  ETC: {
    slug: "ethereum-classic",
    algorithm: "Etchash",
    note: "Ethereum Classic uses the Jasminer X16-Q Pro reference specs. It draws far less power than the large Bitcoin ASICs in the same catalog.",
  },
  XMR: {
    slug: "monero",
    algorithm: "RandomX",
    note: "Monero is mineable, but this reference catalog does not ship a Monero ASIC. Use the calculator's live miner search for current hardware before comparing profit.",
  },
};

const MINER_SLUGS: Record<string, string> = {
  "s21-pro": "antminer-s21-pro",
  m60s: "whatsminer-m60s-plus",
  l9: "antminer-l9",
  "dg1-plus": "elphapex-dg1-plus",
  "ks5-pro": "iceriver-ks5-pro",
  "e9-pro": "jasminer-x16-q-pro",
};

function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function illustrativeMonthlyPower(powerWatts: number, ratePerKwh = 0.1): {
  kwh: number;
  costUsd: number;
  ratePerKwh: number;
} {
  const kwh = (powerWatts / 1000) * 24 * 30;
  return { kwh, costUsd: kwh * ratePerKwh, ratePerKwh };
}

function buildCoinGuide(symbol: string): CoinGuide | null {
  const crypto = CRYPTOS.find((item) => item.symbol === symbol && item.minable === true);
  const copy = COIN_COPY[symbol];
  if (!crypto || !copy) return null;
  const miners = MINERS.filter((miner) => miner.coin === symbol);
  const pathname = `/coins/${copy.slug}/`;
  const h1 = `${crypto.name} Mining Profitability Calculator`;
  const description = miners.length
    ? `Estimate ${crypto.name} (${crypto.symbol}) mining profitability from catalog miner baselines, then run the free calculator with your electricity rate and taxes.`
    : `Learn how ${crypto.name} (${crypto.symbol}) mining profitability is estimated, then run the free calculator with live hardware search and your local power cost.`;
  return {
    slug: copy.slug,
    symbol: crypto.symbol,
    name: crypto.name,
    algorithm: copy.algorithm,
    pathname,
    title: `${h1} | Mining Profit Lab`,
    h1,
    description,
    intro: `${crypto.name} uses ${copy.algorithm}. ${copy.note}`,
    miners,
    referencePriceUsd: REFERENCE_COIN_PRICE_USD[symbol] ?? null,
    faqs: [
      {
        question: `How does this ${crypto.name} mining profitability calculator work?`,
        answer: miners.length
          ? `It starts from reference ${crypto.name} miners in the catalog, including hashrate, watts, purchase price, pool fee, and a baseline daily revenue. The live calculator then applies your electricity price, taxes, and the current ${crypto.name} price when market data is available.`
          : `${crypto.name} is marked mineable, but the built-in catalog has no ${crypto.name} hardware row. The calculator can still search for miners and estimate profit from your electricity price and tax rate.`,
      },
      {
        question: `What changes ${crypto.name} mining profit the most?`,
        answer: `Electricity price, machine watts, pool fees, and the ${crypto.name} price usually move the monthly result more than small differences in purchase price. Network difficulty and uptime matter too, so rerun the estimate when conditions change.`,
      },
    ],
  };
}

function buildMinerGuide(miner: CatalogMiner): MinerGuide {
  const slug = MINER_SLUGS[miner.id] ?? miner.id;
  const coin = buildCoinGuide(miner.coin);
  const pathname = `/miners/${slug}/`;
  const h1 = `${miner.name} Mining Profitability`;
  const coinName = coin?.name ?? miner.coin;
  return {
    slug,
    pathname,
    title: `${miner.name} Profitability Calculator | Mining Profit Lab`,
    h1,
    description: `Review ${miner.name} hashrate, power draw, and catalog revenue baseline for ${coinName}, then estimate profit with your own electricity rate.`,
    intro: `${miner.name} is the ${coinName} reference model stored in Mining Profit Lab. The numbers below are catalog baselines the calculator starts from. They are not a live quote.`,
    miner,
    coin,
    faqs: [
      {
        question: `What hashrate and power does the ${miner.name} use here?`,
        answer: `The reference catalog lists the ${miner.name} at ${miner.hashRate} and ${miner.powerWatts.toLocaleString("en-US")} W, with a baseline purchase price of ${money(miner.purchaseUsd)} and a pool fee of ${miner.poolFeePct}%.`,
      },
      {
        question: `How do I estimate ${miner.name} profitability?`,
        answer: `Open the free calculator, choose ${coinName}, and enter your electricity price and tax rate. Profit is baseline revenue minus power, pool fees, and taxes. At an illustrative $${(0.1).toFixed(2)}/kWh, this model uses about ${Math.round(illustrativeMonthlyPower(miner.powerWatts).kwh).toLocaleString("en-US")} kWh in a 30-day month before cooling or downtime.`,
      },
    ],
  };
}

export const COIN_GUIDES: CoinGuide[] = CRYPTOS.map((crypto) => buildCoinGuide(crypto.symbol)).filter(
  (guide): guide is CoinGuide => guide !== null,
);

export const MINER_GUIDES: MinerGuide[] = MINERS.map((miner) => buildMinerGuide(miner));

export function getCoinGuide(slug: string): CoinGuide | null {
  return COIN_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export function getMinerGuide(slug: string): MinerGuide | null {
  return MINER_GUIDES.find((guide) => guide.slug === slug) ?? null;
}

export type SitemapEntry = {
  loc: string;
  changefreq: "daily" | "weekly" | "monthly";
  priority: string;
};

export function indexableEntries(): SitemapEntry[] {
  return [
    { loc: absoluteUrl("/"), changefreq: "daily", priority: "1.0" },
    ...COIN_GUIDES.map((guide) => ({
      loc: absoluteUrl(guide.pathname),
      changefreq: "weekly" as const,
      priority: "0.8",
    })),
    ...MINER_GUIDES.map((guide) => ({
      loc: absoluteUrl(guide.pathname),
      changefreq: "weekly" as const,
      priority: "0.6",
    })),
  ];
}

export { money };
