import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Uses & Stack | Harshit Agarwal Portfolio',
  description: 'Hardware, software, IDE setup, and hosting stack used by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/uses',
  },
};

export default function UsesPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">DEV_USES</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>My Stack & Setup (/uses)</h1>
          <p>The hardware, tools, systems, and self-hosted infrastructure I use on a daily basis.</p>
          
          <h2>Development Hardware</h2>
          <ul>
            <li><strong>Workstation:</strong> MacBook Pro (Apple Silicon).</li>
            <li><strong>Peripherals:</strong> Custom mechanical keyboard (Cherry MX switches).</li>
          </ul>

          <h2>Software & IDEs</h2>
          <ul>
            <li><strong>Editor:</strong> VS Code / Cursor with dark-mode theme.</li>
            <li><strong>Terminal:</strong> zsh shell with custom prompt configurations.</li>
            <li><strong>Tools:</strong> Docker Desktop, git, BurpSuite, Maltego, Metasploit.</li>
          </ul>

          <h2>Self-Hosted Stack & Infrastructure</h2>
          <ul>
            <li><strong>Orchestration:</strong> Rancher and Kubernetes (EKS) for cluster management.</li>
            <li><strong>Routing Services:</strong> Self-hosted OSRM (Open Source Routing Machine) to calculate routing metrics with 98% cost reductions.</li>
            <li><strong>Data Layer:</strong> PostgreSQL, Redis caching pipelines, Supabase client-server.</li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
