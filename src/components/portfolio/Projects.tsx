'use client';

import { motion } from 'framer-motion';
import { projectData } from '@/data/portfolio';

export const Projects = () => {
  return (
    <section className="projects-section" id="projects">
      <h3>//projects & publications</h3>
      {projectData.map((project, idx) => (
        <motion.div 
          key={project.id} 
          className="project-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5, borderColor: 'var(--accent-color)' }}
          transition={{ delay: idx * 0.1 }}
        >
          <div className="project-header">
            <h4>{project.title} <a href={project.url}>[Web]</a> {project.github && <a href={project.github}>[GitHub]</a>}</h4>
            <span className="tech-stack">{project.tech}</span>
          </div>
          {project.bullets ? (
            <ul>
              {project.bullets.map((bullet, bIdx) => (
                <li key={bIdx} dangerouslySetInnerHTML={{ __html: bullet }} />
              ))}
            </ul>
          ) : (
            <p>{project.description}</p>
          )}
        </motion.div>
      ))}
      <hr className="divider" />
    </section>
  );
};
