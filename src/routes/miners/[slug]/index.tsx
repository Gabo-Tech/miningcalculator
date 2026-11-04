import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { GuideLayout } from "../../../components/guide-layout/guide-layout";
import {
  MINER_GUIDES,
  getMinerGuide,
  illustrativeMonthlyPower,
  money,
} from "../../../lib/seo/guides";
import { buildGuideStructuredData, pageMeta } from "../../../lib/seo/site";

export const useMinerGuide = routeLoader$(({ params, status }) => {
  const guide = getMinerGuide(params.slug);
  if (!guide) status(404);
  return guide;
});

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: MINER_GUIDES.map((guide) => ({ slug: guide.slug })),
  };
};

export default component$(() => {
  const loaded = useMinerGuide();
  const page = loaded.value;
  if (!page) {
    return (
      <GuideLayout title="Guide not found" eyebrow="Mining Profit Lab">
        <p>That miner guide is not part of the calculator catalog.</p>
        <p>
          <a class="btn" href="/">
            Back to the profitability calculator
          </a>
        </p>
      </GuideLayout>
    );
  }

  const miner = page.miner;
  const power = illustrativeMonthlyPower(miner.powerWatts);
  const coinName = page.coin?.name ?? miner.coin;
  const structuredData = buildGuideStructuredData({
    pathname: page.pathname,
    title: page.title,
    description: page.description,
    faqs: page.faqs,
    breadcrumbs: [
      { name: "Mining Profit Lab", pathname: "/" },
      ...(page.coin
        ? [{ name: `${page.coin.name} mining`, pathname: page.coin.pathname }]
        : []),
      { name: miner.name, pathname: page.pathname },
    ],
  });

  return (
    <GuideLayout title={page.h1} eyebrow={`${miner.name} · ${coinName}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData}
      />
      <p>{page.intro}</p>
      <p>
        Baseline daily revenue is {money(miner.revenuePerDayUsd)} before
        electricity, the {miner.poolFeePct}% pool fee, and tax. A 30-day
        illustration at ${power.ratePerKwh.toFixed(2)}
        /kWh is about {Math.round(power.kwh).toLocaleString("en-US")} kWh, or{" "}
        {money(power.costUsd)} in power alone.
      </p>
      <div class="table-scroll">
        <table class="spec-table">
          <tbody>
            <tr>
              <th>Coin</th>
              <td>
                {page.coin ? (
                  <a href={page.coin.pathname}>
                    {coinName} mining profitability
                  </a>
                ) : (
                  coinName
                )}
              </td>
            </tr>
            <tr>
              <th>Hashrate</th>
              <td>{miner.hashRate}</td>
            </tr>
            <tr>
              <th>Power</th>
              <td>{miner.powerWatts.toLocaleString("en-US")} W</td>
            </tr>
            <tr>
              <th>Baseline purchase</th>
              <td>{money(miner.purchaseUsd)}</td>
            </tr>
            <tr>
              <th>Baseline revenue</th>
              <td>{money(miner.revenuePerDayUsd)} / day</td>
            </tr>
            <tr>
              <th>Catalog pool fee</th>
              <td>{miner.poolFeePct}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2>{miner.name} FAQ</h2>
      {page.faqs.map((faq) => (
        <article key={faq.question}>
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
        </article>
      ))}
      <p class="chart-note">
        These specs match the calculator's built-in catalog. Live price,
        difficulty, and your electricity contract replace this illustration once
        you run an analysis.
      </p>
      <div class="guide-actions">
        <a class="btn" href="/#onboarding-form">
          Estimate {miner.name} profit
        </a>
        {page.coin && (
          <a class="btn btn-ghost" href={page.coin.pathname}>
            {coinName} guide
          </a>
        )}
      </div>
    </GuideLayout>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const guide = resolveValue(useMinerGuide);
  if (!guide) {
    return {
      title: "Guide not found | Mining Profit Lab",
      meta: [{ name: "robots", content: "noindex", key: "robots-noindex" }],
    };
  }
  return pageMeta({
    title: guide.title,
    description: guide.description,
    pathname: guide.pathname,
  });
};
