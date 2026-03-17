import {
  $,
  component$,
  noSerialize,
  useComputed$,
  useSignal,
  useStore,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import * as d3 from "d3";
import { COUNTRY_DEFAULTS, COUNTRY_OPTIONS, resolveCurrencySelection } from "../lib/config/localization-data";
import { I18N } from "../lib/i18n/translations";

type Theme = "dark" | "light";
type Crypto = { symbol: string; name: string; minable: boolean | null };
type CoinOption = {
  id?: string;
  symbol: string;
  name: string;
  mineable: boolean | null;
  reason: string;
};
type Miner = {
  id: string;
  name: string;
  coin: string;
  hashRate: string;
  powerWatts: number;
  purchaseUsd: number;
  revenuePerDayUsd: number;
  poolFeePct: number;
  buyUrl: string;
  dataOrigin?: "baseline" | "search_enriched" | "crawler_enriched";
  offerSource?: string;
  availability?: "in_stock" | "out_of_stock" | "unknown";
};
type SearchResult = { title: string; snippet: string; link: string };
type CrawledOffer = {
  source: string;
  url: string;
  title: string;
  priceUsd: number | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  confidence: number;
};
type ProviderHealth = {
  provider: string;
  status: "ok" | "missing" | "error";
  detail?: string;
};
type LiveDataStatus = "idle" | "loading" | "live" | "fallback" | "error";
type AiSection = { title: string; items: string[] };
type BestCoinResult = {
  symbol: string;
  coinPriceUsd: number | null;
  bestMinerName: string;
  netProfitUsd: number;
  scoreUsd: number;
  volatilityPenaltyPct: number;
  grossRevenueUsd: number;
  runningCostUsd: number;
  poolFeeUsd: number;
  taxesUsd: number;
};
type BackgroundIcon = {
  symbol: string;
  x: string;
  y: string;
  size: string;
  delay: string;
  duration: string;
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
  source?: "ai" | "fallback";
};

type PayoutStrategy = "hold_cold_wallet" | "monthly_cashout";

const CRYPTOS: Crypto[] = [
  { symbol: "BTC", name: "Bitcoin", minable: true },
  { symbol: "LTC", name: "Litecoin", minable: true },
  { symbol: "DOGE", name: "Dogecoin", minable: true },
  { symbol: "KAS", name: "Kaspa", minable: true },
  { symbol: "ETC", name: "Ethereum Classic", minable: true },
  { symbol: "XMR", name: "Monero", minable: true },
  { symbol: "ETH", name: "Ethereum", minable: false },
  { symbol: "XRP", name: "XRP", minable: false },
  { symbol: "SOL", name: "Solana", minable: false },
  { symbol: "ADA", name: "Cardano", minable: false },
];

const REFERENCE_COIN_PRICE_USD: Record<string, number> = {
  BTC: 65000,
  LTC: 80,
  DOGE: 0.12,
  KAS: 0.13,
  ETC: 30,
  XMR: 130,
};

const BACKGROUND_ICONS: BackgroundIcon[] = [
  { symbol: "₿", x: "8%", y: "18%", size: "3.7rem", delay: "-1.2s", duration: "20s" },
  { symbol: "◇", x: "22%", y: "74%", size: "3.2rem", delay: "-6s", duration: "24s" },
  { symbol: "◎", x: "39%", y: "12%", size: "2.9rem", delay: "-3.6s", duration: "22s" },
  { symbol: "Ł", x: "52%", y: "83%", size: "3.3rem", delay: "-9.1s", duration: "26s" },
  { symbol: "₳", x: "66%", y: "26%", size: "3rem", delay: "-4.2s", duration: "23s" },
  { symbol: "✕", x: "81%", y: "68%", size: "3.5rem", delay: "-11s", duration: "25s" },
  { symbol: "⛏", x: "90%", y: "32%", size: "2.8rem", delay: "-2.5s", duration: "21s" },
];

const MINERS: Miner[] = [
  {
    id: "s21-pro",
    name: "Antminer S21 Pro",
    coin: "BTC",
    hashRate: "234 TH/s",
    powerWatts: 3510,
    purchaseUsd: 4400,
    revenuePerDayUsd: 13.2,
    poolFeePct: 1,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "m60s",
    name: "WhatsMiner M60S+",
    coin: "BTC",
    hashRate: "226 TH/s",
    powerWatts: 3400,
    purchaseUsd: 4200,
    revenuePerDayUsd: 12.8,
    poolFeePct: 1.5,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "l9",
    name: "Antminer L9",
    coin: "LTC",
    hashRate: "17 GH/s",
    powerWatts: 3360,
    purchaseUsd: 8800,
    revenuePerDayUsd: 20.1,
    poolFeePct: 2,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "dg1-plus",
    name: "Elphapex DG1+",
    coin: "DOGE",
    hashRate: "14 GH/s",
    powerWatts: 3920,
    purchaseUsd: 6900,
    revenuePerDayUsd: 15.6,
    poolFeePct: 2,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "ks5-pro",
    name: "IceRiver KS5 Pro",
    coin: "KAS",
    hashRate: "21 TH/s",
    powerWatts: 3150,
    purchaseUsd: 14500,
    revenuePerDayUsd: 24.3,
    poolFeePct: 1,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "e9-pro",
    name: "Jasminer X16-Q Pro",
    coin: "ETC",
    hashRate: "2.05 GH/s",
    powerWatts: 520,
    purchaseUsd: 3200,
    revenuePerDayUsd: 4.6,
    poolFeePct: 1.5,
    buyUrl: "https://www.asicminervalue.com/",
  },
];

type RankedMiner = Miner & {
  runningCost: number;
  grossRevenue: number;
  poolFee: number;
  taxes: number;
  netProfit: number;
  roiMonths: number | null;
  totalCosts: number;
  baseGrossRevenue: number;
  baseRunningCost: number;
  basePoolFee: number;
  baseTaxes: number;
  baseNetProfit: number;
  baseTotalCosts: number;
  extGrossRevenue: number;
  extRunningCost: number;
  extPoolFee: number;
  extTaxes: number;
  extNetProfit: number;
  extTotalCosts: number;
  extCoolingCost: number;
  extMaintenanceCost: number;
  extWithdrawalCost: number;
  extFxSpreadCost: number;
  extFinancingCost: number;
};

const ADVANCED_COST_DEFAULTS: OperatingCostDefaults = {
  poolFeePct: 1.5,
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

const cleanAiLine = (line: string): string =>
  line
    .replace(/^[-*]\s+/, "")
    .replace(/^\d+\.\s+/, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim();

const formatI18n = (template: string, values: Record<string, string | number>): string =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

const safeExternalUrl = (value: string): string => {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "#";
    return parsed.toString();
  } catch {
    return "#";
  }
};

const parseAiSections = (text: string): AiSection[] => {
  if (!text.trim()) return [];
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections: AiSection[] = [];
  let current: AiSection | null = null;

  for (const raw of lines) {
    const heading = raw.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      if (current && (current.title || current.items.length)) sections.push(current);
      current = { title: cleanAiLine(heading[1] || ""), items: [] };
      continue;
    }

    if (!current) current = { title: I18N.en.aiRecommendationTitle || "Recommendation", items: [] };
    current.items.push(cleanAiLine(raw));
  }

  if (current && (current.title || current.items.length)) sections.push(current);
  return sections;
};

export default component$(() => {
  const copyrightFooterText = `© ${new Date().getFullYear()} Mining Profit Lab`;
  const loc = useLocation();
  const canonicalPageUrl = `${loc.url.origin}${loc.url.pathname}`;
  const seoStructuredData = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${canonicalPageUrl}#app`,
        name: "Mining Profit Lab",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        description:
          "Global crypto mining profitability calculator with live coin data, country-specific electricity estimates, tax impact, and miner ROI analysis.",
        url: canonicalPageUrl,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${canonicalPageUrl}#faq`,
        mainEntity: [
          {
            "@type": "Question",
            name: "How is mining profitability calculated?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Mining profitability is estimated by comparing monthly revenue against electricity, pool fees, taxes, and additional operating costs. ROI is based on net monthly profit and hardware purchase price.",
            },
          },
          {
            "@type": "Question",
            name: "Which coins and miners can I compare?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "You can compare major mineable cryptocurrencies, evaluate multiple ASIC models, and review profitability ranking, cost mix, and projected returns.",
            },
          },
          {
            "@type": "Question",
            name: "Do electricity rates and country taxes affect results?",
            acceptedAnswer: {
              "@type": "Answer",
              text:
                "Yes. The calculator includes country-aware electricity and tax assumptions, and supports custom values so your estimate better reflects local operating conditions.",
            },
          },
        ],
      },
    ],
  });
  const theme = useSignal<Theme>("dark");
  const lang = useSignal("en");
  const selectedCoin = useSignal("BTC");
  const selectedCoinName = useSignal("Bitcoin");
  const selectedCoinMineable = useSignal<boolean | null>(true);
  const coinQuery = useSignal("");
  const coinOptions = useSignal<CoinOption[]>([]);
  const coinSearchError = useSignal("");
  const searchingCoins = useSignal(false);
  const detected = useStore({
    country: "Unknown",
    countryCode: "default",
    currency: "USD",
    electricityPrice: 0.2,
    taxRate: 0.2,
    poolFeePct: ADVANCED_COST_DEFAULTS.poolFeePct,
    uptimePct: ADVANCED_COST_DEFAULTS.uptimePct,
    coolingOverheadPct: ADVANCED_COST_DEFAULTS.coolingOverheadPct,
    staleRejectPct: ADVANCED_COST_DEFAULTS.staleRejectPct,
    maintenanceMonthly: ADVANCED_COST_DEFAULTS.maintenanceMonthly,
    difficultyGrowthPct: ADVANCED_COST_DEFAULTS.difficultyGrowthPct,
    hardwareDegradationPct: ADVANCED_COST_DEFAULTS.hardwareDegradationPct,
    fxSpreadPct: ADVANCED_COST_DEFAULTS.fxSpreadPct,
    withdrawalFeePct: ADVANCED_COST_DEFAULTS.withdrawalFeePct,
    financingAprPct: ADVANCED_COST_DEFAULTS.financingAprPct,
    importDutyPct: ADVANCED_COST_DEFAULTS.importDutyPct,
    payoutStrategy: "hold_cold_wallet" as PayoutStrategy,
  });
  const confirmed = useSignal(false);
  const usdRate = useSignal(1);
  const liveCoinPriceUsd = useSignal<number | null>(null);
  const minerCatalog = useSignal<Miner[]>(MINERS);
  const searchResults = useSignal<SearchResult[]>([]);
  const crawledOffers = useSignal<CrawledOffer[]>([]);
  const aiRecommendation = useSignal("");
  const providerHealth = useSignal<ProviderHealth[]>([]);
  const providerOverall = useSignal<"healthy" | "partial" | "degraded" | "down" | "checking">(
    "checking",
  );
  const providerCheckedAt = useSignal<number | null>(null);
  const providerError = useSignal("");
  const providerRefreshTick = useSignal(0);
  const isResearching = useSignal(false);
  const researchError = useSignal("");
  const bestCoinLoading = useSignal(false);
  const bestCoinError = useSignal("");
  const bestCoin = useSignal<BestCoinResult | null>(null);
  const bestCoinRankings = useSignal<BestCoinResult[]>([]);
  const bestCoinMode = useSignal<"raw" | "risk_adjusted">("risk_adjusted");
  const shareCopied = useSignal(false);
  const pdfGenerating = useSignal(false);
  const technicalExpanded = useSignal(false);
  const advancedCostsExpanded = useSignal(false);
  const advancedCostsEdited = useSignal(false);
  const advancedCostsStatus = useSignal<"idle" | "loading" | "ready" | "fallback" | "error">("idle");
  const graphViewMode = useSignal<"default" | "extended">("default");
  const calcNotice = useSignal("");
  const analysisAutoScrolled = useSignal(false);
  const bestCoinAutoScrolled = useSignal(false);
  const formStep = useSignal(1);
  const coinStatus = useSignal<LiveDataStatus>("idle");
  const searchStatus = useSignal<LiveDataStatus>("idle");
  const aiStatus = useSignal<LiveDataStatus>("idle");
  const coinLastLiveAt = useSignal<number | null>(null);
  const searchLastLiveAt = useSignal<number | null>(null);
  const aiLastLiveAt = useSignal<number | null>(null);
  const chartRef = useSignal<SVGSVGElement>();
  const lineChartRef = useSignal<SVGSVGElement>();
  const mixChartRef = useSignal<SVGSVGElement>();

  const t = useComputed$(() => I18N[lang.value] ?? I18N.en);
  const locale = useComputed$(() => (I18N[lang.value] ?? I18N.en) as Record<string, string>);
  const fallbackLocale = I18N.en as Record<string, string>;
  const aiSections = useComputed$(() => parseAiSections(aiRecommendation.value));

  const formatCurrency = (value: number): string => {
    const code = detected.currency || "USD";
    try {
      return new Intl.NumberFormat(lang.value, {
        style: "currency",
        currency: code,
        maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${value.toFixed(2)} ${code}`;
    }
  };

  const rankedMiners = useComputed$<RankedMiner[]>(() => {
    const basePrice = REFERENCE_COIN_PRICE_USD[selectedCoin.value];
    const multiplier =
      basePrice && liveCoinPriceUsd.value ? liveCoinPriceUsd.value / basePrice : 1;
    const miners = minerCatalog.value.filter((miner) => miner.coin === selectedCoin.value);
    return miners
      .map((miner) => {
        const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
        const maintenanceUsd = detected.maintenanceMonthly / Math.max(usdRate.value, 0.0001);
        const baseGrossRevenueUsd = miner.revenuePerDayUsd * 30 * multiplier;
        const baseRunningCostUsd = (miner.powerWatts / 1000) * 24 * 30 * detected.electricityPrice;
        const basePoolFeeUsd = baseGrossRevenueUsd * (miner.poolFeePct / 100);
        const baseTaxable = Math.max(baseGrossRevenueUsd - baseRunningCostUsd - basePoolFeeUsd, 0);
        const baseTaxesUsd = baseTaxable * detected.taxRate;
        const baseNetProfitUsd = baseGrossRevenueUsd - baseRunningCostUsd - basePoolFeeUsd - baseTaxesUsd;
        const baseTotalCosts = baseRunningCostUsd + basePoolFeeUsd + baseTaxesUsd;

        const uptimeFactor = clamp(detected.uptimePct) / 100;
        const staleFactor = 1 - clamp(detected.staleRejectPct) / 100;
        const difficultyFactor = 1 - clamp(detected.difficultyGrowthPct) / 100;
        const degradationFactor = 1 - clamp(detected.hardwareDegradationPct) / 100;
        const effectiveRevenueFactor = Math.max(0.2, uptimeFactor * staleFactor * difficultyFactor * degradationFactor);
        const extGrossRevenueUsd = baseGrossRevenueUsd * effectiveRevenueFactor;
        const extElectricityUsd = baseRunningCostUsd * uptimeFactor;
        const extCoolingCostUsd = extElectricityUsd * (clamp(detected.coolingOverheadPct) / 100);
        const extRunningCostUsd = extElectricityUsd + extCoolingCostUsd;
        const extPoolFeeUsd = extGrossRevenueUsd * (clamp(detected.poolFeePct) / 100);
        const isHoldStrategy = detected.payoutStrategy === "hold_cold_wallet";
        const extWithdrawalCostUsd = isHoldStrategy
          ? 0
          : extGrossRevenueUsd * (clamp(detected.withdrawalFeePct) / 100);
        const extFxSpreadCostUsd = isHoldStrategy
          ? 0
          : extGrossRevenueUsd * (clamp(detected.fxSpreadPct) / 100);
        const extFinancingCostUsd = isHoldStrategy
          ? 0
          : (miner.purchaseUsd * (clamp(detected.financingAprPct) / 100)) / 12;
        const extTaxable = Math.max(
          extGrossRevenueUsd -
            extRunningCostUsd -
            extPoolFeeUsd -
            extWithdrawalCostUsd -
            extFxSpreadCostUsd -
            maintenanceUsd -
            extFinancingCostUsd,
          0,
        );
        const extTaxesUsd = extTaxable * detected.taxRate;
        const extNetProfitUsd =
          extGrossRevenueUsd -
          extRunningCostUsd -
          extPoolFeeUsd -
          extTaxesUsd -
          extWithdrawalCostUsd -
          extFxSpreadCostUsd -
          maintenanceUsd -
          extFinancingCostUsd;
        const extTotalCosts =
          extRunningCostUsd +
          extPoolFeeUsd +
          extTaxesUsd +
          extWithdrawalCostUsd +
          extFxSpreadCostUsd +
          maintenanceUsd +
          extFinancingCostUsd;

        const useExtended =
          advancedCostsExpanded.value || advancedCostsEdited.value || advancedCostsStatus.value !== "idle";
        const grossRevenueUsd = useExtended ? extGrossRevenueUsd : baseGrossRevenueUsd;
        const runningCostUsd = useExtended ? extRunningCostUsd : baseRunningCostUsd;
        const poolFeeUsd = useExtended ? extPoolFeeUsd : basePoolFeeUsd;
        const taxesUsd = useExtended ? extTaxesUsd : baseTaxesUsd;
        const netProfitUsd = useExtended ? extNetProfitUsd : baseNetProfitUsd;
        const totalCosts = useExtended ? extTotalCosts : baseTotalCosts;
        const effectivePurchaseUsd =
          miner.purchaseUsd * (1 + (useExtended ? clamp(detected.importDutyPct) / 100 : 0));
        const roiMonths = netProfitUsd > 0 ? effectivePurchaseUsd / netProfitUsd : null;
        return {
          ...miner,
          runningCost: runningCostUsd,
          grossRevenue: grossRevenueUsd,
          poolFee: poolFeeUsd,
          taxes: taxesUsd,
          netProfit: netProfitUsd,
          totalCosts,
          roiMonths,
          baseGrossRevenue: baseGrossRevenueUsd,
          baseRunningCost: baseRunningCostUsd,
          basePoolFee: basePoolFeeUsd,
          baseTaxes: baseTaxesUsd,
          baseNetProfit: baseNetProfitUsd,
          baseTotalCosts,
          extGrossRevenue: extGrossRevenueUsd,
          extRunningCost: extRunningCostUsd,
          extPoolFee: extPoolFeeUsd,
          extTaxes: extTaxesUsd,
          extNetProfit: extNetProfitUsd,
          extTotalCosts,
          extCoolingCost: extCoolingCostUsd,
          extMaintenanceCost: maintenanceUsd,
          extWithdrawalCost: extWithdrawalCostUsd,
          extFxSpreadCost: extFxSpreadCostUsd,
          extFinancingCost: extFinancingCostUsd,
        };
      })
      .sort((a, b) => b.netProfit - a.netProfit);
  });

  const selectCoin = $((coin: CoinOption) => {
    selectedCoin.value = coin.symbol.toUpperCase();
    selectedCoinName.value = coin.name;
    selectedCoinMineable.value = coin.mineable;
  });

  const toLocalCurrency = (valueUsd: number) => valueUsd * usdRate.value;

  useVisibleTask$(async () => {
    const savedTheme = localStorage.getItem("mpc_theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      theme.value = savedTheme;
    } else {
      theme.value = "dark";
    }
    document.body.classList.toggle("theme-light", theme.value === "light");

    const browserLang = navigator.language?.split("-")[0]?.toLowerCase() || "en";
    lang.value = I18N[browserLang] ? browserLang : "en";

    try {
      const bootstrap = await fetch("/api/bootstrap");
      if (bootstrap.ok) {
        const data = (await bootstrap.json()) as {
          country?: string;
          countryCode?: string;
          currency?: string;
          electricityPrice?: number;
          taxRate?: number;
          usdRate?: number;
        };
        if (data.country) detected.country = data.country;
        if (data.countryCode) detected.countryCode = data.countryCode;
        if (data.currency) detected.currency = data.currency;
        if (typeof data.electricityPrice === "number") {
          detected.electricityPrice = data.electricityPrice;
        }
        if (typeof data.taxRate === "number") detected.taxRate = data.taxRate;
        if (typeof data.usdRate === "number") usdRate.value = data.usdRate;
      }
    } catch {
      const defaults = COUNTRY_DEFAULTS.default;
      detected.electricityPrice = defaults.electricity;
      detected.taxRate = defaults.taxRate;
      detected.currency = defaults.currency;
      usdRate.value = 1;
    }
  });

  useVisibleTask$(() => {
    const params = new URLSearchParams(window.location.search);
    const country = params.get("country");
    const countryCode = params.get("countryCode");
    const currency = params.get("currency");
    const electricity = Number(params.get("electricity"));
    const tax = Number(params.get("tax"));
    const coin = params.get("coin");
    const coinName = params.get("coinName");
    const mode = params.get("mode");
    const run = params.get("run");

    if (country) detected.country = country;
    if (countryCode) detected.countryCode = countryCode;
    if (currency) detected.currency = currency.toUpperCase();
    if (Number.isFinite(electricity) && electricity >= 0) detected.electricityPrice = electricity;
    if (Number.isFinite(tax) && tax >= 0 && tax <= 1) detected.taxRate = tax;
    if (coin) selectedCoin.value = coin.toUpperCase();
    if (coinName) selectedCoinName.value = coinName;
    if (mode === "raw" || mode === "risk_adjusted") bestCoinMode.value = mode;
    if (run === "1") confirmed.value = true;
  });

  useVisibleTask$(async ({ track }) => {
    const step = track(() => formStep.value);
    const coin = track(() => selectedCoin.value);
    const country = track(() => detected.country);
    const currency = track(() => detected.currency);
    const edited = track(() => advancedCostsEdited.value);
    if (step < 3) {
      advancedCostsStatus.value = "idle";
      return;
    }
    if (edited) return;
    advancedCostsStatus.value = "loading";
    try {
      const response = await fetch(
        `/api/operating-cost-defaults?coin=${encodeURIComponent(coin)}&country=${encodeURIComponent(
          country || "global",
        )}&currency=${encodeURIComponent(currency || "USD")}`,
      );
      if (!response.ok) {
        advancedCostsStatus.value = "error";
        return;
      }
      const data = (await response.json()) as OperatingCostDefaults;
      detected.poolFeePct = data.poolFeePct;
      detected.uptimePct = data.uptimePct;
      detected.coolingOverheadPct = data.coolingOverheadPct;
      detected.staleRejectPct = data.staleRejectPct;
      detected.maintenanceMonthly = data.maintenanceMonthly;
      detected.difficultyGrowthPct = data.difficultyGrowthPct;
      detected.hardwareDegradationPct = data.hardwareDegradationPct;
      detected.fxSpreadPct = data.fxSpreadPct;
      detected.withdrawalFeePct = data.withdrawalFeePct;
      detected.financingAprPct = data.financingAprPct;
      detected.importDutyPct = data.importDutyPct;
      advancedCostsStatus.value = data.source === "ai" ? "ready" : "fallback";
    } catch {
      advancedCostsStatus.value = "error";
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => theme.value);
    document.body.classList.toggle("theme-light", theme.value === "light");
    localStorage.setItem("mpc_theme", theme.value);
  });

  useVisibleTask$(({ track, cleanup }) => {
    const message = track(() => calcNotice.value);
    if (!message) return;
    const timeout = window.setTimeout(() => {
      calcNotice.value = "";
    }, 2400);
    cleanup(() => window.clearTimeout(timeout));
  });

  useVisibleTask$(({ track }) => {
    const confirmedNow = track(() => confirmed.value);
    const researching = track(() => isResearching.value);
    const coin = track(() => coinStatus.value);
    const search = track(() => searchStatus.value);
    const ai = track(() => aiStatus.value);
    if (!confirmedNow) return;
    if (researching) return;
    if (analysisAutoScrolled.value) return;

    const statuses = [coin, search, ai];
    const started = statuses.some((s) => s !== "idle");
    const loading = statuses.includes("loading");
    if (!started || loading) return;

    const target =
      document.getElementById("profitability-results") || document.getElementById("live-intelligence");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      calcNotice.value =
        locale.value.calcNoticeAnalysisReady ?? fallbackLocale.calcNoticeAnalysisReady ?? "Analysis ready.";
      analysisAutoScrolled.value = true;
    }
  });

  useVisibleTask$(({ track }) => {
    const loading = track(() => bestCoinLoading.value);
    const bestSymbol = track(() => bestCoin.value?.symbol || "");
    const bestError = track(() => bestCoinError.value);

    if (loading) {
      bestCoinAutoScrolled.value = false;
      return;
    }
    if (bestCoinAutoScrolled.value) return;
    if (!bestSymbol && !bestError) return;

    const target = document.getElementById("best-coin-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      calcNotice.value = bestSymbol
        ? (locale.value.calcNoticeBestCoinReady ?? fallbackLocale.calcNoticeBestCoinReady ?? "Ready")
        : (locale.value.calcNoticeBestCoinDone ?? fallbackLocale.calcNoticeBestCoinDone ?? "Done");
      bestCoinAutoScrolled.value = true;
    }
  });

  useVisibleTask$(async ({ track }) => {
    const currency = track(() => detected.currency);
    if (!currency) return;
    try {
      const response = await fetch(`/api/fx-rate?currency=${encodeURIComponent(currency)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { usdRate?: number };
      if (typeof data.usdRate === "number" && Number.isFinite(data.usdRate)) {
        usdRate.value = data.usdRate;
      }
    } catch {
      void 0;
    }
  });

  useVisibleTask$(({ cleanup }) => {
    const root = document.documentElement;
    const setCenter = () => {
      root.style.setProperty("--cursor-x", `${window.innerWidth / 2}px`);
      root.style.setProperty("--cursor-y", `${window.innerHeight / 2}px`);
      root.style.setProperty("--cursor-xp", "50%");
      root.style.setProperty("--cursor-yp", "50%");
    };

    setCenter();

    let iconStates: Array<{
      icon: HTMLElement;
      baseX: number;
      baseY: number;
      x: number;
      y: number;
      vx: number;
      vy: number;
    }> = [];
    const initializeIconStates = () => {
      const iconElements = Array.from(document.querySelectorAll<HTMLElement>(".crypto-float"));
      iconStates = iconElements.map((icon) => {
        const rect = icon.getBoundingClientRect();
        const fallbackX = window.innerWidth * 0.5;
        const fallbackY = window.innerHeight * 0.5;
        const baseX = Number.isFinite(rect.left) ? rect.left + rect.width / 2 : fallbackX;
        const baseY = Number.isFinite(rect.top) ? rect.top + rect.height / 2 : fallbackY;
        const speed = 28 + Math.random() * 38;
        const angle = Math.random() * Math.PI * 2;
        icon.style.setProperty("--base-x", `${baseX}px`);
        icon.style.setProperty("--base-y", `${baseY}px`);
        return {
          icon,
          baseX,
          baseY,
          x: baseX,
          y: baseY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      });
    };
    initializeIconStates();

    let rafId = 0;
    let lastTs = 0;
    const animateIcons = (ts: number) => {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.06) : 0.016;
      lastTs = ts;
      const width = window.visualViewport?.width ?? window.innerWidth;
      const height = window.visualViewport?.height ?? window.innerHeight;
      const margin = 24;
      if (!iconStates.length || iconStates.some((state) => !state.icon.isConnected)) {
        initializeIconStates();
      }
      for (const state of iconStates) {
        state.x += state.vx * dt;
        state.y += state.vy * dt;

        if (state.x <= margin || state.x >= width - margin) {
          state.vx *= -1;
          state.x = Math.max(margin, Math.min(width - margin, state.x));
        }
        if (state.y <= margin || state.y >= height - margin) {
          state.vy *= -1;
          state.y = Math.max(margin, Math.min(height - margin, state.y));
        }

        const tx = state.x - state.baseX;
        const ty = state.y - state.baseY;
        state.icon.style.setProperty("--tx", `${tx.toFixed(2)}px`);
        state.icon.style.setProperty("--ty", `${ty.toFixed(2)}px`);
      }

      rafId = window.requestAnimationFrame(animateIcons);
    };
    rafId = window.requestAnimationFrame(animateIcons);

    const onMove = (event: PointerEvent) => {
      root.style.setProperty("--cursor-x", `${event.clientX}px`);
      root.style.setProperty("--cursor-y", `${event.clientY}px`);
      root.style.setProperty("--cursor-xp", `${(event.clientX / window.innerWidth) * 100}%`);
      root.style.setProperty("--cursor-yp", `${(event.clientY / window.innerHeight) * 100}%`);
    };

    const onResize = () => {
      setCenter();
      initializeIconStates();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    cleanup(() => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", onResize);
    });
  });

  useVisibleTask$(({ track, cleanup }) => {
    const q = track(() => coinQuery.value.trim());
    if (q.length < 2) {
      coinOptions.value = [];
      coinSearchError.value = "";
      searchingCoins.value = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      searchingCoins.value = true;
      coinSearchError.value = "";
      try {
        const response = await fetch(`/api/coin-search?q=${encodeURIComponent(q)}`);
        if (!response.ok) {
          coinSearchError.value = formatI18n(
            locale.value.coinSearchFailed ?? fallbackLocale.coinSearchFailed ?? "Coin search failed ({status})",
            { status: response.status },
          );
          coinOptions.value = [];
          return;
        }
        const data = (await response.json()) as { coins?: CoinOption[] };
        coinOptions.value = data.coins || [];
      } catch {
        coinSearchError.value =
          locale.value.coinSearchUnavailable ?? fallbackLocale.coinSearchUnavailable ?? "Coin search unavailable right now.";
        coinOptions.value = [];
      } finally {
        searchingCoins.value = false;
      }
    }, 280);

    cleanup(() => window.clearTimeout(timer));
  });

  useVisibleTask$(async ({ track }) => {
    track(() => providerRefreshTick.value);
    providerError.value = "";
    providerOverall.value = "checking";
    try {
      const response = await fetch("/api/provider-health");
      if (!response.ok) {
        providerOverall.value = "down";
        providerError.value = formatI18n(
          locale.value.providerHealthFailed ?? fallbackLocale.providerHealthFailed ?? "Provider health check failed ({status})",
          { status: response.status },
        );
        return;
      }
      const data = (await response.json()) as {
        providers?: ProviderHealth[];
        overall?: "healthy" | "partial" | "degraded" | "down";
        checkedAt?: number;
      };
      providerHealth.value = data.providers || [];
      providerOverall.value = data.overall || "down";
      providerCheckedAt.value = typeof data.checkedAt === "number" ? data.checkedAt : null;
    } catch {
      providerOverall.value = "down";
      providerError.value =
        locale.value.providerHealthUnavailable ?? fallbackLocale.providerHealthUnavailable ?? "Provider health unavailable.";
    }
  });

  useVisibleTask$(({ cleanup }) => {
    const timer = window.setInterval(() => {
      providerRefreshTick.value += 1;
    }, 60_000);
    cleanup(() => window.clearInterval(timer));
  });

  useVisibleTask$(async ({ track }) => {
    const isConfirmed = track(() => confirmed.value);
    const coin = track(() => selectedCoin.value);
    const country = track(() => detected.country);
    const currency = track(() => detected.currency);
    const electricityPrice = track(() => detected.electricityPrice);
    const taxRate = track(() => detected.taxRate);
    const currentLang = track(() => lang.value);

    if (!isConfirmed) return;

    if (selectedCoinMineable.value === false) {
      liveCoinPriceUsd.value = null;
      minerCatalog.value = [];
      searchResults.value = [];
      crawledOffers.value = [];
      aiRecommendation.value = "";
      return;
    }

    isResearching.value = true;
    researchError.value = "";

    try {
      coinStatus.value = "loading";
      searchStatus.value = "loading";
      aiStatus.value = "loading";

      const coinPriceRes = await fetch(`/api/coin-price?symbol=${encodeURIComponent(coin)}`);
      if (coinPriceRes.ok) {
        const coinPriceData = (await coinPriceRes.json()) as { priceUsd?: number | null };
        liveCoinPriceUsd.value =
          typeof coinPriceData.priceUsd === "number" ? coinPriceData.priceUsd : null;
        if (liveCoinPriceUsd.value === null) {
          coinStatus.value = "fallback";
        } else {
          coinStatus.value = "live";
          coinLastLiveAt.value = Date.now();
        }
      } else {
        coinStatus.value = "fallback";
      }

      const minerRes = await fetch(
        `/api/miner-candidates?symbol=${encodeURIComponent(coin)}&country=${encodeURIComponent(
          country || "global",
        )}`,
      );
      const minerData = minerRes.ok
        ? ((await minerRes.json()) as {
            miners?: Miner[];
            sources?: SearchResult[];
            offers?: CrawledOffer[];
            sourceMode?: "live" | "fallback";
          })
        : { miners: [], sources: [], offers: [], sourceMode: "fallback" as const };
      minerCatalog.value = minerData.miners || [];
      searchResults.value = minerData.sources || [];
      crawledOffers.value = minerData.offers || [];

      if ((minerData.sourceMode || "fallback") === "live" || crawledOffers.value.length > 0) {
        searchStatus.value = "live";
        searchLastLiveAt.value = Date.now();
      } else {
        searchStatus.value = "fallback";
      }

      const aiRes = await fetch("/api/ai-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coinSymbol: selectedCoin.value,
          coinName: selectedCoinName.value,
          country,
          currency,
          electricityPrice,
          taxRate,
          coinPriceUsd: liveCoinPriceUsd.value,
          links: searchResults.value,
          language: currentLang,
        }),
      });

      if (aiRes.ok) {
        const aiData = (await aiRes.json()) as { recommendation?: string };
        aiRecommendation.value = aiData.recommendation || "";
        if (aiRecommendation.value) {
          aiStatus.value = "live";
          aiLastLiveAt.value = Date.now();
        } else {
          aiStatus.value = "fallback";
        }
      } else {
        aiStatus.value = "fallback";
      }
    } catch {
      researchError.value =
        locale.value.liveResearchUnavailable ??
        fallbackLocale.liveResearchUnavailable ??
        "Live research temporarily unavailable. Try again in a moment.";
      coinStatus.value = "error";
      searchStatus.value = "error";
      aiStatus.value = "error";
    } finally {
      isResearching.value = false;
    }
  });

  useVisibleTask$(({ track }) => {
    track(() => rankedMiners.value.map((m) => `${m.name}:${m.netProfit}`).join(","));
    track(() => usdRate.value);
    track(() => detected.currency);
    const graphMode = track(() => graphViewMode.value);
    const svgEl = chartRef.value;
    const lineSvgEl = lineChartRef.value;
    const mixSvgEl = mixChartRef.value;
    if (!svgEl && !lineSvgEl && !mixSvgEl) return;

    const data = rankedMiners.value.slice(0, 6);
    const useExtendedGraph = graphMode === "extended";
    const toLocal = (v: number) => v * usdRate.value;
    const currencyUnit = (detected.currency || "USD").toUpperCase();
    if (!data.length) return;

    if (svgEl) {
      const maxNameChars = Math.max(...data.map((item) => item.name.length), 10);
      const width = 960;
      const height = Math.max(320, data.length * 56 + 90);
      const margin = {
        top: 20,
        right: 48,
        bottom: 36,
        left: Math.min(460, Math.max(240, maxNameChars * 11.5)),
      };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const min = Math.min(0, d3.min(data, (d: RankedMiner) => d.netProfit) ?? 0);
      const max = Math.max(
        0,
        d3.max(data, (d: RankedMiner) => (useExtendedGraph ? d.extNetProfit : d.baseNetProfit)) ?? 0,
      );
      const x = d3.scaleLinear().domain([min * 1.2, max * 1.2]).range([0, innerWidth]).nice();
      const y = d3
        .scaleBand()
        .domain(data.map((d: RankedMiner) => d.name))
        .range([0, innerHeight])
        .padding(0.22);

      const svg = d3.select(svgEl);
      svg.selectAll("*").remove();
      svg.attr("viewBox", `0 0 ${width} ${height}`);
      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).tickSize(0).tickPadding(14));

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(
          d3
            .axisBottom(x)
            .ticks(6)
            .tickFormat((v: d3.NumberValue) => `${Math.round(toLocal(Number(v)))}`),
        );

      g.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .attr("stroke", "var(--border)");

      g.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", x(0))
        .attr("y", (d: RankedMiner) => y(d.name) ?? 0)
        .attr("height", y.bandwidth())
        .attr("width", 0)
        .attr("rx", 9)
        .attr(
          "fill",
          (d: RankedMiner) => ((useExtendedGraph ? d.extNetProfit : d.baseNetProfit) >= 0 ? "#6ea8ff" : "#ff6f91"),
        )
        .transition()
        .duration(700)
        .attr("x", (d: RankedMiner) => {
          const val = useExtendedGraph ? d.extNetProfit : d.baseNetProfit;
          return val >= 0 ? x(0) : x(val);
        })
        .attr("width", (d: RankedMiner) => {
          const val = useExtendedGraph ? d.extNetProfit : d.baseNetProfit;
          return Math.abs(x(val) - x(0));
        });

      g.selectAll(".bar-hover")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "bar-hover")
        .attr("x", (d: RankedMiner) => {
          const val = useExtendedGraph ? d.extNetProfit : d.baseNetProfit;
          return val >= 0 ? x(0) : x(val);
        })
        .attr("y", (d: RankedMiner) => y(d.name) ?? 0)
        .attr("height", y.bandwidth())
        .attr("width", (d: RankedMiner) => {
          const val = useExtendedGraph ? d.extNetProfit : d.baseNetProfit;
          return Math.abs(x(val) - x(0));
        })
        .attr("fill", "transparent")
        .append("title")
        .text(
          (d: RankedMiner) =>
            `${d.name}: ${Math.round(
              toLocal(useExtendedGraph ? d.extNetProfit : d.baseNetProfit),
            )} ${currencyUnit}/${locale.value.monthShort ?? fallbackLocale.monthShort ?? "month"}`,
        );

      g.append("text")
        .attr("x", innerWidth)
        .attr("y", innerHeight + 32)
        .attr("text-anchor", "end")
        .attr("fill", "var(--muted)")
        .style("font-size", "11px")
        .text(
          formatI18n(
            locale.value.netProfitAxisLabel ?? fallbackLocale.netProfitAxisLabel ?? "Net profit ({currency}/month)",
            { currency: currencyUnit },
          ),
        );
    }

    if (lineSvgEl) {
      const top = data[0];
      const points = d3.range(1, 13).map((month) => ({
        month,
        grossRevenue: (useExtendedGraph ? top.extGrossRevenue : top.baseGrossRevenue) * month,
        electricity: (useExtendedGraph ? top.extRunningCost : top.baseRunningCost) * month,
        totalCosts: (useExtendedGraph ? top.extTotalCosts : top.baseTotalCosts) * month,
        net: (useExtendedGraph ? top.extNetProfit : top.baseNetProfit) * month,
      }));

      const width = 960;
      const height = 360;
      const margin = { top: 20, right: 28, bottom: 42, left: 84 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const maxValue =
        d3.max(points, (d) => Math.max(d.grossRevenue, d.electricity, d.totalCosts, d.net)) ?? 1;

      const x = d3.scaleLinear().domain([1, 12]).range([0, innerWidth]);
      const y = d3.scaleLinear().domain([0, maxValue * 1.12]).range([innerHeight, 0]).nice();

      const lineSvg = d3.select(lineSvgEl);
      lineSvg.selectAll("*").remove();
      lineSvg.attr("viewBox", `0 0 ${width} ${height}`);
      const g = lineSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(12).tickFormat((d: d3.NumberValue) => `M${Number(d)}`));

      g.append("g")
        .attr("class", "axis")
        .call(
          d3
            .axisLeft(y)
            .ticks(6)
            .tickFormat((v: d3.NumberValue) => `${Math.round(toLocal(Number(v)))}`),
        );

      const drawLine = (
        key: "grossRevenue" | "electricity" | "totalCosts" | "net",
        color: string,
        label: string,
      ) => {
        const line = d3
          .line<(typeof points)[number]>()
          .x((d) => x(d.month))
          .y((d) => y(d[key]));
        g.append("path")
          .datum(points)
          .attr("fill", "none")
          .attr("stroke", color)
          .attr("stroke-width", 2.4)
          .attr("d", line);

        g.selectAll(`.point-${key}`)
          .data(points)
          .enter()
          .append("circle")
          .attr("class", `point-${key}`)
          .attr("cx", (d) => x(d.month))
          .attr("cy", (d) => y(d[key]))
          .attr("r", 3.2)
          .attr("fill", color)
          .append("title")
          .text((d) => `${label} M${d.month}: ${Math.round(toLocal(d[key]))} ${currencyUnit}`);
      };

      drawLine("grossRevenue", "#4f8cff", locale.value.grossRevenue ?? fallbackLocale.grossRevenue ?? "Gross Revenue");
      drawLine("grossRevenue", "#4f8cff", locale.value.grossRevenue ?? fallbackLocale.grossRevenue ?? "Gross Revenue");
      drawLine("electricity", "#ffb347", locale.value.electricityLabel ?? fallbackLocale.electricityLabel ?? "Electricity");
      drawLine("totalCosts", "#ff5d7a", locale.value.totalCosts ?? fallbackLocale.totalCosts ?? "Total costs");
      drawLine("net", "#6ea8ff", locale.value.netProfit ?? fallbackLocale.netProfit ?? "Net Profit");

      g.append("text")
        .attr("x", innerWidth)
        .attr("y", innerHeight + 34)
        .attr("text-anchor", "end")
        .attr("fill", "var(--muted)")
        .style("font-size", "11px")
        .text(locale.value.monthAxisLabel ?? fallbackLocale.monthAxisLabel ?? "Month (M1-M12)");

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -8)
        .attr("y", -58)
        .attr("text-anchor", "end")
        .attr("fill", "var(--muted)")
        .style("font-size", "11px")
        .text(
          formatI18n(
            locale.value.cumulativeAmountLabel ?? fallbackLocale.cumulativeAmountLabel ?? "Cumulative amount ({currency})",
            { currency: currencyUnit },
          ),
        );
    }

    if (mixSvgEl) {
      const top = data.slice(0, 4);
      const normalizeForDisplay = (value: number): number => {
        return Math.round(toLocal(value)) === 0 ? 0 : value;
      };
      const getMixValue = (
        d: RankedMiner,
        key:
          | "grossRevenue"
          | "totalCosts"
          | "runningCost"
          | "poolFee"
          | "taxes"
          | "maintenance"
          | "withdrawal"
          | "fxSpread"
          | "financing"
          | "netProfit",
      ): number => {
        if (key === "totalCosts") return normalizeForDisplay(useExtendedGraph ? d.extTotalCosts : d.baseTotalCosts);
        if (key === "grossRevenue") return normalizeForDisplay(useExtendedGraph ? d.extGrossRevenue : d.baseGrossRevenue);
        if (key === "runningCost") return normalizeForDisplay(useExtendedGraph ? d.extRunningCost : d.baseRunningCost);
        if (key === "poolFee") return normalizeForDisplay(useExtendedGraph ? d.extPoolFee : d.basePoolFee);
        if (key === "taxes") return normalizeForDisplay(useExtendedGraph ? d.extTaxes : d.baseTaxes);
        if (key === "netProfit") return normalizeForDisplay(useExtendedGraph ? d.extNetProfit : d.baseNetProfit);
        if (key === "maintenance") return normalizeForDisplay(d.extMaintenanceCost);
        if (key === "withdrawal") return normalizeForDisplay(d.extWithdrawalCost);
        if (key === "fxSpread") return normalizeForDisplay(d.extFxSpreadCost);
        return normalizeForDisplay(d.extFinancingCost);
      };
      const keys = useExtendedGraph
        ? ([
            "grossRevenue",
            "totalCosts",
            "runningCost",
            "poolFee",
            "taxes",
            "maintenance",
            "withdrawal",
            "fxSpread",
            "financing",
            "netProfit",
          ] as const)
        : ([
            "grossRevenue",
            "totalCosts",
            "runningCost",
            "poolFee",
            "taxes",
            "netProfit",
          ] as const);
      const activeKeys = keys.filter((key) => top.some((d) => getMixValue(d, key) > 0.0001));
      const colors: Record<(typeof keys)[number], string> = {
        grossRevenue: "#4f8cff",
        totalCosts: "#ff9f43",
        runningCost: "#ffb347",
        poolFee: "#b68bff",
        taxes: "#ff6f91",
        maintenance: "#67c587",
        withdrawal: "#9b84ff",
        fxSpread: "#ffaa66",
        financing: "#ff8ac0",
        netProfit: "#6ea8ff",
      };
      const labels: Record<(typeof keys)[number], string> = {
        grossRevenue: locale.value.grossRevenue ?? fallbackLocale.grossRevenue ?? "Gross Revenue",
        totalCosts: locale.value.totalCosts ?? fallbackLocale.totalCosts ?? "Total costs",
        runningCost: locale.value.electricityCostLabel ?? fallbackLocale.electricityCostLabel ?? "Electricity cost",
        poolFee: locale.value.poolFee ?? fallbackLocale.poolFee ?? "Pool Fee",
        taxes: locale.value.taxes ?? fallbackLocale.taxes ?? "Taxes",
        maintenance: "Maintenance",
        withdrawal: "Withdrawal/Exchange",
        fxSpread: "FX spread",
        financing: "Financing",
        netProfit: locale.value.netProfit ?? fallbackLocale.netProfit ?? "Net Profit",
      };

      const width = 960;
      const height = 360;
      const margin = { top: 20, right: 20, bottom: 72, left: 72 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const x0 = d3
        .scaleBand()
        .domain(top.map((d) => d.name))
        .range([0, innerWidth])
        .padding(0.16);
      const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.12);
      x1.domain(activeKeys);
      const maxValue =
        d3.max(top, (d) =>
          Math.max(
            ...activeKeys.map((key) => getMixValue(d, key)),
          ),
        ) ?? 1;
      const y = d3.scaleLinear().domain([0, maxValue * 1.15]).range([innerHeight, 0]).nice();

      const mixSvg = d3.select(mixSvgEl);
      mixSvg.selectAll("*").remove();
      mixSvg.attr("viewBox", `0 0 ${width} ${height}`);
      const g = mixSvg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x0).tickSize(0).tickPadding(8))
        .selectAll("text")
        .attr("transform", "rotate(-18)")
        .style("text-anchor", "end");

      g.append("g")
        .attr("class", "axis")
        .call(
          d3
            .axisLeft(y)
            .ticks(5)
            .tickFormat((v: d3.NumberValue) => `${Math.round(toLocal(Number(v)))}`),
        );

      const groups = g.selectAll(".mix-group").data(top).enter().append("g").attr("class", "mix-group").attr(
        "transform",
        (d) => `translate(${x0(d.name) ?? 0},0)`,
      );

      groups
        .selectAll("rect")
        .data((d) =>
          activeKeys.map((key) => ({
            key,
            value: Math.max(0, getMixValue(d, key)),
          })),
        )
        .enter()
        .append("rect")
        .attr("x", (d) => x1(d.key) ?? 0)
        .attr("y", (d) => y(d.value))
        .attr("width", x1.bandwidth())
        .attr("height", (d) => innerHeight - y(d.value))
        .attr("rx", 6)
        .attr("fill", (d) => colors[d.key])
        .append("title")
        .text((d) => `${labels[d.key]}: ${Math.round(toLocal(d.value))} ${currencyUnit}/month`);

      groups
        .selectAll(".mix-value")
        .data((d) =>
          activeKeys.map((key) => ({
            key,
            value: Math.max(0, getMixValue(d, key)),
          })),
        )
        .enter()
        .append("text")
        .attr("class", "mix-value")
        .attr("x", (d) => (x1(d.key) ?? 0) + x1.bandwidth() / 2)
        .attr("y", (d) => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--muted)")
        .style("font-size", "10px")
        .text((d) => (d.value > 0 ? `${Math.round(toLocal(d.value))} ${currencyUnit}` : ""));

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -8)
        .attr("y", -46)
        .attr("text-anchor", "end")
        .attr("fill", "var(--muted)")
        .style("font-size", "11px")
        .text(
          formatI18n(
            locale.value.monthlyAmountLabel ?? fallbackLocale.monthlyAmountLabel ?? "Monthly amount ({currency}/month)",
            { currency: currencyUnit },
          ),
        );
    }
  });

  const toggleTheme = $(() => {
    theme.value = theme.value === "dark" ? "light" : "dark";
  });
  const totalSteps = 4;
  const scrollToWizard = $(() => {
    document.getElementById("onboarding-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const nextStep = $(() => {
    formStep.value = Math.min(totalSteps, formStep.value + 1);
  });
  const prevStep = $(() => {
    formStep.value = Math.max(1, formStep.value - 1);
  });
  const submitWizard = $(() => {
    analysisAutoScrolled.value = false;
    confirmed.value = true;
    calcNotice.value =
      locale.value.calcNoticeRunningAnalysis ?? fallbackLocale.calcNoticeRunningAnalysis ?? "Running profitability analysis...";
  });
  const getShareUrl = $(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("country", detected.country);
    url.searchParams.set("countryCode", detected.countryCode);
    url.searchParams.set("currency", detected.currency);
    url.searchParams.set("electricity", detected.electricityPrice.toString());
    url.searchParams.set("tax", detected.taxRate.toString());
    url.searchParams.set("coin", selectedCoin.value);
    url.searchParams.set("coinName", selectedCoinName.value);
    url.searchParams.set("mode", bestCoinMode.value);
    if (confirmed.value) url.searchParams.set("run", "1");
    return url.toString();
  });
  const copyShareLink = $(async () => {
    try {
      const url = await getShareUrl();
      await navigator.clipboard.writeText(url);
      shareCopied.value = true;
      setTimeout(() => {
        shareCopied.value = false;
      }, 1500);
    } catch {
      shareCopied.value = false;
    }
  });
  const exportPdfReport = $(async () => {
    pdfGenerating.value = true;
    try {
      const pdfCopyrightFooterText = `© ${new Date().getFullYear()} Mining Profit Lab`;
      const chartModeLabel = graphViewMode.value === "extended" ? "Extended costs" : "Default costs";
      const currencyCode = detected.currency || "USD";
      const languageCode = lang.value;
      const conversionRate = usdRate.value;
      const minersSnapshot = [...minerResults].slice(0, 6);
      const bestSnapshot = bestCoin.value;
      const rankingSvg = chartRef.value;
      const trendSvg = lineChartRef.value;
      const mixSvg = mixChartRef.value;
      const confidenceScore = Math.max(
        35,
        Math.min(
          99,
          40 +
            (coinStatus.value === "live" ? 18 : 0) +
            (searchStatus.value === "live" ? 18 : 0) +
            (aiStatus.value === "live" ? 12 : 0) +
            Math.min(crawledOffers.value.length, 3) * 4,
        ),
      );
      const riskPenalty = bestSnapshot?.volatilityPenaltyPct ?? 0.35;
      const riskLevel = riskPenalty <= 0.2
        ? (locale.value.riskLow ?? fallbackLocale.riskLow ?? "Low")
        : riskPenalty <= 0.32
          ? (locale.value.riskModerate ?? fallbackLocale.riskModerate ?? "Moderate")
          : (locale.value.riskHigh ?? fallbackLocale.riskHigh ?? "High");

      const localFormat = (valueUsd: number) => {
        const local = valueUsd * conversionRate;
        try {
          return new Intl.NumberFormat(languageCode, {
            style: "currency",
            currency: currencyCode,
            maximumFractionDigits: 2,
          }).format(local);
        } catch {
          return `${local.toFixed(2)} ${currencyCode}`;
        }
      };
      const svgToPngDataUrl = async (svgEl?: SVGSVGElement) => {
        if (!svgEl) return null;
        const cloned = svgEl.cloneNode(true) as SVGSVGElement;
        cloned.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        const viewBox = cloned.getAttribute("viewBox")?.split(" ").map(Number) ?? [];
        const sourceWidth = Number.isFinite(viewBox[2]) ? viewBox[2] : Math.max(svgEl.clientWidth, 960);
        const sourceHeight = Number.isFinite(viewBox[3]) ? viewBox[3] : Math.max(svgEl.clientHeight, 340);
        const serialized = new XMLSerializer().serializeToString(cloned);
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
        const image = new Image();
        const loadImage = new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("Unable to render SVG chart into PDF"));
        });
        image.src = svgDataUrl;
        await loadImage;

        const maxWidth = 1400;
        const scale = Math.min(1.6, maxWidth / sourceWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sourceWidth * scale);
        canvas.height = Math.round(sourceHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/png", 0.95);
      };
      const [rankingChartImage, trendChartImage, mixChartImage] = await Promise.all([
        new Promise<void>((resolve) => requestAnimationFrame(() => resolve())).then(() =>
          svgToPngDataUrl(rankingSvg),
        ),
        svgToPngDataUrl(trendSvg),
        svgToPngDataUrl(mixSvg),
      ]);
      const drawBadge = (
        doc: import("jspdf").jsPDF,
        x: number,
        y: number,
        label: string,
        value: string,
        color: [number, number, number],
      ) => {
        doc.setFillColor(color[0], color[1], color[2]);
        doc.roundedRect(x, y, 152, 48, 8, 8, "F");
        doc.setTextColor(247, 250, 255);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.text(label.toUpperCase(), x + 10, y + 16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(value, x + 10, y + 33, { maxWidth: 132 });
      };

      const module = await import("jspdf");
      const doc = new module.jsPDF({ unit: "pt", format: "a4" });
      const width = doc.internal.pageSize.getWidth();
      let y = 56;

      doc.setFillColor(18, 31, 67);
      doc.roundedRect(30, 24, width - 60, 122, 14, 14, "F");
      doc.setFillColor(40, 76, 161);
      doc.roundedRect(30, 24, width - 60, 18, 14, 14, "F");
      doc.setTextColor(238, 245, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text(locale.value.reportTitle ?? fallbackLocale.reportTitle ?? "Mining Profitability Intelligence Report", 48, 68);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `${detected.country} • ${detected.currency} • Electricity ${detected.electricityPrice}/kWh • Tax ${(detected.taxRate * 100).toFixed(1)}% • Generated ${new Date().toLocaleString()}`,
        48,
        91,
        { maxWidth: width - 96 },
      );
      doc.text(locale.value.reportMethod ?? fallbackLocale.reportMethod ?? "Method", 48, 111, {
        maxWidth: width - 96,
      });
      doc.text(`Chart mode: ${chartModeLabel}`, 48, 127, {
        maxWidth: width - 96,
      });
      drawBadge(
        doc,
        48,
        162,
        locale.value.confidenceLabel ?? fallbackLocale.confidenceLabel ?? "Confidence",
        `${confidenceScore}%`,
        [35, 92, 165],
      );
      drawBadge(
        doc,
        212,
        162,
        locale.value.riskProfileLabel ?? fallbackLocale.riskProfileLabel ?? "Risk Profile",
        riskLevel,
        [124, 58, 171],
      );
      drawBadge(
        doc,
        376,
        162,
        locale.value.rankingModeLabel ?? fallbackLocale.rankingModeLabel ?? "Ranking Mode",
        bestCoinMode.value === "risk_adjusted"
          ? (locale.value.riskAdjusted ?? fallbackLocale.riskAdjusted ?? "Risk-adjusted")
          : (locale.value.rawProfitLabel ?? fallbackLocale.rawProfitLabel ?? "Raw Profit"),
        [
        24, 119, 98,
      ]);
      y = 236;

      if (bestSnapshot) {
        doc.setTextColor(32, 32, 32);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(15);
        doc.text(
          locale.value.bestCoinRecommendationTitle ?? fallbackLocale.bestCoinRecommendationTitle ?? "Best Coin Recommendation",
          40,
          y,
        );
        y += 22;
        doc.setDrawColor(223, 229, 240);
        doc.roundedRect(40, y - 12, width - 80, 88, 8, 8);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.text(
          `${locale.value.coinLabel ?? fallbackLocale.coinLabel ?? "Coin"}: ${bestSnapshot.symbol} | ${locale.value.minerLabel ?? fallbackLocale.minerLabel ?? "Miner"}: ${bestSnapshot.bestMinerName} | ${locale.value.net ?? fallbackLocale.net ?? "Net"}: ${localFormat(
            bestSnapshot.netProfitUsd,
          )}/${locale.value.monthShort ?? fallbackLocale.monthShort ?? "month"}`,
          52,
          y + 10,
          { maxWidth: width - 80 },
        );
        doc.text(
          `Gross: ${localFormat(bestSnapshot.grossRevenueUsd)} | Electricity: ${localFormat(
            bestSnapshot.runningCostUsd,
          )} | Pool: ${localFormat(bestSnapshot.poolFeeUsd)} | Taxes: ${localFormat(bestSnapshot.taxesUsd)}`,
          52,
          y + 30,
          { maxWidth: width - 100 },
        );
        doc.text(
          `Score: ${localFormat(bestSnapshot.scoreUsd)} | Volatility penalty: ${(bestSnapshot.volatilityPenaltyPct * 100).toFixed(0)}%`,
          52,
          y + 50,
          { maxWidth: width - 100 },
        );
        y += 92;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(locale.value.topMinerResultsTitle ?? fallbackLocale.topMinerResultsTitle ?? "Top Miner Results", 40, y);
      y += 20;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const miner of minersSnapshot) {
        if (y > 740) {
          doc.addPage();
          y = 54;
        }
        doc.setDrawColor(228, 233, 243);
        doc.roundedRect(40, y - 12, width - 80, 48, 6, 6);
        doc.text(
          `${miner.name} • ${miner.hashRate} • ${locale.value.net ?? fallbackLocale.net ?? "Net"} ${localFormat(miner.netProfit)}/${locale.value.monthShort ?? fallbackLocale.monthShort ?? "month"} • ${t.value.roiMonths} ${
            miner.roiMonths
              ? `${miner.roiMonths.toFixed(1)} ${locale.value.monthsLabel ?? fallbackLocale.monthsLabel ?? "months"}`
              : (locale.value.notAvailableShort ?? fallbackLocale.notAvailableShort ?? "n/a")
          }`,
          48,
          y + 8,
          { maxWidth: width - 96 },
        );
        doc.setTextColor(88, 92, 106);
        doc.text(
          `${locale.value.powerLabel ?? fallbackLocale.powerLabel ?? "Power"} ${miner.powerWatts}W • ${t.value.purchaseCost} ${localFormat(miner.purchaseUsd)} • ${locale.value.poolFeePctLabel ?? fallbackLocale.poolFeePctLabel ?? "Pool fee"} ${miner.poolFeePct.toFixed(
            2,
          )}%`,
          48,
          y + 24,
          { maxWidth: width - 96 },
        );
        doc.setTextColor(32, 32, 32);
        y += 52;
      }

      if (rankingChartImage || trendChartImage || mixChartImage) {
        doc.addPage();
        let chartY = 54;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(
          locale.value.visualAnalyticsSnapshotTitle ??
            fallbackLocale.visualAnalyticsSnapshotTitle ??
            "Visual Analytics Snapshot",
          40,
          chartY,
        );
        chartY += 22;

        const drawChartBlock = (title: string, dataUrl: string | null, height: number) => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.text(title, 40, chartY);
          chartY += 10;
          doc.setDrawColor(224, 230, 241);
          doc.roundedRect(40, chartY, width - 80, height, 8, 8);
          if (dataUrl) {
            doc.addImage(dataUrl, "PNG", 46, chartY + 6, width - 92, height - 12);
          } else {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(118, 123, 140);
            doc.text(
              locale.value.chartUnavailableExport ?? fallbackLocale.chartUnavailableExport ?? "Chart unavailable for this export.",
              52,
              chartY + 24,
            );
            doc.setTextColor(32, 32, 32);
          }
          chartY += height + 24;
        };

        drawChartBlock(
          `${locale.value.netProfitRanking ?? fallbackLocale.netProfitRanking ?? "Net Profit Ranking"} (${chartModeLabel})`,
          rankingChartImage,
          170,
        );
        if (chartY > 700) {
          doc.addPage();
          chartY = 54;
        }
        drawChartBlock(
          `${locale.value.revenueVsCosts12m ?? fallbackLocale.revenueVsCosts12m ?? "12-Month Revenue vs Costs (Current Price)"} (${chartModeLabel})`,
          trendChartImage,
          170,
        );
        if (chartY > 700) {
          doc.addPage();
          chartY = 54;
        }
        drawChartBlock(
          `${locale.value.monthlyCostMixByMiner ?? fallbackLocale.monthlyCostMixByMiner ?? "Monthly Cost Mix by Miner"} (${chartModeLabel})`,
          mixChartImage,
          170,
        );
      }

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setFontSize(9);
        doc.setTextColor(90, 90, 90);
        doc.text(pdfCopyrightFooterText, 40, pageHeight - 30);
      }
      doc.save(`mining-report-${graphViewMode.value}-${Date.now()}.pdf`);
    } finally {
      pdfGenerating.value = false;
    }
  });
  const calculateBestCoin = $(async () => {
    bestCoinAutoScrolled.value = false;
    calcNotice.value =
      locale.value.calcNoticeCalculatingBestCoin ??
      fallbackLocale.calcNoticeCalculatingBestCoin ??
      "Calculating best coin setup...";
    bestCoinLoading.value = true;
    bestCoinError.value = "";
    try {
      const response = await fetch("/api/best-coin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country: detected.country,
          electricityPrice: detected.electricityPrice,
          taxRate: detected.taxRate,
          mode: bestCoinMode.value,
        }),
      });
      if (!response.ok) {
        bestCoinError.value = formatI18n(
          locale.value.bestCoinCalcFailed ?? fallbackLocale.bestCoinCalcFailed ?? "Best-coin calculation failed ({status}).",
          { status: response.status },
        );
        bestCoin.value = null;
        bestCoinRankings.value = [];
        return;
      }
      const data = (await response.json()) as {
        best?: BestCoinResult | null;
        rankings?: BestCoinResult[];
      };
      bestCoin.value = data.best || null;
      bestCoinRankings.value = data.rankings || [];
      if (!data.best) {
        bestCoinError.value =
          locale.value.noProfitableCandidates ??
          fallbackLocale.noProfitableCandidates ??
          "No profitable coin/miner candidates found for current inputs.";
      }
    } catch {
      bestCoinError.value =
        locale.value.bestCoinCalcUnavailable ??
        fallbackLocale.bestCoinCalcUnavailable ??
        "Could not calculate best coin right now. Please retry.";
      bestCoin.value = null;
      bestCoinRankings.value = [];
    } finally {
      bestCoinLoading.value = false;
    }
  });

  const tx: { value: (key: string) => string } = {
    value: noSerialize((key: string) => {
      const active = (I18N[lang.value] ?? I18N.en) as Record<string, string>;
      const fallback = I18N.en as Record<string, string>;
      return active[key] ?? fallback[key] ?? key;
    }) as unknown as (key: string) => string,
  };
  const asTitleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);
  const liveStatusText = (status: LiveDataStatus): string => tx.value(`liveStatus${asTitleCase(status)}`);
  const providerStatusText = (
    status: "healthy" | "partial" | "degraded" | "down" | "checking",
  ): string => tx.value(`providerStatus${asTitleCase(status)}`);
  const providerItemStatusText = (status: "ok" | "missing" | "error"): string =>
    tx.value(`providerItemStatus${asTitleCase(status)}`);
  const availabilityText = (status?: "in_stock" | "out_of_stock" | "unknown"): string => {
    if (status === "in_stock") return tx.value("availabilityInStock");
    if (status === "out_of_stock") return tx.value("availabilityOutOfStock");
    return tx.value("availabilityUnknown");
  };

  const minerResults = rankedMiners.value;
  const hasAnyProfitable = minerResults.some((miner) => miner.netProfit > 0);
  const extendedLegendVisibility = useComputed$(() => {
    const top = rankedMiners.value.slice(0, 4);
    return {
      maintenance: top.some((d) => d.extMaintenanceCost > 0.0001),
      withdrawalFxFinance: top.some(
        (d) => d.extWithdrawalCost > 0.0001 || d.extFxSpreadCost > 0.0001 || d.extFinancingCost > 0.0001,
      ),
    };
  });

  return (
    <main class="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={seoStructuredData} />
      {calcNotice.value && (
        <div class="calc-notice" role="status" aria-live="polite">
          <span class="loader-inline" aria-hidden="true" />
          {calcNotice.value}
        </div>
      )}
      <div class="ambient-bg" aria-hidden="true">
        <div class="ambient-spotlight" />
        <div class="ambient-grid" />
        {BACKGROUND_ICONS.map((icon, index) => (
          <span
            key={`${icon.symbol}-${index}`}
            class="crypto-float"
            style={{
              "--ix": icon.x,
              "--iy": icon.y,
              fontSize: icon.size,
              animationDelay: icon.delay,
              animationDuration: icon.duration,
            }}
          >
            {icon.symbol}
          </span>
        ))}
      </div>

      <section class="landing-hero glow full-screen-section">
        <div class="hero-nav">
          <strong class="hero-brand">{tx.value("heroBrand")}</strong>
          <nav>
            <a href="#how-it-works">{tx.value("navHowItWorks")}</a>
            <a href="#onboarding-form">{tx.value("navStart")}</a>
          </nav>
          <button
            class="btn btn-ghost icon-toggle"
            onClick$={toggleTheme}
            aria-label={t.value.modeToggle}
            title={t.value.modeToggle}
          >
            <span aria-hidden="true">{theme.value === "dark" ? "☀" : "🌙"}</span>
          </button>
        </div>

        <div class="hero-layout">
          <div class="hero-copy">
            <div class="pill-row">
              <span class="pill">{tx.value("pillLivePrices")}</span>
              <span class="pill">{tx.value("pillCountryAware")}</span>
              <span class="pill">{tx.value("pillAiGuidance")}</span>
            </div>
            <div class="hero-title-block">
              <h1>{tx.value("heroHeadline")}</h1>
              <p class="hero-subtitle">
                {t.value.subtitle}. {tx.value("heroSubtitleTail")}
              </p>
            </div>
            <div class="hero-ctas">
              <button class="btn" onClick$={scrollToWizard}>
                {tx.value("ctaStartCheck")}
              </button>
              <a class="btn btn-ghost" href="#how-it-works">
                {tx.value("ctaSeeHow")}
              </a>
            </div>
            <p class="hero-footnote">{t.value.appTitle}</p>
          </div>

          <aside class="hero-visual">
            <article>
              <span>{tx.value("heroPromiseLabel")}</span>
              <strong>{tx.value("heroPromiseValue")}</strong>
            </article>
            <article>
              <span>{tx.value("heroCoverageLabel")}</span>
              <strong>{tx.value("heroCoverageValue")}</strong>
            </article>
            <article>
              <span>{tx.value("heroOutputLabel")}</span>
              <strong>{tx.value("heroOutputValue")}</strong>
            </article>
          </aside>
        </div>
      </section>

      <section id="how-it-works" class="landing-section section-flow how-it-works">
        <h2>{tx.value("howItWorksTitle")}</h2>
        <div class="steps-grid">
          <article>
            <strong>{tx.value("step1Title")}</strong>
            <p>{tx.value("step1Desc")}</p>
          </article>
          <article>
            <strong>{tx.value("step2Title")}</strong>
            <p>{tx.value("step2Desc")}</p>
          </article>
          <article>
            <strong>{tx.value("step3Title")}</strong>
            <p>{tx.value("step3Desc")}</p>
          </article>
        </div>
      </section>

      <section id="onboarding-form" class="card section-flow typeform-card full-screen-section">
        <div class="typeform-head">
          <h2>{tx.value("guidedSetupTitle")}</h2>
          <span>
            Step {formStep.value} / {totalSteps}
          </span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style={{ width: `${(formStep.value / totalSteps) * 100}%` }} />
        </div>

        {formStep.value === 1 && (
          <div class="step-content">
            <h3>{tx.value("stepWhereLocalizeTitle")}</h3>
            <p>{t.value.detectInfo}</p>
            <div class="grid">
              <label>
                <span>{t.value.country}</span>
                <input
                  placeholder={tx.value("countryPlaceholder")}
                  value={detected.country}
                  onInput$={(e) => (detected.country = (e.target as HTMLInputElement).value)}
                  onBlur$={async (e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    if (!raw.trim()) return;
                    try {
                      const response = await fetch(
                        `/api/country-profile?value=${encodeURIComponent(raw)}`,
                      );
                      if (!response.ok) return;
                      const data = (await response.json()) as {
                        country?: string;
                        countryCode?: string;
                        currency?: string;
                        electricityPrice?: number;
                        taxRate?: number;
                      };
                      if (data.country) detected.country = data.country;
                      if (data.countryCode) detected.countryCode = data.countryCode;
                      if (data.currency) detected.currency = data.currency;
                      if (typeof data.electricityPrice === "number") {
                        detected.electricityPrice = data.electricityPrice;
                      }
                      if (typeof data.taxRate === "number") detected.taxRate = data.taxRate;
                    } catch {
                      void 0;
                    }
                  }}
                />
                <small class="field-hint">
                  {tx.value("countryExamplesLabel")}:{" "}
                  {COUNTRY_OPTIONS.slice(0, 5).map((country) => `${country.code} (${country.name})`).join(", ")}
                </small>
              </label>
              <label>
                <span>{t.value.currency}</span>
                <input
                  placeholder={tx.value("currencyPlaceholder")}
                  value={detected.currency}
                  onInput$={(e) => (detected.currency = (e.target as HTMLInputElement).value)}
                  onBlur$={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    const resolved = resolveCurrencySelection(raw);
                    if (resolved) {
                      detected.currency = resolved;
                    } else {
                      detected.currency = raw.toUpperCase();
                    }
                  }}
                />
                <small class="field-hint">
                  {tx.value("currencyExamplesLabel")}: USD, EUR, CHF, dollar, $, euro, franc
                </small>
              </label>
              <label>
                <span>{t.value.language}</span>
                <select
                  value={lang.value}
                  onChange$={(e) => (lang.value = (e.target as HTMLSelectElement).value)}
                >
                  {Object.keys(I18N).map((languageCode) => (
                    <option value={languageCode} key={languageCode}>
                      {languageCode.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        )}

        {formStep.value === 2 && (
          <div class="step-content">
            <h3>{tx.value("stepOperatingCostsTitle")}</h3>
            <p>{tx.value("stepOperatingCostsDesc")}</p>
            <div class="grid">
              <label>
                <span>{t.value.electricityPrice}</span>
                <input
                  type="number"
                  step="0.001"
                  value={detected.electricityPrice}
                  onInput$={(e) => {
                    const parsed = Number((e.target as HTMLInputElement).value);
                    if (Number.isFinite(parsed)) detected.electricityPrice = parsed;
                  }}
                />
              </label>
              <label>
                <span>{t.value.taxRate}</span>
                <input
                  type="number"
                  step="0.01"
                  value={detected.taxRate}
                  onInput$={(e) => {
                    const parsed = Number((e.target as HTMLInputElement).value);
                    if (Number.isFinite(parsed)) {
                      detected.taxRate = Math.max(0, Math.min(1, parsed));
                    }
                  }}
                />
              </label>
            </div>
            <small class="field-hint">
              Coin-specific advanced costs are available after you pick a cryptocurrency.
            </small>
          </div>
        )}

        {formStep.value === 3 && (
          <div class="step-content">
            <h3>{t.value.selectCrypto}</h3>
            <p>{t.value.mineableNotice}</p>
            <label>
              <span>{tx.value("searchAnyCrypto")}</span>
              <input
                placeholder={tx.value("coinSearchPlaceholder")}
                value={coinQuery.value}
                onInput$={(e) => (coinQuery.value = (e.target as HTMLInputElement).value)}
              />
            </label>
            {searchingCoins.value && (
              <p class="status-note loader-row">
                <span class="loader-inline" aria-hidden="true" />
                {tx.value("searchingCoins")}
              </p>
            )}
            {coinSearchError.value && <p class="loss">{coinSearchError.value}</p>}
            {coinOptions.value.length > 0 && (
              <div class="coin-options">
                {coinOptions.value.map((coin) => (
                  <button
                    key={coin.id || coin.symbol}
                    class="coin-option"
                    onClick$={() => selectCoin(coin)}
                  >
                    <strong>
                      {coin.symbol} - {coin.name}
                    </strong>
                    <span>
                      {coin.mineable === true
                        ? tx.value("mineableShort")
                        : coin.mineable === false
                          ? tx.value("notMineableShort")
                          : tx.value("mineabilityUnknown")}
                    </span>
                  </button>
                ))}
              </div>
            )}
            <div class="chip-row">
              {CRYPTOS.filter((crypto) => crypto.minable === true).map((crypto) => (
                <button
                  key={crypto.symbol}
                  class={`chip ${selectedCoin.value === crypto.symbol ? "active" : ""}`}
                  onClick$={() =>
                    selectCoin({
                      symbol: crypto.symbol,
                      name: crypto.name,
                      mineable: crypto.minable,
                      reason: crypto.minable ? "known_pow" : "known_non_pow",
                    })
                  }
                >
                  {crypto.symbol}
                </button>
              ))}
            </div>
          </div>
        )}

        {formStep.value === 4 && (
          <div class="step-content">
            <h3>{tx.value("reviewRunTitle")}</h3>
            <div class="review-grid">
              <div>
                <span>{t.value.country}</span>
                <strong>{detected.country}</strong>
              </div>
              <div>
                <span>{t.value.currency}</span>
                <strong>{detected.currency}</strong>
              </div>
              <div>
                <span>{tx.value("electricityLabel")}</span>
                <strong>{detected.electricityPrice} / kWh</strong>
              </div>
              <div>
                <span>{tx.value("taxRateLabel")}</span>
                <strong>{(detected.taxRate * 100).toFixed(1)}%</strong>
              </div>
              <div>
                <span>Pool Fee</span>
                <strong>{detected.poolFeePct.toFixed(2)}%</strong>
              </div>
              <div>
                <span>Uptime</span>
                <strong>{detected.uptimePct.toFixed(1)}%</strong>
              </div>
              <div>
                <span>Payout Strategy</span>
                <strong>
                  {detected.payoutStrategy === "hold_cold_wallet" ? "Hold in cold wallet" : "Monthly cash out"}
                </strong>
              </div>
              <div>
                <span>{tx.value("selectedCoinLabel")}</span>
                <strong>
                  {selectedCoin.value} ({selectedCoinName.value})
                </strong>
              </div>
              <div>
                <span>{tx.value("mineabilityLabel")}</span>
                <strong>
                  {selectedCoinMineable.value === true
                    ? tx.value("mineableShort")
                    : selectedCoinMineable.value === false
                      ? tx.value("notMineableShort")
                      : tx.value("unknownLabel")}
                </strong>
              </div>
            </div>
            <div class="best-coin-box">
              <button
                class="btn btn-ghost"
                onClick$={() => (advancedCostsExpanded.value = !advancedCostsExpanded.value)}
              >
                {advancedCostsExpanded.value ? "Hide advanced operating costs" : "Show advanced operating costs"}
              </button>
              <small class="field-hint">
                AI defaults status: {advancedCostsStatus.value}
              </small>
            </div>
            {advancedCostsExpanded.value && (
              <div class="grid">
                <label>
                  <span>Payout Strategy</span>
                  <select
                    value={detected.payoutStrategy}
                    onChange$={(e) => {
                      advancedCostsEdited.value = true;
                      detected.payoutStrategy = (e.target as HTMLSelectElement)
                        .value as PayoutStrategy;
                      if (detected.payoutStrategy === "hold_cold_wallet") {
                        detected.withdrawalFeePct = 0;
                        detected.fxSpreadPct = 0;
                        detected.financingAprPct = 0;
                      }
                    }}
                  >
                    <option value="hold_cold_wallet">Hold in cold wallet</option>
                    <option value="monthly_cashout">Monthly cash out</option>
                  </select>
                </label>
                <label>
                  <span>Pool Fee (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.poolFeePct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.poolFeePct = Math.max(0, Math.min(8, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Uptime (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.uptimePct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.uptimePct = Math.max(60, Math.min(100, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Cooling Overhead (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.coolingOverheadPct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.coolingOverheadPct = Math.max(0, Math.min(80, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Stale/Reject Rate (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.staleRejectPct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.staleRejectPct = Math.max(0, Math.min(10, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Maintenance / month ({detected.currency})</span>
                  <input
                    type="number"
                    step="1"
                    value={detected.maintenanceMonthly}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.maintenanceMonthly = Math.max(0, parsed);
                    }}
                  />
                </label>
                <label>
                  <span>Difficulty Growth (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.difficultyGrowthPct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.difficultyGrowthPct = Math.max(0, Math.min(20, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Hardware Degradation (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.hardwareDegradationPct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) {
                        detected.hardwareDegradationPct = Math.max(0, Math.min(10, parsed));
                      }
                    }}
                  />
                </label>
                <label>
                  <span>FX Spread (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.fxSpreadPct}
                    disabled={detected.payoutStrategy === "hold_cold_wallet"}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.fxSpreadPct = Math.max(0, Math.min(5, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Withdrawal/Exchange Fees (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.withdrawalFeePct}
                    disabled={detected.payoutStrategy === "hold_cold_wallet"}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.withdrawalFeePct = Math.max(0, Math.min(5, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Financing APR (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.financingAprPct}
                    disabled={detected.payoutStrategy === "hold_cold_wallet"}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.financingAprPct = Math.max(0, Math.min(60, parsed));
                    }}
                  />
                </label>
                <label>
                  <span>Import Duty (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={detected.importDutyPct}
                    onInput$={(e) => {
                      advancedCostsEdited.value = true;
                      const parsed = Number((e.target as HTMLInputElement).value);
                      if (Number.isFinite(parsed)) detected.importDutyPct = Math.max(0, Math.min(50, parsed));
                    }}
                  />
                </label>
              </div>
            )}
            <div class="best-coin-box">
              <div class="mode-switch">
                <button
                  class={`chip ${bestCoinMode.value === "risk_adjusted" ? "active" : ""}`}
                  onClick$={() => (bestCoinMode.value = "risk_adjusted")}
                >
                  {tx.value("riskAdjusted")}
                </button>
                <button
                  class={`chip ${bestCoinMode.value === "raw" ? "active" : ""}`}
                  onClick$={() => (bestCoinMode.value = "raw")}
                >
                  {tx.value("rawMaxProfit")}
                </button>
              </div>
              <button class="btn btn-ghost" onClick$={calculateBestCoin} disabled={bestCoinLoading.value}>
                {bestCoinLoading.value ? (
                  <span class="loader-row">
                    <span class="loader-inline" aria-hidden="true" />
                    {tx.value("calculatingBestCoin")}
                  </span>
                ) : (
                  tx.value("findBestCoinForSetup")
                )}
              </button>
            </div>
          </div>
        )}

        <div class="wizard-actions">
          <button class="btn btn-ghost" onClick$={prevStep} disabled={formStep.value === 1}>
            {tx.value("back")}
          </button>
          {formStep.value < totalSteps ? (
            <button class="btn" onClick$={nextStep}>
              {tx.value("next")}
            </button>
          ) : (
            <button class="btn" onClick$={submitWizard}>
              {tx.value("runProfitabilityAnalysis")}
            </button>
          )}
        </div>
      </section>

      {(bestCoinLoading.value || bestCoin.value || bestCoinError.value) && (
        <section id="best-coin-section" class="card section-flow full-screen-section focus-panel">
          <div class="results-actions">
            <h2>{tx.value("bestCoinSuggestionTitle")}</h2>
            <div class="results-actions-buttons">
              <button class="btn btn-ghost" onClick$={copyShareLink}>
                {shareCopied.value ? tx.value("linkCopied") : tx.value("copyShareLink")}
              </button>
              <button class="btn btn-ghost" onClick$={exportPdfReport} disabled={pdfGenerating.value}>
                {pdfGenerating.value ? tx.value("generatingPdf") : tx.value("exportPdf")}
              </button>
            </div>
          </div>
          {bestCoinLoading.value && (
            <div class="loader-block">
              <span class="loader-inline" aria-hidden="true" />
              <p>{tx.value("runningProfitabilityRank")}</p>
            </div>
          )}
          {bestCoin.value && (
            <div class="best-coin-result">
              <p>
                {tx.value("bestCoinRightNow")}: <strong>{bestCoin.value.symbol}</strong> {tx.value("withMiner")}{" "}
                <strong>{bestCoin.value.bestMinerName}</strong>
              </p>
              <p>
                {tx.value("estimatedNetMonthlyProfit")}:{" "}
                <strong>{formatCurrency(toLocalCurrency(bestCoin.value.netProfitUsd))}</strong>
              </p>
              <p>
                {tx.value("modeScore")}: <strong>{formatCurrency(toLocalCurrency(bestCoin.value.scoreUsd))}</strong>{" "}
                ({bestCoinMode.value === "risk_adjusted"
                  ? `${tx.value("penalty")} ${(bestCoin.value.volatilityPenaltyPct * 100).toFixed(0)}%`
                  : tx.value("raw")})
              </p>
              <p>
                {t.value.grossRevenue}: {formatCurrency(toLocalCurrency(bestCoin.value.grossRevenueUsd))} | {tx.value("electricityLabel")}:{" "}
                {formatCurrency(toLocalCurrency(bestCoin.value.runningCostUsd))} | Pool:{" "}
                {formatCurrency(toLocalCurrency(bestCoin.value.poolFeeUsd))} | {t.value.taxes}:{" "}
                {formatCurrency(toLocalCurrency(bestCoin.value.taxesUsd))}
              </p>
            </div>
          )}
          {bestCoinRankings.value.length > 0 && (
            <div class="coin-options">
              {bestCoinRankings.value.map((row) => (
                <div class="coin-option" key={`${row.symbol}-${row.bestMinerName}`}>
                  <strong>
                    {row.symbol} - {row.bestMinerName}
                  </strong>
                  <span>
                    {tx.value("net")}: {formatCurrency(toLocalCurrency(row.netProfitUsd))} / {tx.value("monthShort")} | {tx.value("score")}:{" "}
                    {formatCurrency(toLocalCurrency(row.scoreUsd))}
                  </span>
                </div>
              ))}
            </div>
          )}
          {bestCoinError.value && <p class="loss">{bestCoinError.value}</p>}
        </section>
      )}

      {confirmed.value && (
        <section id="live-intelligence" class="card section-flow focus-panel result-panel">
          <h2>{tx.value("liveIntelligenceTitle")}</h2>
          <p>
            {isResearching.value
              ? (
                <span class="loader-row">
                  <span class="loader-inline" aria-hidden="true" />
                  {tx.value("researchingLive")}
                </span>
              )
              : tx.value("liveProviders")}
          </p>
          {liveCoinPriceUsd.value !== null && (
            <p>
              {tx.value("livePricePrefix")} {selectedCoin.value} {tx.value("livePriceSuffix")}:{" "}
              <strong>${liveCoinPriceUsd.value.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong>
            </p>
          )}
          <div class="provider-summary">
            <span>{tx.value("coinPriceLabel")}: {liveStatusText(coinStatus.value)}</span>
            <span>{tx.value("searchLabel")}: {liveStatusText(searchStatus.value)}</span>
            <span>{tx.value("aiLabel")}: {liveStatusText(aiStatus.value)}</span>
          </div>
          <div class="provider-summary time">
            <span>
              {tx.value("coinLiveAt")}:{" "}
              {coinLastLiveAt.value ? new Date(coinLastLiveAt.value).toLocaleTimeString() : tx.value("notAvailableShort")}
            </span>
            <span>
              {tx.value("searchLiveAt")}:{" "}
              {searchLastLiveAt.value
                ? new Date(searchLastLiveAt.value).toLocaleTimeString()
                : tx.value("notAvailableShort")}
            </span>
            <span>
              {tx.value("aiLiveAt")}:{" "}
              {aiLastLiveAt.value ? new Date(aiLastLiveAt.value).toLocaleTimeString() : tx.value("notAvailableShort")}
            </span>
          </div>
          <p class="status-note">
            {coinStatus.value === "live" &&
              tx.value("coinLiveMsg")}
            {coinStatus.value === "fallback" &&
              tx.value("coinFallbackMsg")}
            {coinStatus.value === "error" &&
              tx.value("coinErrorMsg")}
          </p>
          <p class="status-note">
            {searchStatus.value === "live" &&
              tx.value("searchLiveMsg")}
            {searchStatus.value === "fallback" &&
              tx.value("searchFallbackMsg")}
            {searchStatus.value === "error" &&
              tx.value("searchErrorMsg")}
          </p>
          <p class="status-note">
            {aiStatus.value === "live" &&
              tx.value("aiLiveMsg")}
            {aiStatus.value === "fallback" &&
              tx.value("aiFallbackMsg")}
            {aiStatus.value === "error" &&
              tx.value("aiErrorMsg")}
          </p>
          {researchError.value && <p class="loss">{researchError.value}</p>}
        </section>
      )}

      {confirmed.value && searchResults.value.length > 0 && (
        <section class="card section-flow focus-panel result-panel">
          <h2>{tx.value("discoveredHardwareSourcesTitle")}</h2>
          {crawledOffers.value.length > 0 && (
            <p>{crawledOffers.value.length} {tx.value("crawlerOffersMatched")}</p>
          )}
          <div class="link-list">
            {searchResults.value.map((result) => (
              <a
                href={safeExternalUrl(result.link)}
                key={result.link}
                target="_blank"
                rel="noreferrer"
                class="link-item"
              >
                <strong>{result.title}</strong>
                <span>{result.snippet}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {confirmed.value && aiRecommendation.value && (
        <section class="card section-flow focus-panel result-panel">
          <h2>{tx.value("aiRecommendationTitle")}</h2>
          <div class="ai-output">
            {aiSections.value.map((section, idx) => (
              <article class="ai-section" key={`${section.title}-${idx}`}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item, itemIdx) => (
                    <li key={`${section.title}-${itemIdx}`}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      {!confirmed.value ? (
        <section class="card section-flow warning inline-notice">
          <p>{tx.value("setupNotice")}</p>
        </section>
      ) : selectedCoinMineable.value === false ? (
        <section class="card section-flow warning inline-notice">
          <h3>{t.value.notMineable}</h3>
        </section>
      ) : selectedCoinMineable.value === null ? (
        <section class="card section-flow warning">
          <h3>{formatI18n(tx.value("mineabilityUnknownTitle"), { coin: selectedCoin.value })}</h3>
          <p>
            {tx.value("mineabilityUnknownDesc")}
          </p>
        </section>
      ) : !minerResults.length ? (
        <section class="card section-flow warning">
          <h3>{t.value.noMiners}</h3>
        </section>
      ) : (
        <>
          <section
            id="profitability-results"
            class={`card section-flow result-panel ${hasAnyProfitable ? "success" : "warning"}`}
          >
            <div class="results-actions">
              <h3>{hasAnyProfitable ? t.value.profitable : t.value.unprofitable}</h3>
              <div class="results-actions-buttons">
                <button class="btn btn-ghost" onClick$={exportPdfReport} disabled={pdfGenerating.value}>
                  {pdfGenerating.value ? tx.value("generatingPdf") : tx.value("exportPdf")}
                </button>
              </div>
            </div>
            <div class="mode-switch">
              <button
                class={`chip ${graphViewMode.value === "default" ? "active" : ""}`}
                onClick$={() => (graphViewMode.value = "default")}
              >
                Default costs
              </button>
              <button
                class={`chip ${graphViewMode.value === "extended" ? "active" : ""}`}
                onClick$={() => (graphViewMode.value = "extended")}
              >
                Extended costs
              </button>
            </div>
            <div class="chart-grid">
              <article class="chart-card">
                <h4>{tx.value("netProfitRanking")}</h4>
                <div class="chart-legend">
                  <span><i class="dot blue-soft"></i> {tx.value("positiveNet")}</span>
                  <span><i class="dot rose"></i> {tx.value("negativeNet")}</span>
                </div>
                <svg ref={chartRef} class="chart chart-large" />
              </article>
              <article class="chart-card">
                <h4>{tx.value("revenueVsCosts12m")}</h4>
                <div class="chart-legend">
                  <span><i class="dot blue"></i> {t.value.grossRevenue}</span>
                  <span><i class="dot amber"></i> {tx.value("electricityLabel")}</span>
                  <span><i class="dot rose"></i> {tx.value("totalCosts")}</span>
                  <span><i class="dot blue-soft"></i> {tx.value("net")}</span>
                </div>
                <svg ref={lineChartRef} class="chart chart-medium" />
              </article>
              <article class="chart-card">
                <h4>{tx.value("monthlyCostMixByMiner")}</h4>
                <div class="chart-legend">
                  <span><i class="dot blue"></i> {t.value.grossRevenue}</span>
                  <span><i class="dot orange"></i> {tx.value("totalCosts")}</span>
                  <span><i class="dot amber"></i> {tx.value("electricityCostLabel")}</span>
                  <span><i class="dot violet"></i> {tx.value("poolLabel")}</span>
                  <span><i class="dot rose"></i> {t.value.taxes}</span>
                  {graphViewMode.value === "extended" && extendedLegendVisibility.value.maintenance && (
                    <>
                      <span><i class="dot green"></i> Maintenance</span>
                    </>
                  )}
                  {graphViewMode.value === "extended" && extendedLegendVisibility.value.withdrawalFxFinance && (
                    <span><i class="dot pink"></i> Withdrawal/FX/Finance</span>
                  )}
                  <span><i class="dot blue-soft"></i> {t.value.netProfit}</span>
                </div>
                <svg ref={mixChartRef} class="chart chart-medium" />
              </article>
            </div>
            <p class="chart-note">
              {t.value.chartTitle}. {tx.value("chartTail")}
            </p>
          </section>

          <section class="miner-grid dense-grid">
            {minerResults.map((miner) => {
              const price = toLocalCurrency(miner.purchaseUsd);
              const running = toLocalCurrency(miner.runningCost);
              const fee = toLocalCurrency(miner.poolFee);
              const taxes = toLocalCurrency(miner.taxes);
              const gross = toLocalCurrency(miner.grossRevenue);
              const net = toLocalCurrency(miner.netProfit);
              return (
                <article class="card miner-card" key={miner.id}>
                  <div class="miner-top">
                    <h4>{miner.name}</h4>
                    <span class="badge">{miner.hashRate}</span>
                  </div>
                  <div class="provider-summary">
                    <span>{tx.value("originLabel")}: {miner.dataOrigin || tx.value("baselineLabel")}</span>
                    <span>{tx.value("availabilityLabel")}: {availabilityText(miner.availability)}</span>
                    <span>{tx.value("sourceLabel")}: {miner.offerSource || tx.value("catalogLabel")}</span>
                  </div>

                  <div class="stats">
                    <div>
                      <span>{t.value.purchaseCost}</span>
                      <strong>{formatCurrency(price)}</strong>
                    </div>
                    <div>
                      <span>{t.value.runningCost}</span>
                      <strong>{formatCurrency(running)}</strong>
                    </div>
                    <div>
                      <span>{t.value.poolFee}</span>
                      <strong>{formatCurrency(fee)}</strong>
                    </div>
                    <div>
                      <span>{t.value.taxes}</span>
                      <strong>{formatCurrency(taxes)}</strong>
                    </div>
                    <div>
                      <span>{t.value.grossRevenue}</span>
                      <strong>{formatCurrency(gross)}</strong>
                    </div>
                    <div>
                      <span>{t.value.netProfit}</span>
                      <strong class={miner.netProfit >= 0 ? "profit" : "loss"}>
                        {formatCurrency(net)} {t.value.perMonth}
                      </strong>
                    </div>
                    <div>
                      <span>{t.value.roiMonths}</span>
                      <strong>
                        {miner.roiMonths ? `${miner.roiMonths.toFixed(1)} ${tx.value("monthsLabel")}` : tx.value("notProfitableLabel")}
                      </strong>
                    </div>
                  </div>

                  <a class="btn" href={safeExternalUrl(miner.buyUrl)} target="_blank" rel="noreferrer">
                    {t.value.buy}
                  </a>
                </article>
              );
            })}
          </section>
        </>
      )}

      <section id="seo-faq" class="card section-flow">
        <h2>Mining profitability calculator FAQ</h2>
        <article>
          <h3>How is crypto mining profit estimated?</h3>
          <p>
            Monthly profitability is calculated from projected mining revenue minus electricity,
            pool fees, tax, and operating costs. The tool then estimates ROI from hardware cost
            and expected monthly net profit.
          </p>
        </article>
        <article>
          <h3>Can I compare ASIC miners by coin and country?</h3>
          <p>
            Yes. You can compare miners across popular mineable coins and apply local electricity
            and tax assumptions to identify the best fit for your region and budget.
          </p>
        </article>
        <article>
          <h3>Why do profitability results change over time?</h3>
          <p>
            Mining profit moves with coin price, network difficulty, fees, and power costs. Review
            your calculations regularly and update assumptions when market conditions change.
          </p>
        </article>
      </section>

      <section id="provider-health" class="card section-flow provider-footer">
        <div class="health-header">
          <h3>{tx.value("providerHealthTitle")}</h3>
          <div class="results-actions-buttons">
            <button class="btn btn-ghost" onClick$={() => (technicalExpanded.value = !technicalExpanded.value)}>
              {technicalExpanded.value ? tx.value("hideTechnicalDetails") : tx.value("showTechnicalDetails")}
            </button>
            <button class="btn btn-ghost" onClick$={() => (providerRefreshTick.value += 1)}>
              {tx.value("recheck")}
            </button>
          </div>
        </div>
        <div class="provider-footer-top">
          <span>{tx.value("overallLabel")}:</span>
          <span
            class={`badge-health ${
              providerOverall.value === "healthy"
                ? "ok"
                : providerOverall.value === "partial"
                  ? "warn"
                  : providerOverall.value === "checking"
                    ? "checking"
                    : "down"
            }`}
          >
            {providerStatusText(providerOverall.value)}
          </span>
          {providerCheckedAt.value && (
            <small>{tx.value("checkedLabel")} {new Date(providerCheckedAt.value).toLocaleTimeString()}</small>
          )}
          {providerOverall.value === "checking" && (
            <span class="loader-row">
              <span class="loader-inline" aria-hidden="true" />
              {tx.value("checkingProviders")}
            </span>
          )}
        </div>
        {technicalExpanded.value && providerError.value && <p class="loss">{providerError.value}</p>}
        {technicalExpanded.value && providerHealth.value.length > 0 && (
          <div class="health-list compact">
            {providerHealth.value.map((item) => (
              <div key={item.provider} class="health-item">
                <strong>{item.provider}</strong>
                <span
                  class={`badge-health ${
                    item.status === "ok" ? "ok" : item.status === "missing" ? "warn" : "down"
                  }`}
                >
                  {providerItemStatusText(item.status)}
                </span>
              </div>
            ))}
          </div>
        )}
        <p class="credit-note">
          {copyrightFooterText} - {tx.value("madeBy")}{" "}
          <a href="https://solutions.gabo.rocks" target="_blank" rel="noopener noreferrer">
            GABO
          </a>
        </p>
      </section>
    </main>
  );
});

export const head: DocumentHead = {
  title: "Crypto Mining Profitability Calculator (ASIC & GPU) | Mining Profit Lab",
  meta: [
    {
      name: "description",
      content:
        "Estimate Bitcoin and altcoin mining profits with live data, country-based electricity and tax inputs, ASIC/GPU comparisons, and ROI projections.",
    },
    {
      name: "keywords",
      content:
        "mining profitability calculator, bitcoin mining calculator, asic miner roi, crypto mining profit, gpu mining calculator, mining electricity cost",
    },
    {
      name: "author",
      content: "Mining Profit Lab",
    },
    {
      name: "theme-color",
      content: "#0b1220",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:site_name",
      content: "Mining Profit Lab",
    },
    {
      property: "og:title",
      content: "Crypto Mining Profitability Calculator (ASIC & GPU)",
    },
    {
      property: "og:description",
      content:
        "Compare miners, estimate net monthly mining profit, and model ROI with local electricity and tax assumptions.",
    },
    {
      property: "og:image",
      content: "/og-image.svg",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "Crypto Mining Profitability Calculator (ASIC & GPU)",
    },
    {
      name: "twitter:description",
      content:
        "Analyze crypto mining profitability using local costs, miner comparisons, and return-on-investment estimates.",
    },
    {
      name: "twitter:image",
      content: "/og-image.svg",
    },
  ],
  links: [
    {
      rel: "preconnect",
      href: "https://api.coinpaprika.com",
      key: "coinpaprika-preconnect",
    },
  ],
};
