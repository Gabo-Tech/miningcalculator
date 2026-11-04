export type CatalogCrypto = {
  symbol: string;
  name: string;
  minable: boolean | null;
};

export type CatalogMiner = {
  id: string;
  name: string;
  coin: string;
  hashRate: string;
  powerWatts: number;
  purchaseUsd: number;
  revenuePerDayUsd: number;
  poolFeePct: number;
  buyUrl: string;
};

export const CRYPTOS: CatalogCrypto[] = [
  { symbol: "BTC", name: "Bitcoin", minable: true },
  { symbol: "LTC", name: "Litecoin", minable: true },
  { symbol: "DOGE", name: "Dogecoin", minable: true },
  { symbol: "KAS", name: "Kaspa", minable: true },
  { symbol: "ETC", name: "Ethereum Classic", minable: true },
  { symbol: "XMR", name: "Monero", minable: true },
  { symbol: "ETH", name: "Ethereum", minable: false },
  { symbol: "XRP", name: "XRP", minable: false },
  { symbol: "SOL", name: "Solana", minable: false },
  { symbol: "ADA", name: "Cardano", minable: false },
];

export const REFERENCE_COIN_PRICE_USD: Record<string, number> = {
  BTC: 65000,
  LTC: 80,
  DOGE: 0.12,
  KAS: 0.13,
  ETC: 30,
  XMR: 130,
};

export const MINERS: CatalogMiner[] = [
  {
    id: "s21-pro",
    name: "Antminer S21 Pro",
    coin: "BTC",
    hashRate: "234 TH/s",
    powerWatts: 3510,
    purchaseUsd: 4400,
    revenuePerDayUsd: 13.2,
    poolFeePct: 1,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "m60s",
    name: "WhatsMiner M60S+",
    coin: "BTC",
    hashRate: "226 TH/s",
    powerWatts: 3400,
    purchaseUsd: 4200,
    revenuePerDayUsd: 12.8,
    poolFeePct: 1.5,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "l9",
    name: "Antminer L9",
    coin: "LTC",
    hashRate: "17 GH/s",
    powerWatts: 3360,
    purchaseUsd: 8800,
    revenuePerDayUsd: 20.1,
    poolFeePct: 2,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "dg1-plus",
    name: "Elphapex DG1+",
    coin: "DOGE",
    hashRate: "14 GH/s",
    powerWatts: 3920,
    purchaseUsd: 6900,
    revenuePerDayUsd: 15.6,
    poolFeePct: 2,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "ks5-pro",
    name: "IceRiver KS5 Pro",
    coin: "KAS",
    hashRate: "21 TH/s",
    powerWatts: 3150,
    purchaseUsd: 14500,
    revenuePerDayUsd: 24.3,
    poolFeePct: 1,
    buyUrl: "https://www.asicminervalue.com/",
  },
  {
    id: "e9-pro",
    name: "Jasminer X16-Q Pro",
    coin: "ETC",
    hashRate: "2.05 GH/s",
    powerWatts: 520,
    purchaseUsd: 3200,
    revenuePerDayUsd: 4.6,
    poolFeePct: 1.5,
    buyUrl: "https://www.asicminervalue.com/",
  },
];
