import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { getBlogMeta, SITE_URL } from '../blog/blogMeta';
import { toPortableMarkdown } from '../blog/portableMarkdown';

export const dynamic = 'force-static';

type BlogIndexEntry = { slug: string; date?: string };

/** Full post as HTML for feed readers and RSS importers (dev.to, Hashnode). */
function fullHtml(content: string, url: string): string {
  const md = toPortableMarkdown(content, { dropTitle: true, originalUrl: url });
  const html = marked.parse(md, { gfm: true, async: false }) as string;
  return html.replace(/]]>/g, ']]&gt;');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  let entries: BlogIndexEntry[] = [];
  try {
    entries = JSON.parse(fs.readFileSync(path.join(blogsDirectory, 'blogs.json'), 'utf8'));
  } catch {
    entries = [];
  }

  const items = entries
    .filter((entry) => fs.existsSync(path.join(blogsDirectory, `${entry.slug}.md`)))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .map((entry) => {
      const content = fs.readFileSync(path.join(blogsDirectory, `${entry.slug}.md`), 'utf8');
      const meta = getBlogMeta(entry.slug, content);
      const pubDate = meta.datePublished ? new Date(`${meta.datePublished}T00:00:00Z`).toUTCString() : undefined;
      return [
        '    <item>',
        `      <title>${escapeXml(meta.title)}</title>`,
        `      <link>${meta.url}</link>`,
        `      <guid isPermaLink="true">${meta.url}</guid>`,
        `      <description>${escapeXml(meta.description)}</description>`,
        `      <content:encoded><![CDATA[${fullHtml(content, meta.url)}]]></content:encoded>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : '',
        '      <dc:creator>Harshit Agarwal</dc:creator>',
        ...meta.keywords.map((k) => `      <category>${escapeXml(k)}</category>`),
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n');
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Harshit Agarwal Tech Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Engineering write-ups by Harshit Agarwal: system design, AI agents, pricing, testing and infrastructure.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
