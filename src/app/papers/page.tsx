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

interface PublicationLink {
  label: string;
  url: string;
}

interface Publication {
  authors: string;
  title: string;
  venue: string;
  date: string;
  abstract: string;
  links: PublicationLink[];
}

interface PublicationGroup {
  heading: string;
  items: Publication[];
}

const publicationGroups: PublicationGroup[] = [
  {
    heading: 'Conference Papers',
    items: [
      {
        authors: 'Chakraborty, S., Johri, D., Agarwal, H., Chakraborty, J., Behura, A.',
        title: 'A Hybrid Dual-Head Transformer-Based LSTM Framework for Physiotherapy Exercise Recognition Using Kinect Sensors.',
        venue: 'Frontiers in Advanced Computing and Emerging Intelligent Technologies (FACEIT 2026). Learning and Analytics in Intelligent Systems, vol. 63. Springer, Cham.',
        date: '2026',
        abstract: 'Proposes a hybrid dual-head transformer-based LSTM framework to identify and recognize physiotherapy exercises from spatial-temporal Kinect sensor coordinate inputs.',
        links: [
          { label: 'Springer Link', url: 'https://doi.org/10.1007/978-3-032-29501-9_42' },
        ],
      },
      {
        authors: 'Kumar, Agarwal, H., et al.',
        title: 'Rewiring Transformers for Exploit Likelihood of Vulnerabilities.',
        venue: 'AIP Conference Proceedings, ICANTCI 2025.',
        date: '2025',
        abstract: 'Investigates custom attention mechanics inside transformers (DistilBERT, GPT-2) to predict the likelihood of exploit releases based on National Vulnerability Database (NVD) text reports.',
        links: [
          { label: 'AIP Publishing', url: 'https://pubs.aip.org/aip/acp/article-abstract/3410/1/070002/3391998/Rewiring-transformers-for-exploit-likelihood' },
          { label: 'Semantic Scholar', url: 'https://www.semanticscholar.org/paper/Rewiring-transformers-for-exploit-likelihood-of-Kumar-Agarwal/e1b24fbc4451a11963afa12b247ec3f0c22a2f21' },
          { label: 'Wikidata', url: 'https://www.wikidata.org/wiki/Q140373223' },
        ],
      },
    ],
  },
  {
    heading: 'Journal Articles (Submitted)',
    items: [
      {
        authors: 'Chakraborty, J., Agarwal, H.',
        title: "Detecting Freezing of Gait (FOG) and Imbalances in Parkinson's Disease Patients.",
        venue: 'Health and Technology (Journal).',
        date: '2025, submitted',
        abstract: 'Utilizes graph spatial neural networks and sequential LSTM modules on wearable sensor streams to predict and identify freezing of gait (FOG) events in patients with Parkinson\'s disease.',
        links: [],
      },
    ],
  },
];

function PublicationEntry({ pub, number }: { pub: Publication; number: number }) {
  return (
    <li className="pub-entry">
      <span className="pub-number">[{number}]</span>
      <div className="pub-body">
        <span className="pub-authors">{pub.authors}</span>{' '}
        <span className="pub-title">&ldquo;{pub.title}&rdquo;</span>{' '}
        <span className="pub-venue">{pub.venue}</span>{' '}
        <span className="pub-date">{pub.date}.</span>
        <p className="pub-abstract">{pub.abstract}</p>
        {pub.links.length > 0 && (
          <div className="pub-links">
            {pub.links.map((link) => (
              <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
                [{link.label}]
              </a>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

export default function PapersIndexPage() {
  let counter = 0;

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">PUBLICATIONS</div>
      </nav>

      <main className="blog-content pub-page">
        <article className="article-card markdown-body">
          <h1>Publications</h1>
          <p className="pub-subtitle">
            Peer-reviewed conference papers, journal articles, and preprints. Author name appears as
            &ldquo;Agarwal, H.&rdquo;
          </p>

          {publicationGroups.map((group) => (
            <section key={group.heading} className="pub-group">
              <h2>{group.heading}</h2>
              <ol className="pub-list">
                {group.items.map((pub) => {
                  counter += 1;
                  return <PublicationEntry key={pub.title} pub={pub} number={counter} />;
                })}
              </ol>
            </section>
          ))}
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
