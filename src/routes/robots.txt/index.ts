import type { RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ url, headers, send }) => {
  const sitemapUrl = `${url.origin}/sitemap.xml`;
  const body = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${sitemapUrl}
`;

  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Cache-Control", "public, max-age=3600");
  send(200, body);
};
