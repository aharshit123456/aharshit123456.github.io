import React from 'react';
import Link from 'next/link';
import '../../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cybersecurity Research | Harshit Agarwal',
  description: 'Vulnerability exploitability prediction models, fine-tuned transformer networks, and CTF achievements.',
  alternates: {
    canonical: 'https://aharshit123456.space/research/cybersecurity',
  },
};

export default function CybersecurityPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/research" className="back-link">
          Back to Research
        </Link>
        <div className="nav-logo">CYBERSECURITY</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Cybersecurity Research</h1>
          <p>Developing predictive systems for vulnerability exploitation analysis and conducting hands-on offensive security tests.</p>
          
          <h2>NVD Exploitability Prediction Toolkit</h2>
          <p>
            Authored research on predicting the exploitability likelihood of software vulnerabilities registered in the National Vulnerability Database (NVD).
          </p>
          <ul>
            <li><strong>Transformer Fine-tuning:</strong> Fine-tuned DistilBERT and GPT-2 models on text descriptions of over 56,000 vulnerabilities to learn linguistic markers associated with exploit code releases.</li>
            <li><strong>Exploit Likelihood Classifier:</strong> Built a regression system that yields continuous exploit likelihood scores aligned with EPSS (Exploit Prediction Scoring System) metrics. Achieved an 85.6% accuracy rate.</li>
            <li><strong>Publication:</strong> Paper accepted in *ICANTCI 2025* and published in AIP Conference Proceedings.</li>
          </ul>

          <h2>Offensive Security & CTFs</h2>
          <ul>
            <li><strong>Pentathon CTF:</strong> Ranked **95 out of over 5500 teams** in a nationwide government Capture The Flag competition. Handled challenges in API exploitation, network mapping, binary forensics, and web vulnerability analysis.</li>
            <li><strong>Tooling:</strong> Proficient in Linux, BurpSuite, Metasploit, Maltego, Wireshark, and custom packet analysis scripts.</li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
