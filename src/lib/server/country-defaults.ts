export const COUNTRY_DEFAULTS: Record<
  string,
  { electricity: number; taxRate: number; currency: string }
> = {
  US: { electricity: 0.17, taxRate: 0.24, currency: "USD" },
  CH: { electricity: 0.29, taxRate: 0.18, currency: "CHF" },
  IN: { electricity: 0.09, taxRate: 0.15, currency: "INR" },
  CN: { electricity: 0.08, taxRate: 0.18, currency: "CNY" },
  BR: { electricity: 0.18, taxRate: 0.2, currency: "BRL" },
  RU: { electricity: 0.07, taxRate: 0.13, currency: "RUB" },
  DE: { electricity: 0.35, taxRate: 0.3, currency: "EUR" },
  FR: { electricity: 0.25, taxRate: 0.25, currency: "EUR" },
  GB: { electricity: 0.31, taxRate: 0.22, currency: "GBP" },
  NG: { electricity: 0.12, taxRate: 0.1, currency: "NGN" },
  default: { electricity: 0.2, taxRate: 0.2, currency: "USD" },
};

