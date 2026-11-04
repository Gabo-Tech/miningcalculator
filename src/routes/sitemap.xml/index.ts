import type { RequestHandler } from "@builder.io/qwik-city";
import { indexableEntries } from "../../lib/seo/guides";
import { xmlEscape } from "../../lib/seo/site";

export const onGet: RequestHandler = async ({ headers, send }) => {
  const urls = indexableEntries()
    .map(
      (entry) => `  <url>
    <loc>${xmlEscape(entry.loc)}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  headers.set("Content-Type", "application/xml; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=3600");
  send(200, xml);
};
