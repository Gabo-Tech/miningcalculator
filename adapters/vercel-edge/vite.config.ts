import { vercelEdgeAdapter } from "@builder.io/qwik-city/adapters/vercel-edge/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      rollupOptions: {
        input: ["src/entry.vercel-edge.tsx", "@qwik-city-plan"],
      },
      outDir: ".vercel/output/functions/_qwik-city.func",
    },
    plugins: [
      vercelEdgeAdapter({
        ssg: {
          include: ["/", "/coins/*", "/miners/*"],
          origin: "https://miningcalculator.gabo.rocks",
          // The adapter otherwise writes an empty sitemap.xml into the static
          // output, which Vercel serves instead of the sitemap route.
          sitemapOutFile: null,
        },
      }),
    ],
  };
});
