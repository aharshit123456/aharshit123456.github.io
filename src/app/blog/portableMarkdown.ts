/**
 * Turns a blog post (markdown + this site's custom HTML blocks) into plain
 * markdown that other platforms (dev.to, Hashnode, Medium, RSS readers) can
 * render: diagrams become arrow lines, bar charts become tables, stat rows
 * become bullet lists, screenshots become images with absolute URLs.
 */
import { SITE_URL } from './blogMeta';

const decode = (s: string) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Inner HTML to inline markdown: keep bold/italic/code, drop other tags. */
function inline(html: string): string {
  return decode(
    html
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/?(b|strong)>/gi, '**')
      .replace(/<\/?(i|em)>/gi, '*')
      .replace(/<\/?code>/gi, '`')
      .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

const absolute = (url: string) => (url.startsWith('/') ? `${SITE_URL}${url}` : url);

/** Index just past the </div> that closes the <div ...> starting at `start`. */
function closingDiv(src: string, start: number): number {
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    depth += m[0] === '</div>' ? -1 : 1;
    if (depth === 0) return m.index + m[0].length;
  }
  return src.length;
}

/** Contents of every balanced <div class="cls"> block in `html`. */
function divs(html: string, cls: string): string[] {
  const out: string[] = [];
  const re = new RegExp(`<div class="${cls}"[^>]*>`, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const end = closingDiv(html, m.index);
    out.push(html.slice(m.index + m[0].length, end - '</div>'.length));
    re.lastIndex = end;
  }
  return out;
}

function caption(html: string): string {
  const m = html.match(/<figcaption>([\s\S]*?)<\/figcaption>/);
  return m ? `*${inline(m[1]).replace(/^\*\*(.+?)\*\*/, '$1').replace(/\*/g, '')}*` : '';
}

function convertFigure(html: string): string {
  const parts: string[] = [];
  if (html.includes('class="diagram"')) {
    for (const d of divs(html, 'diagram')) {
      const nodes = [...d.matchAll(/<div class="node( accent)?[^"]*"[^>]*>([\s\S]*?)<\/div>/g)].map((n) =>
        n[1] ? `**${inline(n[2])}**` : inline(n[2]),
      );
      parts.push(nodes.join(' → '));
    }
  } else if (html.includes('class="chart"')) {
    const cols = divs(html, 'bar-col').map((c) => ({
      label: inline((c.match(/<div class="bar-label">([\s\S]*?)<\/div>/) || [])[1] || ''),
      value: inline((c.match(/<div class="bar-value">([\s\S]*?)<\/div>/) || [])[1] || ''),
    }));
    parts.push(['| | |', '|---|---|', ...cols.map((c) => `| ${c.label} | ${c.value} |`)].join('\n'));
  } else {
    for (const img of html.matchAll(/<img [^>]*>/g)) {
      const src = (img[0].match(/src="([^"]+)"/) || [])[1];
      const alt = (img[0].match(/alt="([^"]*)"/) || [])[1] || '';
      if (src) parts.push(`![${alt}](${absolute(src)})`);
    }
  }
  const cap = caption(html);
  if (cap) parts.push(cap);
  return parts.join('\n\n');
}

function convertStatRow(html: string): string {
  return divs(html, 'stat')
    .map((s) => {
      const num = inline((s.match(/<div class="stat-num">([\s\S]*?)<\/div>/) || [])[1] || '');
      const label = inline((s.match(/<div class="stat-label">([\s\S]*?)<\/div>/) || [])[1] || '');
      return `- **${num}** ${label}`;
    })
    .join('\n');
}

/** Terminal window -> fenced code block with its title as a comment line. */
function convertTerminal(html: string): string {
  const title = inline((html.match(/<div class="terminal-bar">[\s\S]*?<span>([\s\S]*?)<\/span>/) || [])[1] || '');
  const code = decode(((html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/) || [])[1] || '').replace(/<[^>]+>/g, '')).replace(/\n+$/, '');
  return ['```text', ...(title ? [`# ${title}`] : []), code, '```'].join('\n');
}

/** Incident chat -> blockquote, one bold speaker per line. */
function convertChat(html: string): string {
  const head = inline((html.match(/<div class="chat-head">([\s\S]*?)<\/div>/) || [])[1] || '');
  const lines = divs(html, 'chat-msg').map((m) => {
    const who = inline((m.match(/<span class="who[^"]*">([\s\S]*?)<\/span>/) || [])[1] || '');
    // The text span can contain nested tags (e.g. a P1 tag), so take everything after it.
    const raw = m.split('<span class="text">')[1] || '';
    const text = inline(raw.replace(/<\/span>\s*$/, '').replace(/<span class="tag[^"]*">([\s\S]*?)<\/span>/g, '[$1] '));
    return `> **${who}:** ${text}`;
  });
  return [...(head ? [`> *${head}*`, '>'] : []), ...lines.flatMap((l, i) => (i ? ['>', l] : [l]))].join('\n');
}

/** Big number -> one bold line. */
function convertBigStat(html: string): string {
  const pick = (cls: string) => inline((html.match(new RegExp(`<div class="${cls}[^"]*">([\\s\\S]*?)<\\/div>`)) || [])[1] || '');
  const sub = pick('big-stat-sub');
  return `**${pick('big-stat-label')}: ${pick('big-stat-num')}**${sub ? ` (${sub})` : ''}`;
}

export type PortableOptions = {
  /** Drop the leading "# Title" (platforms that take the title separately). */
  dropTitle?: boolean;
  /** Add an "Originally published at …" line pointing to this URL. */
  originalUrl?: string;
};

export function toPortableMarkdown(content: string, opts: PortableOptions = {}): string {
  let md = content;

  // Block-level HTML, replaced outermost first.
  md = md.replace(/<figure>[\s\S]*?<\/figure>/g, (f) => convertFigure(f));
  let i: number;
  while ((i = md.indexOf('<div class="stat-row"')) !== -1) {
    const end = closingDiv(md, i);
    md = md.slice(0, i) + convertStatRow(md.slice(i, end)) + md.slice(end);
  }
  for (const [cls, fn] of [
    ['terminal', convertTerminal],
    ['chat', convertChat],
    ['big-stat', convertBigStat],
  ] as const) {
    while ((i = md.indexOf(`<div class="${cls}"`)) !== -1) {
      const end = closingDiv(md, i);
      md = md.slice(0, i) + fn(md.slice(i, end)) + md.slice(end);
    }
  }
  while ((i = md.indexOf('<div class="screenshot-container"')) !== -1) {
    const end = closingDiv(md, i);
    md = md.slice(0, i) + convertFigure(md.slice(i, end)) + md.slice(end);
  }

  // GitHub alerts -> plain blockquotes with a bold label.
  md = md.replace(/^> \[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n(?:>[ \t]?)?/gm, (_, kind: string) => `> **${kind[0]}${kind.slice(1).toLowerCase()}:** `);

  // Site-relative links and images -> absolute.
  md = md.replace(/\]\((\/[^)\s]*)\)/g, (_, url: string) => `](${absolute(url)})`);

  if (opts.dropTitle) md = md.replace(/^# .*\n+/, '');
  md = md.replace(/^\*By Harshit Agarwal\*\s*\n+/m, '');
  if (opts.originalUrl) {
    md = `*Originally published at [aharshit123456.space](${opts.originalUrl}).*\n\n${md}`;
  }
  return md.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
