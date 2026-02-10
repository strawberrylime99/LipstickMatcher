import type { RequestHandler } from './$types';

const allPosts = import.meta.glob('/src/routes/blog/*.md', { eager: true });

type PostModule = {
  metadata?: {
    date?: string;
  };
};

const site = 'https://lipstickmatcher.com';

function xmlEscape(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: RequestHandler = async () => {
  const staticPages = [
    { loc: `${site}/`, changefreq: 'weekly', priority: '1.0', lastmod: new Date().toISOString().slice(0, 10) },
    { loc: `${site}/how-its-matched`, changefreq: 'monthly', priority: '0.8', lastmod: new Date().toISOString().slice(0, 10) },
    { loc: `${site}/blog`, changefreq: 'weekly', priority: '0.8', lastmod: new Date().toISOString().slice(0, 10) }
  ];

  const blogPages = Object.entries(allPosts).map(([path, mod]) => {
    const slug = path.split('/').pop()?.replace('.md', '');
    const typed = mod as PostModule;
    const lastmod = typed.metadata?.date ?? new Date().toISOString().slice(0, 10);
    return {
      loc: `${site}/blog/${slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod
    };
  });

  const urls = [...staticPages, ...blogPages]
    .filter((item) => Boolean(item.loc))
    .map(
      (item) => `  <url>
    <loc>${xmlEscape(item.loc)}</loc>
    <lastmod>${xmlEscape(item.lastmod)}</lastmod>
    <changefreq>${xmlEscape(item.changefreq)}</changefreq>
    <priority>${xmlEscape(item.priority)}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'max-age=0, s-maxage=3600'
    }
  });
};
