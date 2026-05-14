'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { projectData } from '@/data/portfolio';

const ProjectCard = ({ project, idx }: any) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = (e.target as HTMLDivElement).getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      className="project-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
    >
      <div style={{ transform: "translateZ(50px)" }}>
        <div className="project-header">
          <h4>{project.title} <a href={project.url}>[Web]</a> {project.github && <a href={project.github}>[GitHub]</a>}</h4>
          <span className="tech-stack">{project.tech}</span>
        </div>
        {project.bullets ? (
          <ul>
            {project.bullets.map((bullet: string, bIdx: number) => (
              <li key={bIdx} dangerouslySetInnerHTML={{ __html: bullet }} />
            ))}
          </ul>
        ) : (
          <p>{project.description}</p>
        )}
      </div>
    </motion.div>
  );
};

export const Projects = () => {
  return (
    <section className="projects-section" id="projects">
      <h3>//projects & publications</h3>
      {projectData.map((project, idx) => (
        <ProjectCard key={project.id} project={project} idx={idx} />
      ))}
      <hr className="divider" />
    </section>
  );
};
