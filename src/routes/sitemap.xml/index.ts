import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ url, headers, send }) => {
  const now = new Date().toISOString();
  const pageUrl = `${url.origin}/`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${pageUrl}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
`;

  headers.set("Content-Type", "application/xml; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=3600");
  send(200, xml);
};
