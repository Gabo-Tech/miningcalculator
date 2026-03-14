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

const htmlToText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();

const extractTitleFromHtml = (html: string): string | null => {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match?.[1]) return null;
  return htmlToText(match[1]);
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
  const offers: CrawledOffer[] = [];

  for (const item of trusted) {
    const adapter = pickAdapter(item.hostname);
    if (!adapter) continue;

    try {
      const response = await fetch(item.link, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; MinerProfitabilityCalculatorBot/1.0; +https://example.com/bot)",
        },
      });
      if (!response.ok) continue;
      const html = await response.text();
      const title = extractTitleFromHtml(html) || item.title;
      const bodyText = htmlToText(html);
      offers.push(adapter.extract(item.link, title, bodyText || item.snippet));
    } catch {
    }
  }

  return offers;
};

export const getCrawlerHealth = async (): Promise<{
  provider: "crawler";
  status: "ok" | "error";
  detail: string;
}> => {
  return {
    provider: "crawler",
    status: "ok",
    detail: "HTTP crawler available",
  };
};

