type ChromiumApi = {
  launch: (options: { headless: boolean }) => Promise<any>;
};

type SearchResult = {
  title: string;
  snippet: string;
  link: string;
};

export type CrawledOffer = {
  source: string;
  url: string;
  title: string;
  priceUsd: number | null;
  availability: "in_stock" | "out_of_stock" | "unknown";
  confidence: number;
};

type CrawlAdapter = {
  id: string;
  domains: string[];
  extract: (url: string, title: string, bodyText: string) => CrawledOffer;
};

const parsePriceFromText = (text: string): number | null => {
  const match = text.match(/\$ ?([0-9]{2,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?)/);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
};

const parseAvailability = (text: string): CrawledOffer["availability"] => {
  if (/(out of stock|sold out|unavailable)/i.test(text)) return "out_of_stock";
  if (/(in stock|available now|ready to ship|ships)/i.test(text)) return "in_stock";
  return "unknown";
};

const adapters: CrawlAdapter[] = [
  {
    id: "asicminervalue",
    domains: ["asicminervalue.com", "www.asicminervalue.com"],
    extract: (url, title, bodyText) => ({
      source: "asicminervalue",
      url,
      title,
      priceUsd: parsePriceFromText(bodyText),
      availability: parseAvailability(bodyText),
      confidence: 0.7,
    }),
  },
  {
    id: "kaboomracks",
    domains: ["kaboomracks.com", "www.kaboomracks.com"],
    extract: (url, title, bodyText) => ({
      source: "kaboomracks",
      url,
      title,
      priceUsd: parsePriceFromText(bodyText),
      availability: parseAvailability(bodyText),
      confidence: 0.72,
    }),
  },
  {
    id: "bt-miners",
    domains: ["bt-miners.com", "www.bt-miners.com"],
    extract: (url, title, bodyText) => ({
      source: "bt-miners",
      url,
      title,
      priceUsd: parsePriceFromText(bodyText),
      availability: parseAvailability(bodyText),
      confidence: 0.68,
    }),
  },
];

const pickAdapter = (hostname: string): CrawlAdapter | null => {
  const normalized = hostname.toLowerCase();
  return adapters.find((adapter) => adapter.domains.includes(normalized)) || null;
};

const sanitizeForMatch = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const loadChromium = async (): Promise<ChromiumApi | null> => {
  try {
    const playwright = (await import("playwright")) as unknown as { chromium?: ChromiumApi };
    return playwright.chromium || null;
  } catch {
    return null;
  }
};

export const minerNameMatchesOffer = (minerName: string, offerTitle: string): boolean => {
  const minerTokens = sanitizeForMatch(minerName)
    .split(" ")
    .filter((token) => token.length >= 3)
    .slice(0, 4);
  const titleNorm = sanitizeForMatch(offerTitle);
  return minerTokens.some((token) => titleNorm.includes(token));
};

export const crawlOffersFromSearchResults = async (
  results: SearchResult[],
  maxUrls = 5,
): Promise<CrawledOffer[]> => {
  const trusted = results
    .slice(0, maxUrls)
    .map((result) => {
      try {
        const parsed = new URL(result.link);
        return { ...result, hostname: parsed.hostname };
      } catch {
        return null;
      }
    })
    .filter((item): item is SearchResult & { hostname: string } => !!item)
    .filter((item) => pickAdapter(item.hostname) !== null);

  if (!trusted.length) return [];

  const chromium = await loadChromium();
  if (!chromium) return [];

  let browser: Awaited<ReturnType<ChromiumApi["launch"]>> | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const offers: CrawledOffer[] = [];

    for (const item of trusted) {
      const adapter = pickAdapter(item.hostname);
      if (!adapter) continue;

      const page = await browser.newPage();
      try {
        await page.goto(item.link, { waitUntil: "domcontentloaded", timeout: 12000 });
        const title = (await page.title()) || item.title;
        const bodyText = await page.locator("body").innerText({ timeout: 4000 });
        offers.push(adapter.extract(item.link, title, bodyText || item.snippet));
      } catch {
      } finally {
        await page.close();
      }
    }
    return offers;
  } catch {
    return [];
  } finally {
    if (browser) await browser.close();
  }
};

export const getCrawlerHealth = async (): Promise<{
  provider: "crawler";
  status: "ok" | "error";
  detail: string;
}> => {
  const chromium = await loadChromium();
  if (!chromium) {
    return {
      provider: "crawler",
      status: "error",
      detail: "Playwright unavailable: package not available in current runtime",
    };
  }

  try {
    await chromium.launch({ headless: true }).then((browser) => browser.close());
    return { provider: "crawler", status: "ok", detail: "Playwright Chromium available" };
  } catch (error) {
    return {
      provider: "crawler",
      status: "error",
      detail:
        error instanceof Error
          ? `Playwright unavailable: ${error.message}`
          : "Playwright unavailable",
    };
  }
};

