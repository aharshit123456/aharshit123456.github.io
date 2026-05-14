'use client';

import { motion } from 'framer-motion';

const freelanceData = [
  {
    company: "Olive Ridley Media",
    role: "Freelance SDE (AI & Product Strategy)",
    period: "Apr 2026 -- Present",
    details: [
      "Architected Vedic Daily backend, achieving <150ms latency for AI guidance using FastAPI and Gemini; implemented caching to reduce external API costs by 30%.",
      "Developed 3 cross-platform Flutter widgets (2x2, 4x2, 4x4), resulting in a 12% boost in DAU via deep-linking.",
      "Designed a 3-phase product roadmap (Text → Comics → Video) for an Indic-first platform, optimizing content ingestion throughput by 40% via automated LLM-driven summarization."
    ]
  }
];

export const Freelance = () => {
  return (
    <section id="freelance">
      <h3>//freelance_clients</h3>
      <div className="freelance-grid">
        {freelanceData.map((item, idx) => (
          <motion.div 
            key={idx}
            className="project-card"
            whileHover={{ scale: 1.02, borderColor: 'var(--accent-color)' }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
          >
            <div className="project-header">
              <h4 style={{ color: 'var(--accent-color)' }}>{item.company}</h4>
              <span className="time">{item.period}</span>
            </div>
            <p className="role" style={{ marginBottom: '10px', display: 'block' }}>{item.role}</p>
            <ul>
              {item.details.map((detail, dIdx) => (
                <li key={dIdx}>{detail}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
      <hr className="divider" />
    </section>
  );
};
