import type { RequestHandler } from "@builder.io/qwik-city";
import { BASE_MINER_CANDIDATES } from "~/lib/server/miner-candidates";
import { limitNumber, limitString, rateLimit, sanitizePublicError } from "~/lib/server/security";
import { getCoinPriceUsd, getMinerCandidates } from "~/lib/server/services";

const REFERENCE_COIN_PRICE_USD: Record<string, number> = {
  BTC: 65000,
  LTC: 80,
  DOGE: 0.12,
  KAS: 0.13,
  ETC: 30,
  XMR: 130,
};

type BestCoinPayload = {
  country?: string;
  electricityPrice?: number;
  taxRate?: number;
  mode?: "raw" | "risk_adjusted";
};

const COIN_VOLATILITY_PENALTY: Record<string, number> = {
  BTC: 0.12,
  LTC: 0.2,
  DOGE: 0.34,
  KAS: 0.42,
  ETC: 0.3,
  XMR: 0.24,
};

export const onPost: RequestHandler = async ({ json, parseBody, request }) => {
  const limited = await rateLimit(request.headers, {
    keyPrefix: "best-coin",
    max: 16,
    windowSeconds: 60,
  });
  if (!limited.allowed) {
    json(429, { error: "rate_limited", retryAfterSec: limited.retryAfterSec });
    return;
  }

  let payload: BestCoinPayload;
  try {
    payload = (await parseBody()) as BestCoinPayload;
  } catch {
    json(400, { error: "Invalid JSON payload" });
    return;
  }

  const country = limitString(payload.country, { fallback: "global", maxLength: 80 });
  const electricityPrice = limitNumber(payload.electricityPrice, { fallback: 0.2, min: 0, max: 2 });
  const taxRate = limitNumber(payload.taxRate, { fallback: 0.2, min: 0, max: 1 });
  const mode = payload.mode === "risk_adjusted" ? "risk_adjusted" : "raw";

  try {
    const candidateSymbols = Array.from(new Set(BASE_MINER_CANDIDATES.map((m) => m.coin)));
    const rows: Array<{
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
    }> = [];

    for (const symbol of candidateSymbols) {
      const [coinPriceUsd, minerData] = await Promise.all([
        getCoinPriceUsd(symbol),
        getMinerCandidates(symbol, country),
      ]);
      const miners = minerData.miners || [];
      if (!miners.length) continue;

      const basePrice = REFERENCE_COIN_PRICE_USD[symbol];
      const multiplier = basePrice && coinPriceUsd ? coinPriceUsd / basePrice : 1;

      let best:
        | {
            name: string;
            net: number;
            gross: number;
            running: number;
            pool: number;
            taxes: number;
          }
        | null = null;

      for (const miner of miners) {
        const grossRevenueUsd = miner.revenuePerDayUsd * 30 * multiplier;
        const runningCostUsd = (miner.powerWatts / 1000) * 24 * 30 * electricityPrice;
        const poolFeeUsd = grossRevenueUsd * (miner.poolFeePct / 100);
        const taxable = Math.max(grossRevenueUsd - runningCostUsd - poolFeeUsd, 0);
        const taxesUsd = taxable * taxRate;
        const netProfitUsd = grossRevenueUsd - runningCostUsd - poolFeeUsd - taxesUsd;

        if (!best || netProfitUsd > best.net) {
          best = {
            name: miner.name,
            net: netProfitUsd,
            gross: grossRevenueUsd,
            running: runningCostUsd,
            pool: poolFeeUsd,
            taxes: taxesUsd,
          };
        }
      }

      if (!best) continue;

      const penaltyPct = COIN_VOLATILITY_PENALTY[symbol] ?? 0.35;
      const scoreUsd = mode === "risk_adjusted" ? best.net * (1 - penaltyPct) : best.net;

      rows.push({
        symbol,
        coinPriceUsd,
        bestMinerName: best.name,
        netProfitUsd: best.net,
        scoreUsd,
        volatilityPenaltyPct: penaltyPct,
        grossRevenueUsd: best.gross,
        runningCostUsd: best.running,
        poolFeeUsd: best.pool,
        taxesUsd: best.taxes,
      });
    }

    rows.sort((a, b) => b.scoreUsd - a.scoreUsd);
    const top = rows[0];
    if (!top) {
      json(200, { best: null, rankings: [] });
      return;
    }

    json(200, {
      best: top,
      rankings: rows.slice(0, 5),
      assumptions: { country, electricityPrice, taxRate, mode },
      ts: Date.now(),
    });
  } catch {
    const safe = sanitizePublicError("best_coin_failed");
    json(safe.status, { best: null, rankings: [], ...safe.payload });
  }
};

