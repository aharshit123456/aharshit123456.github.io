import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import './blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Harshit Agarwal Tech Blog',
  description: 'Read the latest blog posts and research articles by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/blog',
  },
};

export default async function BlogIndexPage() {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  let blogs: { slug: string; title: string; date?: string }[] = [];
  try {
    const blogsJsonPath = path.join(blogsDirectory, 'blogs.json');

    if (fs.existsSync(blogsJsonPath)) {
      blogs = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
    } else {
      const files = fs.readdirSync(blogsDirectory);
      blogs = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          slug: file.replace('.md', ''),
          title: file.replace('.md', '').replace(/-/g, ' '),
          date: '',
        }));
    }
  } catch (error) {
    console.error("Error reading blogs:", error);
  }

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">TECH_BLOG</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Tech Blog</h1>
          <p>Writing about fullstack systems, artificial intelligence, computer vision, and theoretical physics.</p>
          <div className="blog-list" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {blogs.map((blog: any) => (
              <div key={blog.slug} className="blog-item" style={{ borderBottom: '1px solid rgba(255, 77, 77, 0.1)', paddingBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                  {blog.date && (
                    <span className="date" style={{ color: 'var(--accent-color)', fontSize: '14px', fontFamily: 'monospace' }}>
                      [{blog.date}]
                    </span>
                  )}
                  <Link href={`/blog/${blog.slug}`} className="blog-link" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {blog.title}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
