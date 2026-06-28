import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reading | Harshit Agarwal Portfolio',
  description: 'Book recommendations, reading logs, and notes by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/reading',
  },
};

export default function ReadingPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">READING_LIST</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Curated Reading List</h1>
          <p>Books, monographs, and articles on mathematics, system design, physics, and science.</p>
          
          <h2>Current Reads</h2>
          <ul>
            <li><strong>Classical Mechanics (The Theoretical Minimum):</strong> Leonard Susskind. Masterful introduction to Lagrangian and Hamiltonian formulations.</li>
            <li><strong>Designing Data-Intensive Applications:</strong> Martin Kleppmann. Key reference for distributed systems, replication, and transaction mechanics.</li>
          </ul>

          <h2>Core Recommendations</h2>
          <ul>
            <li><strong>Goodreads Account:</strong> Check out my active shelf at <a href="https://www.goodreads.com/user/show/55541393-harshit-agarwal" target="_blank" rel="noopener noreferrer">Goodreads (Harshit Agarwal)</a></li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
