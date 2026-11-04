import { component$ } from "@builder.io/qwik";
import {
  routeLoader$,
  type DocumentHead,
  type StaticGenerateHandler,
} from "@builder.io/qwik-city";
import { GuideLayout } from "../../../components/guide-layout/guide-layout";
import {
  COIN_GUIDES,
  MINER_GUIDES,
  getCoinGuide,
  illustrativeMonthlyPower,
  money,
} from "../../../lib/seo/guides";
import { buildGuideStructuredData, pageMeta } from "../../../lib/seo/site";

export const useCoinGuide = routeLoader$(({ params, status }) => {
  const guide = getCoinGuide(params.slug);
  if (!guide) status(404);
  return guide;
});

export const onStaticGenerate: StaticGenerateHandler = async () => {
  return {
    params: COIN_GUIDES.map((guide) => ({ slug: guide.slug })),
  };
};

export default component$(() => {
  const guide = useCoinGuide();
  const page = guide.value;
  if (!page) {
    return (
      <GuideLayout title="Guide not found" eyebrow="Mining Profit Lab">
        <p>That coin guide is not part of the calculator catalog.</p>
        <p>
          <a class="btn" href="/">
            Back to the profitability calculator
          </a>
        </p>
      </GuideLayout>
    );
  }

  const structuredData = buildGuideStructuredData({
    pathname: page.pathname,
    title: page.title,
    description: page.description,
    faqs: page.faqs,
    breadcrumbs: [
      { name: "Mining Profit Lab", pathname: "/" },
      { name: page.h1, pathname: page.pathname },
    ],
  });

  return (
    <GuideLayout
      title={page.h1}
      eyebrow={`${page.name} · ${page.symbol} · ${page.algorithm}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={structuredData}
      />
      <p>{page.intro}</p>
      <p>{page.description}</p>
      {page.referencePriceUsd !== null && (
        <p>
          The calculator's reference {page.name} price is{" "}
          {money(page.referencePriceUsd)}. When a live price is available,
          revenue baselines scale by the ratio of the live price to that
          reference.
        </p>
      )}
      {page.miners.length > 0 ? (
        <>
          <h2>Reference miners for {page.name}</h2>
          <div class="table-scroll">
            <table class="spec-table">
              <thead>
                <tr>
                  <th>Miner</th>
                  <th>Hashrate</th>
                  <th>Power</th>
                  <th>Baseline purchase</th>
                  <th>Baseline revenue / day</th>
                  <th>Pool fee</th>
                </tr>
              </thead>
              <tbody>
                {page.miners.map((miner) => {
                  const guideLink = MINER_GUIDES.find(
                    (item) => item.miner.id === miner.id,
                  );
                  const power = illustrativeMonthlyPower(miner.powerWatts);
                  return (
                    <tr key={miner.id}>
                      <td>
                        {guideLink ? (
                          <a href={guideLink.pathname}>{miner.name}</a>
                        ) : (
                          miner.name
                        )}
                      </td>
                      <td>{miner.hashRate}</td>
                      <td>
                        {miner.powerWatts.toLocaleString("en-US")} W
                        <span class="table-note">
                          About {Math.round(power.kwh).toLocaleString("en-US")}{" "}
                          kWh / 30 days, {money(power.costUsd)} at $
                          {power.ratePerKwh.toFixed(2)}/kWh
                        </span>
                      </td>
                      <td>{money(miner.purchaseUsd)}</td>
                      <td>{money(miner.revenuePerDayUsd)}</td>
                      <td>{miner.poolFeePct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p>
          No {page.name} machine is stored in the reference catalog. The
          calculator can still search for hardware and rank whatever it finds
          against your electricity and tax inputs.
        </p>
      )}
      <h2>{page.name} mining FAQ</h2>
      {page.faqs.map((faq) => (
        <article key={faq.question}>
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
        </article>
      ))}
      <p class="chart-note">
        Catalog baselines are comparison inputs, not live market quotes. Pool
        fees, difficulty, uptime, cooling, and your own power contract change
        the monthly result.
      </p>
      <div class="guide-actions">
        <a class="btn" href="/#onboarding-form">
          Run the {page.name} calculator
        </a>
        <a class="btn btn-ghost" href="/#coin-guides">
          Other coins
        </a>
      </div>
    </GuideLayout>
  );
});

export const head: DocumentHead = ({ resolveValue }) => {
  const guide = resolveValue(useCoinGuide);
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
