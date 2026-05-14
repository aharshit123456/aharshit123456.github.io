'use client';

import { motion } from 'framer-motion';

const skillsData = [
  { category: "Languages", items: "Python, C/C++, Java, Go, JS/TS, Kotlin, C#" },
  { category: "Frameworks", items: "NextJS, React, Flutter, FastAPI, PyTorch, TensorFlow" },
  { category: "Cloud/DevOps", items: "AWS, Docker, K8s, Terraform, CI/CD" },
  { category: "Databases", items: "PostgreSQL, MongoDB, Redis, Firebase" },
  { category: "Tools", items: "Git, Linux, Unity, ROS" }
];

export const Skills = () => {
  return (
    <section className="skills-section" id="skills">
      <h3>//tale_of_the_tape (skills)</h3>
      <div className="skills-grid">
        {skillsData.map((skill, idx) => (
          <motion.div 
            key={idx}
            className="skill-category"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -5, borderColor: 'var(--accent-color)' }}
            transition={{ delay: idx * 0.05 }}
          >
            <strong>{skill.category}:</strong><br /> [{skill.items}]
          </motion.div>
        ))}
      </div>
      <hr className="divider" />
    </section>
  );
};
