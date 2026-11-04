import type { DocumentHeadValue } from "@builder.io/qwik-city";

export const SITE_ORIGIN = "https://miningcalculator.gabo.rocks";
export const SITE_NAME = "Mining Profit Lab";
export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_URL = `${SITE_ORIGIN}${OG_IMAGE_PATH}`;
export const OG_IMAGE_WIDTH = "1200";
export const OG_IMAGE_HEIGHT = "630";
export const OG_IMAGE_ALT =
  "Mining Profit Lab, a free crypto mining profitability calculator";
export const AUTHOR_NAME = "Gabriel Clemente";
export const AUTHOR_URL = "https://gabo.is-a.dev";

export const SISTER_TOOLS = [
  { name: "Aurelia", href: "https://financetracker.putopulse.org/" },
  { name: "Threadly", href: "https://threadly.putopulse.org/" },
  { name: "Grok Voice", href: "https://gabo-tech.github.io/grok-voice-android/" },
] as const;

export type FaqItem = {
  question: string;
  answer: string;
};

export const HOME_FAQS: FaqItem[] = [
  {
    question: "How is crypto mining profit estimated?",
    answer:
      "Monthly profitability is calculated from projected mining revenue minus electricity, pool fees, tax, and operating costs. The tool then estimates ROI from hardware cost and expected monthly net profit.",
  },
  {
    question: "Can I compare ASIC miners by coin and country?",
    answer:
      "Yes. You can compare miners across popular mineable coins and apply local electricity and tax assumptions to identify the best fit for your region and budget.",
  },
  {
    question: "Why do profitability results change over time?",
    answer:
      "Mining profit moves with coin price, network difficulty, fees, and power costs. Review your calculations regularly and update assumptions when market conditions change.",
  },
];

export const HOME_DESCRIPTION =
  "Estimate Bitcoin and altcoin mining profits with live data, country-based electricity and tax inputs, ASIC/GPU comparisons, and ROI projections.";

export const APP_DESCRIPTION =
  "Free crypto mining profitability calculator with live coin data, country-specific electricity estimates, tax impact, and miner ROI analysis.";

export function absoluteUrl(pathname: string): string {
  let path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const lastSegment = path.split("/").pop() ?? "";
  if (path !== "/" && !path.endsWith("/") && !lastSegment.includes(".")) {
    path = `${path}/`;
  }
  return new URL(path, SITE_ORIGIN).href;
}

export function pageMeta(opts: {
  title: string;
  description: string;
  pathname: string;
}): DocumentHeadValue {
  const url = absoluteUrl(opts.pathname);
  return {
    title: opts.title,
    meta: [
      { name: "description", content: opts.description, key: "description" },
      { property: "og:type", content: "website", key: "og:type" },
      { property: "og:site_name", content: SITE_NAME, key: "og:site_name" },
      { property: "og:locale", content: "en_US", key: "og:locale" },
      { property: "og:title", content: opts.title, key: "og:title" },
      { property: "og:description", content: opts.description, key: "og:description" },
      { property: "og:url", content: url, key: "og:url" },
      { property: "og:image", content: OG_IMAGE_URL, key: "og:image" },
      { property: "og:image:secure_url", content: OG_IMAGE_URL, key: "og:image:secure_url" },
      { property: "og:image:type", content: "image/png", key: "og:image:type" },
      { property: "og:image:width", content: OG_IMAGE_WIDTH, key: "og:image:width" },
      { property: "og:image:height", content: OG_IMAGE_HEIGHT, key: "og:image:height" },
      { property: "og:image:alt", content: OG_IMAGE_ALT, key: "og:image:alt" },
      { name: "twitter:card", content: "summary_large_image", key: "twitter:card" },
      { name: "twitter:title", content: opts.title, key: "twitter:title" },
      { name: "twitter:description", content: opts.description, key: "twitter:description" },
      { name: "twitter:image", content: OG_IMAGE_URL, key: "twitter:image" },
      { name: "twitter:image:alt", content: OG_IMAGE_ALT, key: "twitter:image:alt" },
    ],
  };
}

function faqEntities(faqs: FaqItem[]) {
  return faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  }));
}

export function buildHomeStructuredData(): string {
  const url = absoluteUrl("/");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: SITE_NAME,
        description: HOME_DESCRIPTION,
        inLanguage: "en",
      },
      {
        "@type": ["WebApplication", "SoftwareApplication"],
        "@id": `${url}#app`,
        name: SITE_NAME,
        url,
        applicationCategory: "FinanceApplication",
        applicationSubCategory: "Crypto mining profitability calculator",
        operatingSystem: "Web",
        browserRequirements: "Requires a modern web browser",
        isAccessibleForFree: true,
        description: APP_DESCRIPTION,
        image: OG_IMAGE_URL,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url: `${url}#seo-faq`,
        mainEntity: faqEntities(HOME_FAQS),
      },
    ],
  });
}

export function buildGuideStructuredData(opts: {
  pathname: string;
  title: string;
  description: string;
  faqs: FaqItem[];
  breadcrumbs: Array<{ name: string; pathname: string }>;
}): string {
  const url = absoluteUrl(opts.pathname);
  const home = absoluteUrl("/");
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: opts.title,
        description: opts.description,
        isPartOf: { "@id": `${home}#website` },
        about: { "@id": `${home}#app` },
        primaryImageOfPage: OG_IMAGE_URL,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumbs`,
        itemListElement: opts.breadcrumbs.map((crumb, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: crumb.name,
          item: absoluteUrl(crumb.pathname),
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqEntities(opts.faqs),
      },
    ],
  });
}

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
