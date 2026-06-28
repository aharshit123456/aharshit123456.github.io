import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Publications & Papers | Harshit Agarwal Portfolio',
  description: 'Academic papers, conference publications, and journal submissions by Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/papers',
  },
};

export default function PapersIndexPage() {
  const publications = [
    {
      title: 'Rewiring transformers for exploit likelihood of vulnerabilities',
      authors: 'Kumar, Agarwal, et al.',
      venue: 'AIP Conference Proceedings / ICANTCI 2025',
      date: '2025',
      abstract: 'Investigates custom attention mechanics inside transformers (like DistilBERT and GPT-2) to predict the likelihood of exploit releases based on National Vulnerability Database (NVD) text reports.',
      links: [
        { label: 'Springer Link', url: 'https://link.springer.com/chapter/10.1007/978-3-032-29501-9_42' },
        { label: 'AIP Publishing', url: 'https://pubs.aip.org/aip/acp/article-abstract/3410/1/070002/3391998/Rewiring-transformers-for-exploit-likelihood' },
        { label: 'Semantic Scholar', url: 'https://www.semanticscholar.org/paper/Rewiring-transformers-for-exploit-likelihood-of-Kumar-Agarwal/e1b24fbc4451a11963afa12b247ec3f0c22a2f21' }
      ]
    },
    {
      title: 'Detecting Freezing of Gait (FOG) and Imbalances in Parkinson\'s Disease Patients',
      authors: 'Chakraborty, J., Agarwal, H.',
      venue: 'Health and Technology (Journal)',
      date: '2025 (Submitted)',
      abstract: 'Utilizes graph spatial neural networks and sequential LSTM modules on wearable sensor streams to predict and identify freezing of gait (FOG) events in patients with Parkinson\'s disease.',
      links: []
    }
  ];

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">ACADEMIC_PAPERS</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Publications & Papers</h1>
          <p>Scientific publications, peer-reviewed articles, and research preprints.</p>
          
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '35px' }}>
            {publications.map((pub, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid rgba(255, 77, 77, 0.1)', paddingBottom: '30px' }}>
                <h2 style={{ fontSize: '20px', margin: '0 0 10px 0', color: '#ffffff' }}>
                  {pub.title}
                </h2>
                <div style={{ fontSize: '13px', color: 'var(--accent-color)', fontFamily: 'monospace', marginBottom: '10px' }}>
                  {pub.authors} — {pub.venue} ({pub.date})
                </div>
                <p style={{ fontSize: '14.5px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 15px 0' }}>
                  {pub.abstract}
                </p>
                {pub.links.length > 0 && (
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {pub.links.map((link, lIdx) => (
                      <a 
                        key={lIdx} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ fontSize: '13px', fontWeight: 'bold' }}
                      >
                        [{link.label}]
                      </a>
                    ))}
                  </div>
                )}
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
