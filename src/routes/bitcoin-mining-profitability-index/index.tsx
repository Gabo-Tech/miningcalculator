import { component$ } from "@builder.io/qwik";
import { routeLoader$, type DocumentHead } from "@builder.io/qwik-city";
import { CopySnippet } from "../../components/copy-snippet/copy-snippet";
import { SiteFooter } from "../../components/site-footer/site-footer";
import { SiteHeader } from "../../components/site-header/site-header";
import {
  buildProfitabilityIndexJsonLd,
  formatAsOfUtc,
  formatBreakEven,
  formatBtc,
  formatDifficulty,
  formatElectricity,
  formatUsd,
  profitTone,
  scenarioAt,
  type BtcMarketResult,
} from "../../lib/mining/btc-profit";
import {
  EMBED_PAGE_PATH,
  INDEX_DESCRIPTION,
  INDEX_PATH,
  INDEX_TITLE,
  buildCitationHtml,
} from "../../lib/seo/resources";
import { absoluteUrl, pageMeta } from "../../lib/seo/site";

export const useProfitabilityIndex = routeLoader$(async ({ env }) => {
  const { loadBtcMarketSnapshot } = await import("../../lib/server/btc-market");
  return loadBtcMarketSnapshot(env) as Promise<BtcMarketResult>;
});

