import React from 'react';
import Link from 'next/link';
// Trigger dynamic hot-reload for new blog markdown files

import fs from 'fs';
import path from 'path';
import './../blog.css';
import { Metadata } from 'next';
import InteractiveArticle from '@/components/portfolio/InteractiveArticle';
import { getBlogMeta, SITE_URL } from '../blogMeta';
import { getPostNeighbors, getPostRail, type PostNeighbors, type PostRail } from '../postNav';
import PostToc from '../PostToc';

// This function tells Next.js which paths to pre-render at build time
export async function generateStaticParams() {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  try {
    const files = fs.readdirSync(blogsDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        slug: file.replace('.md', ''),
      }));
  } catch (error) {
    return [];
  }
}

async function getBlogContent(slug: string) {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  const filePath = path.join(blogsDirectory, `${slug}.md`);
  
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading blog ${slug}:`, error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getBlogContent(slug);
  
  if (!content) {
    return {
      title: 'Blog Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const meta = getBlogMeta(slug, content);
  const ogImage = `${meta.url}/opengraph-image`;

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.url,
      types: { 'application/rss+xml': [{ url: `${SITE_URL}/feed.xml`, title: 'Harshit Agarwal Tech Blog' }] },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      url: meta.url,
      siteName: 'Harshit Agarwal Portfolio',
      publishedTime: meta.datePublished,
      modifiedTime: meta.dateModified,
      authors: [SITE_URL],
      tags: meta.keywords,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      creator: '@aharshit123456',
      images: [ogImage],
    },
    keywords: meta.keywords,
    authors: [{ name: 'Harshit Agarwal', url: SITE_URL }],
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getBlogContent(slug);

  if (!content) {
    return (
      <div className="error-container">
        <h1>404 - Post Not Found</h1>
        <p>The requested blog post does not exist on our servers.</p>
        <Link href="/" className="back-link">Back to Desktop</Link>
      </div>
    );
  }

  const meta = getBlogMeta(slug, content);
  const neighbors = getPostNeighbors(slug);
  const rail = getPostRail(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${meta.url}#article`,
    "headline": meta.title,
    "description": meta.description,
    "url": meta.url,
    "mainEntityOfPage": { "@type": "WebPage", "@id": meta.url },
    "image": `${meta.url}/opengraph-image`,
    "inLanguage": "en-US",
    ...(meta.datePublished ? { "datePublished": meta.datePublished } : {}),
    ...(meta.dateModified ? { "dateModified": meta.dateModified } : {}),
    "keywords": meta.keywords.join(', '),
    "wordCount": meta.wordCount,
    "author": {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      "name": "Harshit Agarwal",
      "url": `${SITE_URL}/`,
      "sameAs": [
        "https://github.com/aharshit123456",
        "https://www.linkedin.com/in/aharshit123456/",
        "https://twitter.com/aharshit123456"
      ]
    },
    "publisher": { "@id": `${SITE_URL}/#person` },
    "isPartOf": { "@type": "Blog", "@id": `${SITE_URL}/blog`, "name": "Harshit Agarwal Tech Blog" }
  };

  return (
    <div className="blog-outer">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c')
        }}
      />
      <nav className="blog-nav">
        <Link href="/" className="back-link">
           Back to Desktop
        </Link>
        <div className="nav-logo">TECH_BLOG</div>
      </nav>
      
      <main className="blog-content post-layout">
        <aside className="post-side post-side--left">
          <PostToc />
        </aside>

        <div className="post-main">
          <PostNav neighbors={neighbors} position="top" />

          <article className="article-card markdown-body">
            <InteractiveArticle content={content} slug={slug} />
          </article>

          <PostNav neighbors={neighbors} position="bottom" />
        </div>

        <aside className="post-side post-side--right">
          <PostRailPanel rail={rail} />
        </aside>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}

/** Previous/next links, shown above and below every post. */
function PostNav({ neighbors, position }: { neighbors: PostNeighbors; position: 'top' | 'bottom' }) {
  return (
    <nav className={`post-nav post-nav--${position}`} aria-label={position === 'top' ? 'Post navigation' : 'More posts'}>
      {neighbors.context && <p className="post-nav-context">{neighbors.context}</p>}
      <div className="post-nav-row">
        <Link href={neighbors.prev.href} className="post-nav-link post-nav-prev" rel="prev">
          <span className="post-nav-dir">← Previous</span>
          <span className="post-nav-title">{neighbors.prev.title}</span>
        </Link>
        <Link href={neighbors.next.href} className="post-nav-link post-nav-next" rel="next">
          <span className="post-nav-dir">Next →</span>
          <span className="post-nav-title">{neighbors.next.title}</span>
        </Link>
      </div>
    </nav>
  );
}

/** Wide screens only: the series (or latest posts) beside the article. */
function PostRailPanel({ rail }: { rail: PostRail }) {
  return (
    <nav className="post-rail" aria-label={rail.heading}>
      <p className="post-side-heading">{rail.heading}</p>
      <ol>
        {rail.items.map((item) => {
          const label = (
            <>
              {item.n !== undefined && <span className="post-rail-n">{String(item.n).padStart(2, '0')}</span>}
              <span>{item.title}</span>
            </>
          );
          return (
            <li key={item.href || item.title}>
              {item.soon ? (
                <span className="post-rail-soon" title="Coming soon">
                  {label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className={item.current ? 'is-current' : undefined}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      <Link href="/blog" className="post-rail-all">
        All posts →
      </Link>
    </nav>
  );
}
