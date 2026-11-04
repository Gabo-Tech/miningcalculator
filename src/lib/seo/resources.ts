import { SITE_ORIGIN, absoluteUrl } from "./site";

export const EMBED_PATH = "/embed/";
export const EMBED_PAGE_PATH = "/embed-calculator/";
export const INDEX_PATH = "/bitcoin-mining-profitability-index/";

export const INDEX_TITLE = "Bitcoin Mining Profitability Index | Mining Profit Lab";
export const INDEX_DESCRIPTION =
  "Current Bitcoin ASIC revenue, power cost, profit, and break-even electricity price from live network difficulty, block rewards, and the CoinPaprika BTC price.";

export const EMBED_PAGE_TITLE = "Embed a Mining Profit Calculator | Mining Profit Lab";
export const EMBED_PAGE_DESCRIPTION =
  "Add a free mining profit calculator to your site. Copy an iframe with a live preview, theme and size options, no cookies or trackers, and a followed credit link.";

export const EMBED_THEMES = ["auto", "light", "dark"] as const;
export type EmbedTheme = (typeof EMBED_THEMES)[number];

export const EMBED_SIZES = [
  { id: "compact", label: "Compact", maxWidth: 360, height: 640 },
  { id: "standard", label: "Standard", maxWidth: 420, height: 640 },
  { id: "wide", label: "Wide", maxWidth: 680, height: 640 },
] as const;

export type EmbedSize = (typeof EMBED_SIZES)[number];

export function isEmbedTheme(value: string | null): value is EmbedTheme {
  return value === "auto" || value === "light" || value === "dark";
}

export function embedFrameSrc(theme: EmbedTheme, origin = SITE_ORIGIN): string {
  const url = new URL(EMBED_PATH, origin);
  url.searchParams.set("theme", theme);
  return url.href;
}

export function embedPreviewPath(theme: EmbedTheme): string {
  return `/embed/?theme=${theme}`;
}

/**
 * Snippet site owners paste. The credit link is plain HTML outside the iframe
 * and has no rel attribute, so it stays a followed link.
 */
export function buildEmbedSnippet(theme: EmbedTheme, size: Pick<EmbedSize, "maxWidth" | "height">): string {
  const src = embedFrameSrc(theme);
  const iframe = `<iframe src="${src}" title="Mining Profit Lab mining profit calculator" style="width:100%;max-width:${size.maxWidth}px;height:${size.height}px;border:0;" loading="lazy" referrerpolicy="no-referrer"></iframe>`;
  const credit = `<p>Powered by <a href="${absoluteUrl("/")}">Mining Profit Lab</a></p>`;
  return `${iframe}\n${credit}`;
}

export function buildCitationHtml(): string {
  const indexUrl = absoluteUrl(INDEX_PATH);
  const home = absoluteUrl("/");
  return `<p>Data from the <a href="${indexUrl}">Bitcoin Mining Profitability Index</a> by <a href="${home}">Mining Profit Lab</a>.</p>`;
}
