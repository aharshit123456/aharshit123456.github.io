'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { experienceData } from '@/data/portfolio';

export const Experience = ({ onOpenNotes, onOpenStats, onOpenImage }: any) => {
  const [visibleScreenshots, setVisibleScreenshots] = useState<Record<string, boolean>>({});

  const toggleScreenshots = (id: string) => {
    setVisibleScreenshots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="experience-section" id="experience">
      <h3>//work_experience</h3>
      {experienceData.map((exp, idx) => (
        <motion.div 
          key={exp.id} 
          className="exp-item"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="time">{exp.period}</div>
          <div className="details">
            <h4>
              <a href={exp.url} style={{ color: '#ff4d4d' }}>{exp.company}</a>
              <span className="role">// {exp.role}</span>
              {exp.hasScreenshots && (
                <button 
                  className={`screenshot-toggle ${visibleScreenshots[exp.id] ? 'active' : ''}`} 
                  onClick={() => toggleScreenshots(exp.id)}
                >
                  <i className={visibleScreenshots[exp.id] ? "fas fa-times" : "fas fa-images"}></i> {visibleScreenshots[exp.id] ? 'Hide' : 'Screenshots'}
                </button>
              )}
              {exp.links?.map((link, lIdx) => (
                <a key={lIdx} href={link.url} target="_blank" className="store-link" title={link.title}>
                  <i className={link.icon}></i>
                </a>
              ))}
            </h4>
            <ul>
              {exp.bullets.map((bullet, bIdx) => (
                <li key={bIdx} dangerouslySetInnerHTML={{ __html: bullet }} />
              ))}
              {exp.id === 'famcare' && (
                <li style={{ listStyle: 'none', marginLeft: '-20px', marginTop: '10px' }}>
                  <button onClick={onOpenNotes} className="hobby-btn" style={{ fontSize: '0.8rem', padding: '5px 15px' }}>
                    <i className="fas fa-book-open"></i> Personal Notes & Learning
                  </button>
                </li>
              )}
              {exp.id === 'shoppin' && (
                <li style={{ listStyle: 'none', marginLeft: '-20px', marginTop: '10px' }}>
                  <button onClick={onOpenStats} className="hobby-btn" style={{ fontSize: '0.8rem', padding: '5px 15px' }}>
                    <i className="fas fa-chart-line"></i> View Progression (Lv. 1 &rarr; Lv. 10)
                  </button>
                </li>
              )}
            </ul>
            {visibleScreenshots[exp.id] && exp.screenshots && (
              <motion.div 
                className="screenshot-viewer"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
              >
                <div className="screenshot-scroller">
                  {exp.screenshots.map((src, sIdx) => (
                    <img key={sIdx} src={src} alt={`${exp.company} screenshot ${sIdx + 1}`} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ))}
      <hr className="divider" />
    </section>
  );
};