export default component$(() => {
  const loaded = useProfitabilityIndex();
  const result = loaded.value;
  const citation = buildCitationHtml();
  const home = absoluteUrl("/");
  const indexUrl = absoluteUrl(INDEX_PATH);

  return (
    <main class="page guide-page guide-page-wide">
      <SiteHeader />
      <article class="card section-flow">
        <p class="eyebrow">Citable Bitcoin ASIC data</p>
        <h1>Bitcoin Mining Profitability Index</h1>
        {!result.ok && (
          <p>
            {result.error} Refresh in a few minutes. This page does not
            substitute catalog baseline revenue when the live sources are down.
          </p>
        )}
        {result.ok && (
          <>
            <p class="data-as-of">
              Data as of {formatAsOfUtc(result.snapshot.fetchedAt)}
            </p>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={buildProfitabilityIndexJsonLd(
                result.snapshot,
              )}
            />
            <p>
              Daily revenue, electricity cost, profit, and break-even power
              price for the Bitcoin ASICs in the Mining Profit Lab catalog.
              Revenue is calculated from the live network. It does not use the
              catalog&apos;s static daily revenue baseline.
            </p>
            <p>
              Bitcoin {formatUsd(result.snapshot.btcPriceUsd)} · difficulty{" "}
              {formatDifficulty(result.snapshot.difficulty)} · average block
              reward {formatBtc(result.snapshot.avgBlockRewardBtc, 6)} · about{" "}
              {formatUsd(result.snapshot.revenuePerThPerDayUsd, 4)} per TH/s per
              day before pool fees.
            </p>
            <div class="table-scroll">
              <table class="spec-table">
                <caption>Current Bitcoin ASIC profitability</caption>
                <thead>
                  <tr>
                    <th>Miner</th>
                    <th>Hashrate</th>
                    <th class="num">Power</th>
                    <th class="num">Daily revenue</th>
                    <th class="num">Break-even</th>
                    <th class="num">Profit at $0.05/kWh</th>
                    <th class="num">Profit at $0.10/kWh</th>
                  </tr>
                </thead>
                <tbody>
                  {result.snapshot.miners.map((miner) => {
                    const atFive = scenarioAt(miner, 0.05);
                    const atTen = scenarioAt(miner, 0.1);
                    return (
                      <tr key={miner.id}>
                        <td>
                          <a href={`#miner-${miner.id}`}>{miner.name}</a>
                        </td>
                        <td>{miner.hashRateLabel}</td>
                        <td class="num">
                          {miner.powerWatts.toLocaleString("en-US")} W
                        </td>
                        <td class="num">{formatUsd(miner.dailyRevenueUsd)}</td>
                        <td class="num">
                          {formatBreakEven(miner.breakEvenUsdPerKwh)}
                        </td>
                        <td
                          class={`num ${atFive ? profitTone(atFive.dailyProfitUsd) : ""}`}
                        >
                          {atFive ? formatUsd(atFive.dailyProfitUsd) : "n/a"}
                        </td>
                        <td
                          class={`num ${atTen ? profitTone(atTen.dailyProfitUsd) : ""}`}
                        >
                          {atTen ? formatUsd(atTen.dailyProfitUsd) : "n/a"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {result.snapshot.miners.map((miner) => (
              <section key={miner.id} id={`miner-${miner.id}`}>
                <h2>{miner.name}</h2>
                <p>
                  {miner.hashRateLabel} nameplate hashrate,{" "}
                  {miner.powerWatts.toLocaleString("en-US")} W,{" "}
                  {miner.poolFeePct}% pool fee. Expected output is{" "}
                  {formatBtc(miner.dailyBtcBeforePool)} before the pool fee and{" "}
                  {formatBtc(miner.dailyBtcAfterPool)} after it. Daily revenue
                  is {formatUsd(miner.dailyRevenueUsd)}. Break-even electricity
                  is {formatBreakEven(miner.breakEvenUsdPerKwh)}.
                </p>
                <div class="table-scroll">
                  <table class="spec-table">
                    <caption>{miner.name} electricity scenarios</caption>
                    <thead>
                      <tr>
                        <th>Electricity price</th>
                        <th class="num">Daily power cost</th>
                        <th class="num">Daily profit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {miner.scenarios.map((scenario) => (
                        <tr key={scenario.electricityUsdPerKwh}>
                          <td>
                            {formatElectricity(scenario.electricityUsdPerKwh)}
                          </td>
                          <td class="num">
                            {formatUsd(scenario.dailyCostUsd)}
                          </td>
                          <td
                            class={`num ${profitTone(scenario.dailyProfitUsd)}`}
                          >
                            {formatUsd(scenario.dailyProfitUsd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}
            {!result.snapshot.blockRewardIncludesFees && (
              <p>
                This snapshot uses the block subsidy only. Transaction fees are
                not in the revenue figure.
              </p>
            )}
          </>
        )}
      </article>

      <article class="card section-flow" id="methodology">
        <h2>Methodology</h2>
        <p>
          Profit is an expected value for a miner that runs at its nameplate
          hashrate for a full day. It is not a promised payout. Luck, downtime,
          orphan blocks, hardware cost, cooling, maintenance, and taxes are left
          out.
        </p>
        <pre class="formula">
          <code>
            {`BTC/day before pool fees = hashrate_Hs × 86,400 × average_block_reward_BTC / (difficulty × 2^32)
Daily revenue USD = BTC/day × (1 − pool_fee) × BTC price USD
Daily power cost = (watts / 1,000) × 24 × electricity price
Daily profit = daily revenue − daily power cost
Break-even electricity = daily revenue / ((watts / 1,000) × 24)`}
          </code>
        </pre>
        <p>
          Hashrate, watts, and pool fee come from the Bitcoin ASICs already
          shipped in the Mining Profit Lab calculator catalog. The
          catalog&apos;s stored daily revenue number is not used. Electricity
          rows are scenario rates for comparison, not a tariff for a specific
          country. Figures are cached for about 10 minutes, and the stamp above
          is the time the sources were read.
        </p>
        <p>
          The preferred price source is the public CoinPaprika{" "}
          <code>btc-bitcoin</code> ticker, the same endpoint the calculator
          calls. Difficulty and the average block reward prefer mempool.space:
          current difficulty, and the mean <code>totalReward</code> over the
          latest 144 blocks (subsidy plus fees). If a preferred source is
          unreachable, the page uses WhatToMine&apos;s public Bitcoin coin
          endpoint or blockchain.info and names that source below. No API key is
          required.
        </p>
        {result.ok && (
          <>
            {result.snapshot.priceUpdatedAt && (
              <p>
                CoinPaprika last updated{" "}
                {formatAsOfUtc(result.snapshot.priceUpdatedAt)}.
              </p>
            )}
            <h3>Sources for this snapshot</h3>
            <ul class="source-list">
              {result.snapshot.sources.map((source) => (
                <li key={source.url + source.role}>
                  <a href={source.url}>{source.name}</a>
                  <span class="table-note">{source.detail}</span>
                </li>
              ))}
            </ul>
            <p>
              The same numbers are available as JSON at{" "}
              <a href="/api/btc-market">/api/btc-market</a>.
            </p>
          </>
        )}
      </article>

      <article class="card section-flow" id="cite-this-data">
        <h2>Cite this data</h2>
        <p>
          Paste this HTML where you cite the index. It is a normal followed link
          back to this page.
        </p>
        <p>
          Data from the{" "}
          <a href={indexUrl}>Bitcoin Mining Profitability Index</a> by{" "}
          <a href={home}>Mining Profit Lab</a>.
        </p>
        <CopySnippet
          id="citation-snippet"
          label="Citation HTML"
          value={citation}
          buttonLabel="Copy citation HTML"
          rows={3}
        />
        <p class="guide-actions">
          <a class="btn" href="/">
            Open the calculator
          </a>
          <a class="btn btn-ghost" href={EMBED_PAGE_PATH}>
            Embed this calculator
          </a>
        </p>
      </article>
      <SiteFooter />
    </main>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const result = resolveValue(useProfitabilityIndex);
  const base = pageMeta({
    title: INDEX_TITLE,
    description: INDEX_DESCRIPTION,
    pathname: INDEX_PATH,
  });
  if (result.ok) return base;
  return {
    ...base,
    meta: [
      ...(base.meta ?? []),
      { name: "robots", content: "noindex, follow", key: "robots" },
    ],
  };
};
