import React from 'react';
import Link from 'next/link';
import '../../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Protein Engineering Research | Harshit Agarwal',
  description: 'Deep generative models applied to protein structure prediction, fold analysis, and synthetic design.',
  alternates: {
    canonical: 'https://aharshit123456.space/research/protein-engineering',
  },
};

export default function ProteinEngineeringPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/research" className="back-link">
          Back to Research
        </Link>
        <div className="nav-logo">PROTEIN_ENGINEERING</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Protein Engineering</h1>
          <p>Leveraging geometric deep learning and structural models to predict and design functional macro-molecules.</p>
          
          <h2>Deep Generative Design</h2>
          <p>
            Traditional protein discovery is limited by the massive, unexplored search space of amino-acid sequences. Our research focuses on using diffusion models and flow-matching algorithms to design novel protein backbones.
          </p>
          <ul>
            <li><strong>Geometric Representation:</strong> Representing 3D backbones as coordinates and frames (SE(3) symmetry) for equivariant network compatibility.</li>
            <li><strong>De Novo Design:</strong> Generating sequence configurations that fold into desired target topologies.</li>
          </ul>

          <h2>Structure & Stability Estimation</h2>
          <p>
            Modeling contact maps and side-chain interactions to estimate structural thermodynamic stability under different chemical environments.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
