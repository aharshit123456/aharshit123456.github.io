import fs from 'fs';
import path from 'path';

export const SITE_URL = 'https://www.aharshit123456.space';

const BLOGS_DIR = path.join(process.cwd(), 'public/blogs');

type BlogIndexEntry = {
  slug: string;
  title?: string;
  date?: string;
  updated?: string;
  description?: string;
  keywords?: string[];
};

export type BlogMeta = {
  slug: string;
  title: string;
  description: string;
  datePublished?: string;
  dateModified?: string;
  keywords: string[];
  wordCount: number;
  url: string;
};

const DEFAULT_KEYWORDS = ['Tech Blog', 'Software Engineering', 'System Architecture', 'Harshit Agarwal'];

function readIndexEntry(slug: string): BlogIndexEntry | undefined {
  try {
    const entries: BlogIndexEntry[] = JSON.parse(fs.readFileSync(path.join(BLOGS_DIR, 'blogs.json'), 'utf8'));
    return entries.find((e) => e.slug === slug);
  } catch {
    return undefined;
  }
}

/** First real paragraph of the post, cut at a word boundary. */
function extractDescription(content: string, maxLength: number): string | undefined {
  const line = content.split('\n').find((raw) => {
    const t = raw.trim();
    return (
      t.length > 0 &&
      !t.startsWith('#') &&
      !t.startsWith('*') &&
      !t.startsWith('-') &&
      !t.startsWith('<') &&
      !t.startsWith('>') &&
      !t.startsWith('|') &&
      !t.includes('Duration:') &&
      !t.includes('Role:') &&
      !t.includes('Website:')
    );
  });
  if (!line) return undefined;
  const clean = line.trim().replace(/[*_#`\n\r]/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/&/g, 'and');
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function getBlogMeta(slug: string, content: string, maxDescription = 160): BlogMeta {
  const entry = readIndexEntry(slug);
  const titleMatch = content.match(/^# (.*)/m);
  const title = (titleMatch ? titleMatch[1] : entry?.title || 'Blog Post').replace(/&/g, 'and');
  const description =
    entry?.description ||
    extractDescription(content, maxDescription) ||
    "Read this post on Harshit Agarwal's tech blog.";
  const text = content.replace(/<[^>]+>/g, ' ').replace(/[#*_`>|-]/g, ' ');
  return {
    slug,
    title,
    description,
    datePublished: entry?.date,
    dateModified: entry?.updated || entry?.date,
    keywords: entry?.keywords?.length ? entry.keywords : DEFAULT_KEYWORDS,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    url: `${SITE_URL}/blog/${slug}`,
  };
}
