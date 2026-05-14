'use client';

import { motion } from 'framer-motion';

export const Hero = ({ isFlipped, setIsFlipped, showHint }: any) => {
  return (
    <motion.section 
      className="hero-section"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="profile-flip-container" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div 
          className={`flipper ${isFlipped ? 'flipped' : ''}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="front">
            <img src="profile_new.jpg" alt="Harshit Agarwal" className="profile-pic" />
          </div>
          <div className="back">
            <img src="me.png" alt="Me IRL" className="profile-pic" />
          </div>
        </motion.div>
        <div className={`flip-hint ${showHint ? 'visible' : ''}`}>Click to flip</div>
      </div>
      <div className="hero-text">
        <motion.h1
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          &lt;Harshit Agarwal&gt;
        </motion.h1>
        <motion.h2
          initial={{ x: -20 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          // Fullstack Developer & Researcher
        </motion.h2>
        <p className="tagline">"Not everyone who works hard is rewarded, but all those who succeed have worked hard." - Genji Kamogawa</p>
        <div className="hero-links">
          <a href="#about">//about</a>
          <a href="#experience">//experience</a>
          <a href="#projects">//projects</a>
          <a href="#hackathons">//hackathons</a>
          <a href="#skills">//skills</a>
        </div>
      </div>
    </motion.section>
  );
};
