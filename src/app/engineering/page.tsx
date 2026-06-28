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

          <h2>Feature Flags & Rollout Strategy</h2>
          <p>
            Features aren't slowed down by planning, they're slowed down by instability. Speed without discipline just gets you to broken faster. Good software is about writing clean code that gets tested by a thousand real users before the first bug makes it to production.
          </p>
          <ul>
            <li><strong>Beyond A/B Testing:</strong> Using feature flags not just for front-end toggles, but as system circuit breakers, gradual database migration controllers, and safety nets.</li>
            <li><strong>Gradual Rollouts:</strong> Employing simple table-based rollout CLI tools to manage canary deployments to 10 users, then 20%, then full releases.</li>
            <li><strong>Local Implementations:</strong> Rather than jumping to third-party tools like LaunchDarkly or Firebase immediately, establishing local table/redis-backed models to preserve startup simplicity.</li>
          </ul>
          
          <h2>Modular Monolith Abstractions (Day 0)</h2>
          <p>
            Avoid over-engineering but establish strict modularity from the beginning. Structuring code with clean repositories, service layers, and intentional abstraction boundaries prevents merge conflicts and ensures rapid velocity when shipping 10+ features a week.
          </p>

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
