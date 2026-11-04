import { component$, useSignal } from "@builder.io/qwik";
import {
  routeLoader$,
  useLocation,
  type DocumentHead,
  type RequestHandler,
} from "@builder.io/qwik-city";
import {
  DEFAULT_EMBED_ELECTRICITY_USD,
  dailyPowerCostUsd,
  formatAsOfUtc,
  formatBreakEven,
  formatBtc,
  formatUsd,
  profitTone,
  type BtcMarketResult,
} from "../../lib/mining/btc-profit";
import { absoluteUrl } from "../../lib/seo/site";
import { isEmbedTheme } from "../../lib/seo/resources";

export const onRequest: RequestHandler = ({ headers }) => {
  headers.set("Content-Security-Policy", "frame-ancestors *");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Cache-Control", "public, max-age=120, s-maxage=120");
};

export const useBtcMarket = routeLoader$(async ({ env }) => {
  const { loadBtcMarketSnapshot } = await import("../../lib/server/btc-market");
  return loadBtcMarketSnapshot(env) as Promise<BtcMarketResult>;
});

const clampElectricity = (value: number): number => {
  if (!Number.isFinite(value)) return DEFAULT_EMBED_ELECTRICITY_USD;
  return Math.min(2, Math.max(0, value));
};

export default component$(() => {
  const market = useBtcMarket();
  const loc = useLocation();
  const themeParam = loc.url.searchParams.get("theme");
  const theme = isEmbedTheme(themeParam) ? themeParam : "auto";
  const requestedMiner = loc.url.searchParams.get("miner") ?? "";
  const initialElectricity = clampElectricity(
    Number(
      loc.url.searchParams.get("electricity") ?? DEFAULT_EMBED_ELECTRICITY_USD,
    ),
  );
  const electricityText = useSignal(String(initialElectricity));
  const minerId = useSignal(requestedMiner);
  const result = market.value;
  const miners = result.ok ? result.snapshot.miners : [];
  const selected =
    miners.find((miner) => miner.id === minerId.value) ?? miners[0];
  const electricity = clampElectricity(Number(electricityText.value));
  const dailyCost = selected
    ? dailyPowerCostUsd(selected.powerWatts, electricity)
    : 0;
  const dailyProfit = selected ? selected.dailyRevenueUsd - dailyCost : 0;

  return (
    <main class={`embed-app theme-${theme}`}>
      <article class="card embed-card">
        <h1>Bitcoin mining profit</h1>
        {!result.ok && <p class="embed-note">{result.error}</p>}
        {result.ok && selected && (
          <>
            <p class="data-as-of">
              Data as of {formatAsOfUtc(result.snapshot.fetchedAt)}
            </p>
            <label>
              <span>Miner</span>
              <select
                value={selected.id}
                onChange$={(_, el) => {
                  minerId.value = el.value;
                }}
              >
                {miners.map((miner) => (
                  <option key={miner.id} value={miner.id}>
                    {miner.name}
                  </option>
                ))}
              </select>
            </label>
            <p class="embed-note">
              {selected.hashRateLabel} ·{" "}
              {selected.powerWatts.toLocaleString("en-US")} W ·{" "}
              {selected.poolFeePct}% pool fee · BTC{" "}
              {formatUsd(result.snapshot.btcPriceUsd)}
            </p>
            <label>
              <span>Electricity price (USD per kWh)</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={2}
                step={0.01}
                value={electricityText.value}
                onInput$={(_, el) => {
                  electricityText.value = el.value;
                }}
              />
            </label>
            <div class="embed-metrics">
              <div>
                <span>Daily revenue</span>
                <strong>{formatUsd(selected.dailyRevenueUsd)}</strong>
              </div>
              <div>
                <span>Daily power cost</span>
                <strong>{formatUsd(dailyCost)}</strong>
              </div>
              <div>
                <span>Daily profit</span>
                <strong class={profitTone(dailyProfit)}>
                  {formatUsd(dailyProfit)}
                </strong>
              </div>
              <div>
                <span>30-day profit</span>
                <strong class={profitTone(dailyProfit)}>
                  {formatUsd(dailyProfit * 30)}
                </strong>
              </div>
            </div>
            <p class="embed-break-even">
              Break-even electricity{" "}
              <strong>{formatBreakEven(selected.breakEvenUsdPerKwh)}</strong>
            </p>
            <p class="embed-note">
              {formatBtc(selected.dailyBtcAfterPool)} per day after the pool
              fee. Expected value from the current Bitcoin network. Hardware
              cost, tax, and downtime are not included.
            </p>
          </>
        )}
        <p class="embed-powered">
          <a href={absoluteUrl("/")} target="_blank" rel="noopener">
            Powered by Mining Profit Lab
          </a>
        </p>
      </article>
    </main>
  );
});

export const head: DocumentHead = ({ url }) => {
  const theme = url.searchParams.get("theme");
  const colorScheme =
    theme === "light" ? "light" : theme === "dark" ? "dark" : "dark light";
  return {
    title: "Bitcoin mining profit calculator embed",
    meta: [
      { name: "robots", content: "noindex, follow", key: "robots" },
      { name: "color-scheme", content: colorScheme, key: "color-scheme" },
    ],
  };
};
