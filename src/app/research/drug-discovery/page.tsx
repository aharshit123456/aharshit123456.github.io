import React from 'react';
import Link from 'next/link';
import '../../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drug Discovery Research | Harshit Agarwal',
  description: 'AI-driven molecular generation, graph neural networks for target binding affinity prediction.',
  alternates: {
    canonical: 'https://aharshit123456.space/research/drug-discovery',
  },
};

export default function DrugDiscoveryPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/research" className="back-link">
          Back to Research
        </Link>
        <div className="nav-logo">DRUG_DISCOVERY</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Drug Discovery</h1>
          <p>Accelerating compound screening and binding estimation via advanced spatial algorithms and graph representations.</p>
          
          <h2>Binding Affinity Prediction</h2>
          <p>
            Estimating the binding strength of small-molecule ligands to target protein receptors using molecular graphs and docking simulators.
          </p>
          <ul>
            <li><strong>Graph Neural Networks (GNNs):</strong> Representing atoms as nodes and bonds as edges, utilizing message passing to compute chemical properties.</li>
            <li><strong>Cross-Attention Mapping:</strong> Implementing cross-attention mechanisms between target protein residues and ligand atoms to resolve interaction interfaces.</li>
          </ul>

          <h2>Active Learning Pipelines</h2>
          <p>
            Creating workflows to iteratively query simulation software (e.g., AutoDock Vina) for labels, and training models to screen databases of millions of compounds.
          </p>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
