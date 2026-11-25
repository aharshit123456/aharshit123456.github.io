import fs from 'fs';
import path from 'path';
import { JOURNEYS } from './seriesData';

export type NavLink = { href: string; title: string };

export type PostNeighbors = {
  prev: NavLink;
  next: NavLink;
  /** e.g. "Building FamCare · Part 4 of 9", for posts in a series. */
  context?: string;
};

type IndexEntry = { slug: string; title?: string; date?: string };

const ALL_POSTS: NavLink = { href: '/blog', title: 'All posts' };

function readIndex(): IndexEntry[] {
  try {
    const dir = path.join(process.cwd(), 'public/blogs');
    const entries: IndexEntry[] = JSON.parse(fs.readFileSync(path.join(dir, 'blogs.json'), 'utf8'));
    return entries.filter((e) => fs.existsSync(path.join(dir, `${e.slug}.md`)));
  } catch {
    return [];
  }
}

/**
 * Previous/next for a post. Series posts step through their series in reading
 * order; other posts step through the rest of the blog by date (previous =
 * published earlier). A missing side links back to the blog index.
 */
export function getPostNeighbors(slug: string): PostNeighbors {
  for (const series of JOURNEYS) {
    const posts = series.stages
      .flatMap((s) => s.posts)
      .filter((p): p is typeof p & { slug: string } => Boolean(p.slug));
    const i = posts.findIndex((p) => p.slug === slug);
    if (i === -1) continue;
    const link = (j: number) => (posts[j] ? { href: `/blog/${posts[j].slug}`, title: posts[j].title } : ALL_POSTS);
    // Number against the whole planned series, including posts not written yet.
    const planned = series.stages.flatMap((s) => s.posts);
    const part = planned.findIndex((p) => p.slug === slug) + 1;
    return {
      prev: link(i - 1),
      next: link(i + 1),
      context: `${series.title} · Part ${part} of ${planned.length}`,
    };
  }

  const seriesSlugs = new Set(JOURNEYS.flatMap((j) => j.stages.flatMap((s) => s.posts.map((p) => p.slug))));
  const chain = readIndex()
    .filter((e) => !seriesSlugs.has(e.slug))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const i = chain.findIndex((e) => e.slug === slug);
  const link = (j: number) =>
    i !== -1 && chain[j] ? { href: `/blog/${chain[j].slug}`, title: chain[j].title || chain[j].slug } : ALL_POSTS;
  return { prev: link(i - 1), next: link(i + 1) };
}

export type PostRail = {
  heading: string;
  /** `soon` items are planned posts with no page yet (href is empty). */
  items: (NavLink & { current: boolean; n?: number; soon?: boolean })[];
};

/**
 * Right-hand panel on wide screens: the whole series for series posts,
 * otherwise the latest posts (excluding this one).
 */
export function getPostRail(slug: string): PostRail {
  for (const series of JOURNEYS) {
    const posts = series.stages.flatMap((s) => s.posts);
    if (!posts.some((p) => p.slug === slug)) continue;
    return {
      heading: series.title,
      items: posts.map((p, i) => ({
        href: p.slug ? `/blog/${p.slug}` : '',
        title: p.title,
        current: p.slug === slug,
        n: i + 1,
        soon: !p.slug,
      })),
    };
  }
  const latest = readIndex()
    .filter((e) => e.slug !== slug)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6);
  return {
    heading: 'Latest posts',
    items: latest.map((e) => ({ href: `/blog/${e.slug}`, title: e.title || e.slug, current: false })),
  };
}
