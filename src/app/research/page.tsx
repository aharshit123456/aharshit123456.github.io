import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Research | Harshit Agarwal Portfolio',
  description: 'AI Research interests and publications of Harshit Agarwal, specializing in Computational Neuroscience, Protein Engineering, Drug Discovery, Cybersecurity, and Foundation Models.',
  alternates: {
    canonical: 'https://aharshit123456.space/research',
  },
};

export default function ResearchIndexPage() {
  const researchAreas = [
    {
      slug: 'computational-neuroscience',
      title: 'Computational Neuroscience',
      description: 'Alzheimer\'s and Parkinson\'s Disease gait analysis, EEG working-memory feature extraction, and predictive models for gait imbalances.'
    },
    {
      slug: 'protein-engineering',
      title: 'Protein Engineering',
      description: 'Investigating deep learning architectures for protein structure prediction, folding dynamics, and design heuristics.'
    },
    {
      slug: 'drug-discovery',
      title: 'Drug Discovery',
      description: 'Applying generative models and graph neural networks (GNNs) for target binding prediction and automated lead compound discovery.'
    },
    {
      slug: 'cybersecurity',
      title: 'Cybersecurity',
      description: 'Predictive vulnerability exploitability models (DistilBERT/GPT-2) and national governement CTF challenges.'
    },
    {
      slug: 'foundation-models',
      title: 'Foundation Models',
      description: 'Rewiring attention mechanisms, optimizing context windows, and serving multimodal CLIP and VLLM systems at scale.'
    }
  ];

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">RESEARCH_PORTFOLIO</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>AI & Scientific Research</h1>
          <p>Exposing research domains at the intersection of deep learning and physical/biological sciences.</p>
          
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {researchAreas.map((area) => (
              <div key={area.slug} style={{ borderBottom: '1px solid rgba(255, 77, 77, 0.1)', paddingBottom: '25px' }}>
                <Link href={`/research/${area.slug}`} style={{ fontSize: '22px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
                  {area.title}
                </Link>
                <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-secondary)' }}>
                  {area.description}
                </p>
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
