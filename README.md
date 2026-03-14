# Miner Profitability Calculator

Qwik-based web app to estimate crypto mining profitability with:
- country and currency-aware defaults
- live/fallback market data
- miner candidate enrichment from web search + crawler sources
- AI recommendations and provider health monitoring

## Tech Stack

- Qwik + Qwik City
- TypeScript
- Vite
- D3 (charts)
- jsPDF (report export)
- Playwright (crawler health/data enrichment)
- Upstash Redis (optional cache + rate-limit backing store)

## Requirements

- Node.js `^18.17.0 || ^20.3.0 || >=21.0.0`
- npm

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Fill in the API keys you need in `.env` (details below).

4. Start development server:

```bash
npm run dev
```

## Environment Variables

Use `.env.example` as the source of truth.

### Core provider keys

- `OPENROUTER_API_KEY` - AI recommendations and operating cost defaults
- `SERPAPI_API_KEY` - web search for miner source discovery
- `IPINFO_TOKEN` - geo profile bootstrap
- `EXCHANGERATE_API_KEY` - USD FX conversion
- `COINPAPRIKA_API_KEY` - optional, CoinPaprika can run on public tier

### Optional cache backend

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

If Redis is not configured, the app falls back to in-memory cache/rate limiting where applicable.

### Provider base URLs

- `COINPAPRIKA_BASE_URL` (default: `https://api.coinpaprika.com/v1`)
- `SERPAPI_BASE_URL` (default: `https://serpapi.com/search`)
- `IPINFO_BASE_URL` (default: `https://ipinfo.io`)
- `EXCHANGERATE_BASE_URL` (default: `https://v6.exchangerate-api.com/v6`)

## Available Scripts

- `npm run dev` - run SSR dev server
- `npm run start` - start SSR mode with browser open
- `npm run build` - full build (types + client + lint)
- `npm run preview` - build + preview production build
- `npm run lint` - lint `src/**/*.ts*`
- `npm run fmt` - format with Prettier
- `npm run fmt.check` - check formatting

## Project Structure

- `src/routes/index.tsx` - main UI and profitability flow
- `src/routes/api/*` - backend endpoints used by UI
- `src/lib/server/services.ts` - provider integrations, enrichment, fallback logic
- `src/lib/server/cache.ts` - in-memory + Upstash caching helpers
- `src/lib/server/security.ts` - input limits, sanitization, rate limiting
- `src/lib/i18n/translations.ts` - all translation dictionaries
- `src/lib/config/localization-data.ts` - country/currency defaults and resolution helpers

## API Endpoints

Current API routes:

- `GET /api/bootstrap`
- `GET /api/provider-health`
- `POST /api/best-coin`
- `GET /api/operating-cost-defaults`
- `GET /api/miner-search`
- `GET /api/miner-candidates`
- `GET /api/fx-rate`
- `GET /api/country-profile`
- `GET /api/coin-search`
- `GET /api/coin-price`
- `POST /api/ai-recommendation`

Most routes include request validation/sanitization and rate limiting.

## Notes

- Build output is generated in `dist/`.
- Lint currently reports `useVisibleTask$` warnings in `src/routes/index.tsx` by design in this project setup.
- If provider keys are missing, several features degrade gracefully to fallback behavior.

## Troubleshooting

- Missing provider key errors:
  - ensure `.env` exists and contains required keys
  - restart dev server after env changes
- Crawler/provider unavailable:
  - check `GET /api/provider-health` for real-time status
- Redis not configured:
  - app still runs using in-memory fallback cache/limits
# Qwik City App ⚡️

- [Qwik Docs](https://qwik.dev/)
- [Discord](https://qwik.dev/chat)
- [Qwik GitHub](https://github.com/QwikDev/qwik)
- [@QwikDev](https://twitter.com/QwikDev)
- [Vite](https://vitejs.dev/)

---

## Project Structure

This project is using Qwik with [QwikCity](https://qwik.dev/qwikcity/overview/). QwikCity is just an extra set of tools on top of Qwik to make it easier to build a full site, including directory-based routing, layouts, and more.

Inside your project, you'll see the following directory structure:

```
├── public/
│   └── ...
└── src/
    ├── components/
    │   └── ...
    └── routes/
        └── ...
```

- `src/routes`: Provides the directory-based routing, which can include a hierarchy of `layout.tsx` layout files, and an `index.tsx` file as the page. Additionally, `index.ts` files are endpoints. Please see the [routing docs](https://qwik.dev/qwikcity/routing/overview/) for more info.

- `src/components`: Recommended directory for components.

- `public`: Any static assets, like images, can be placed in the public directory. Please see the [Vite public directory](https://vitejs.dev/guide/assets.html#the-public-directory) for more info.

## Add Integrations and deployment

Use the `npm run qwik add` command to add additional integrations. Some examples of integrations includes: Cloudflare, Netlify or Express Server, and the [Static Site Generator (SSG)](https://qwik.dev/qwikcity/guides/static-site-generation/).

```shell
npm run qwik add # or `yarn qwik add`
```

## Development

Development mode uses [Vite's development server](https://vitejs.dev/). The `dev` command will server-side render (SSR) the output during development.

```shell
npm start # or `yarn start`
```

> Note: during dev mode, Vite may request a significant number of `.js` files. This does not represent a Qwik production build.

## Preview

The preview command will create a production build of the client modules, a production build of `src/entry.preview.tsx`, and run a local server. The preview server is only for convenience to preview a production build locally and should not be used as a production server.

```shell
npm run preview # or `yarn preview`
```

## Production

The production build will generate client and server modules by running both client and server build commands. The build command will use Typescript to run a type check on the source code.

```shell
npm run build # or `yarn build`
```

## Vercel Edge

This starter site is configured to deploy to [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions), which means it will be rendered at an edge location near to your users.

## Installation

The adaptor will add a new `vite.config.ts` within the `adapters/` directory, and a new entry file will be created, such as:

```
└── adapters/
    └── vercel-edge/
        └── vite.config.ts
└── src/
    └── entry.vercel-edge.tsx
```

Additionally, within the `package.json`, the `build.server` script will be updated with the Vercel Edge build.

## Production build

To build the application for production, use the `build` command, this command will automatically run `npm run build.server` and `npm run build.client`:

```shell
npm run build
```

[Read the full guide here](https://github.com/QwikDev/qwik/blob/main/starters/adapters/vercel-edge/README.md)

## Dev deploy

To deploy the application for development:

```shell
npm run deploy
```

Notice that you might need a [Vercel account](https://docs.Vercel.com/get-started/) in order to complete this step!

## Production deploy

The project is ready to be deployed to Vercel. However, you will need to create a git repository and push the code to it.

You can [deploy your site to Vercel](https://vercel.com/docs/concepts/deployments/overview) either via a Git provider integration or through the Vercel CLI.
