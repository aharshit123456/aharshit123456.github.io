'use client';

import React, { useEffect, useState } from 'react';

type Item = { id: string; text: string };

/**
 * "On this page" list for wide screens. Reads the h2 headings the article
 * rendered (their wrappers carry stable ids) and highlights the one in view.
 */
export default function PostToc() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const collect = () => {
      const found: Item[] = [];
      document.querySelectorAll<HTMLElement>('.post-main .markdown-body h2').forEach((h) => {
        const wrap = h.closest<HTMLElement>('[id]');
        const text = h.textContent?.trim();
        if (wrap?.id && text) found.push({ id: wrap.id, text });
      });
      return found;
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -65% 0px' },
    );

    const timers: ReturnType<typeof setTimeout>[] = [];
    // The article renders on the client too, so look for headings after it
    // paints, and once more a little later if none were there yet.
    const scan = (attempt: number) => {
      const found = collect();
      if (!found.length && attempt < 3) {
        timers.push(setTimeout(() => scan(attempt + 1), 400));
        return;
      }
      setItems(found);
      found.forEach((i) => {
        const el = document.getElementById(i.id);
        if (el) observer.observe(el);
      });
    };
    timers.push(setTimeout(() => scan(0), 0));

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);

  if (items.length < 2) return null;

  return (
    <nav className="post-toc" aria-label="On this page">
      <p className="post-side-heading">On this page</p>
      <ol>
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} className={active === i.id ? 'is-active' : undefined}>
              {i.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
