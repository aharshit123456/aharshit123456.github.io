import React from 'react';

const FreelanceExperience: React.FC = () => {
  return (
    <div className="personal-notes">
      <h1>Freelance Experience</h1>
      <p>Independent software development and product strategy for diverse clients.</p>
      
      <hr />
      
      <h2>Olive Ridley Media</h2>
      <h3>Freelance SDE (AI & Product Strategy) | Apr 2026 – Present</h3>
      <ul>
        <li><strong>Architected Vedic Daily backend</strong>: Achieving <strong>&lt;150ms latency</strong> for AI guidance using <strong>FastAPI</strong> and <strong>Gemini</strong>; implemented caching to reduce external API costs by <strong>30%</strong>.</li>
        <li><strong>Developed 3 cross-platform Flutter widgets</strong>: Created 2x2, 4x2, and 4x4 widgets resulting in a <strong>12% boost</strong> in DAU via deep-linking.</li>
        <li><strong>Designed a 3-phase product roadmap</strong>: Mapped transition from Text &rarr; Comics &rarr; Video for an Indic-first platform, optimizing content ingestion throughput by <strong>40%</strong> via automated LLM-driven summarization.</li>
      </ul>

      <hr />
      
      <h2>Past Clients & Projects</h2>
      <ul>
        <li><strong>E-commerce Automation</strong>: Built custom scrapers and inventory sync tools for local retail brands.</li>
        <li><strong>Mobile Solutions</strong>: Delivered Native and Flutter/Dart applications for early-stage startups.</li>
        <li><strong>Graphic Design</strong>: Curated visual identities, social media assets, and print media for various businesses.</li>
      </ul>

      <style jsx>{`
        .personal-notes {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default FreelanceExperience;
