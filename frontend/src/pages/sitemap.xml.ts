import type { APIRoute } from "astro";
import { fetchJSON } from "../lib/api";

export const GET: APIRoute = async ({ site }) => {
  const SITE = site?.origin ?? "https://gamevault.es";

  let games:    any[] = [];
  let articles: any[] = [];
  let cats:     any[] = [];

  try {
    const [gRes, aRes, cRes] = await Promise.all([
      fetchJSON("/api/games?pagination%5BpageSize%5D=200&fields%5B0%5D=slug&fields%5B1%5D=updatedAt"),
      fetchJSON("/api/articles?pagination%5BpageSize%5D=200&fields%5B0%5D=slug&fields%5B1%5D=updatedAt"),
      fetchJSON("/api/categories?pagination%5BpageSize%5D=50&fields%5B0%5D=slug&fields%5B1%5D=updatedAt"),
    ]);
    games    = gRes?.data    ?? [];
    articles = aRes?.data    ?? [];
    cats     = cRes?.data    ?? [];
  } catch (e) {
    console.error("Sitemap fetch error:", e);
  }

  const staticUrls = [
    { loc: "/",           priority: "1.0", changefreq: "weekly" },
    { loc: "/games",      priority: "0.9", changefreq: "daily"  },
    { loc: "/categories", priority: "0.8", changefreq: "weekly" },
    { loc: "/articles",   priority: "0.8", changefreq: "weekly" },
    { loc: "/contact",    priority: "0.5", changefreq: "monthly"},
  ];

  const allUrls = [
    ...staticUrls,
    ...games.map((g: any)    => ({ loc: `/games/${g.slug}`,      priority: "0.7", changefreq: "monthly", lastmod: g.updatedAt?.slice(0, 10) })),
    ...articles.map((a: any) => ({ loc: `/articles/${a.slug}`,   priority: "0.7", changefreq: "monthly", lastmod: a.updatedAt?.slice(0, 10) })),
    ...cats.map((c: any)     => ({ loc: `/categories/${c.slug}`, priority: "0.6", changefreq: "monthly", lastmod: c.updatedAt?.slice(0, 10) })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allUrls.map(u => `  <url>
    <loc>${SITE}${u.loc}</loc>${u.lastmod ? `
    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type":  "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};