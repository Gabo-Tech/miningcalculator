export type CountryDefaultsEntry = {
  electricity: number;
  taxRate: number;
  currency: string;
  name: string;
  aliases: string[];
};

export const COUNTRY_DEFAULTS: Record<string, CountryDefaultsEntry> = {
  US: {
    electricity: 0.17,
    taxRate: 0.24,
    currency: "USD",
    name: "United States",
    aliases: ["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA", "AMERICA"],
  },
  CH: {
    electricity: 0.29,
    taxRate: 0.18,
    currency: "CHF",
    name: "Switzerland",
    aliases: ["CH", "SWITZERLAND", "SCHWEIZ", "SUISSE", "SVIZZERA"],
  },
  GB: {
    electricity: 0.31,
    taxRate: 0.22,
    currency: "GBP",
    name: "United Kingdom",
    aliases: ["GB", "UK", "UNITED KINGDOM", "GREAT BRITAIN", "ENGLAND"],
  },
  DE: {
    electricity: 0.35,
    taxRate: 0.3,
    currency: "EUR",
    name: "Germany",
    aliases: ["DE", "GERMANY", "DEUTSCHLAND"],
  },
  FR: {
    electricity: 0.25,
    taxRate: 0.25,
    currency: "EUR",
    name: "France",
    aliases: ["FR", "FRANCE"],
  },
  IN: {
    electricity: 0.09,
    taxRate: 0.15,
    currency: "INR",
    name: "India",
    aliases: ["IN", "INDIA", "BHARAT"],
  },
  CN: {
    electricity: 0.08,
    taxRate: 0.18,
    currency: "CNY",
    name: "China",
    aliases: ["CN", "CHINA", "PRC"],
  },
  BR: {
    electricity: 0.18,
    taxRate: 0.2,
    currency: "BRL",
    name: "Brazil",
    aliases: ["BR", "BRAZIL", "BRASIL"],
  },
  RU: {
    electricity: 0.07,
    taxRate: 0.13,
    currency: "RUB",
    name: "Russia",
    aliases: ["RU", "RUSSIA", "RUSSIAN FEDERATION"],
  },
  NG: {
    electricity: 0.12,
    taxRate: 0.1,
    currency: "NGN",
    name: "Nigeria",
    aliases: ["NG", "NIGERIA"],
  },
  default: {
    electricity: 0.2,
    taxRate: 0.2,
    currency: "USD",
    name: "Global Average",
    aliases: ["DEFAULT", "GLOBAL"],
  },
};

export const COUNTRY_OPTIONS = Object.entries(COUNTRY_DEFAULTS)
  .filter(([code]) => code !== "default")
  .map(([code, meta]) => ({
    code,
    name: meta.name,
  }));

export const CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "CHF",
  "GBP",
  "INR",
  "CNY",
  "BRL",
  "RUB",
  "NGN",
  "JPY",
  "CAD",
  "AUD",
];

const CURRENCY_ALIASES: Record<string, string> = {
  "$": "USD",
  "US$": "USD",
  USD: "USD",
  DOLLAR: "USD",
  DOLLARS: "USD",
  EURO: "EUR",
  EUROS: "EUR",
  EUR: "EUR",
  CHF: "CHF",
  FRANC: "CHF",
  FRANCS: "CHF",
  SWISSFRANC: "CHF",
  SWISSFRANCS: "CHF",
  GBP: "GBP",
  POUND: "GBP",
  POUNDS: "GBP",
};

const normalizeTextKey = (value: string): string =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9$]+/g, "");

export const resolveCurrencySelection = (rawValue: string): string | null => {
  const normalized = normalizeTextKey(rawValue);
  if (!normalized) return null;
  if (CURRENCY_ALIASES[normalized]) return CURRENCY_ALIASES[normalized];
  if (CURRENCY_OPTIONS.includes(normalized)) return normalized;
  return null;
};
