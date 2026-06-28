import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Software Engineering | Harshit Agarwal Portfolio',
  description: 'Software engineering practices, clean code architectures, and developer velocity optimizations by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/engineering',
  },
};

export default function EngineeringClusterPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">SOFTWARE_ENGINEERING</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Software Engineering & Workflow Velocity</h1>
          <p>Optimizing development pipelines, delivery cycles, and code modularity across projects.</p>
          
          <h2>Core Practices</h2>
          <ul>
            <li><strong>CI/CD Automation:</strong> Custom Fastlane pipelines to build and deploy Flutter and Capacitor applications, reducing release overhead by 70%.</li>
            <li><strong>Decoupled Service Layers:</strong> Authoring domain-separated business services (payments, assignments, alerts) ensuring simple testing boundaries.</li>
            <li><strong>Testing Benchmarks:</strong> Running local asynchronous load-testing benchmarks to evaluate threadpool and RDS socket constraints.</li>
          </ul>

          <h2>Relevant Sections</h2>
          <p>
            Check out my past roles at the <Link href="/experience">Work Experience Page</Link> or read my dev logs at the <Link href="/blog">Tech Blog</Link>.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
