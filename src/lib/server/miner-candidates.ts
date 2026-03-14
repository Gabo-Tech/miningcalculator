export type MinerCandidate = {
  id: string;
  name: string;
  coin: string;
  hashRate: string;
  powerWatts: number;
  purchaseUsd: number;
  revenuePerDayUsd: number;
  poolFeePct: number;
  buyUrl: string;
  category: "asic" | "gpu" | "cpu" | "server" | "laptop";
  dataOrigin?: "baseline" | "search_enriched" | "crawler_enriched";
  offerSource?: string;
  availability?: "in_stock" | "out_of_stock" | "unknown";
};

export const BASE_MINER_CANDIDATES: MinerCandidate[] = [
  {
    id: "s21-pro",
    name: "Antminer S21 Pro",
    coin: "BTC",
    hashRate: "234 TH/s",
    powerWatts: 3510,
    purchaseUsd: 4400,
    revenuePerDayUsd: 13.2,
    poolFeePct: 1,
    buyUrl: "https://bt-miners.com/search.php?search_query=Antminer+S21+Pro",
    category: "asic",
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
    buyUrl: "https://www.kaboomracks.com/?s=WhatsMiner+M60S&post_type=product",
    category: "asic",
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
    buyUrl: "https://bt-miners.com/search.php?search_query=Antminer+L9",
    category: "asic",
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
    buyUrl: "https://bt-miners.com/search.php?search_query=Elphapex+DG1",
    category: "asic",
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
    buyUrl: "https://bt-miners.com/search.php?search_query=IceRiver+KS5+Pro",
    category: "asic",
  },
  {
    id: "x16-q-pro",
    name: "Jasminer X16-Q Pro",
    coin: "ETC",
    hashRate: "2.05 GH/s",
    powerWatts: 520,
    purchaseUsd: 3200,
    revenuePerDayUsd: 4.6,
    poolFeePct: 1.5,
    buyUrl: "https://bt-miners.com/search.php?search_query=Jasminer+X16-Q+Pro",
    category: "asic",
  },
  {
    id: "xmr-7950x",
    name: "Ryzen 9 7950X Rig",
    coin: "XMR",
    hashRate: "23 kH/s",
    powerWatts: 210,
    purchaseUsd: 1200,
    revenuePerDayUsd: 1.65,
    poolFeePct: 1,
    buyUrl: "https://pcpartpicker.com/search/?q=Ryzen+9+7950X",
    category: "cpu",
  },
  {
    id: "xmr-epyc-7b13",
    name: "EPYC 7B13 Used Server",
    coin: "XMR",
    hashRate: "33 kH/s",
    powerWatts: 320,
    purchaseUsd: 1850,
    revenuePerDayUsd: 2.3,
    poolFeePct: 1,
    buyUrl: "https://www.ebay.com/sch/i.html?_nkw=EPYC+7B13+server",
    category: "server",
  },
  {
    id: "xmr-7840hs",
    name: "Ryzen 7 7840HS Laptop",
    coin: "XMR",
    hashRate: "8 kH/s",
    powerWatts: 70,
    purchaseUsd: 950,
    revenuePerDayUsd: 0.62,
    poolFeePct: 1,
    buyUrl: "https://www.amazon.com/s?k=Ryzen+7+7840HS+laptop",
    category: "laptop",
  },
];

