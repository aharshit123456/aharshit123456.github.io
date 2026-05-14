'use client';

import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const Lottie = dynamic(() => import('lottie-react'), { ssr: false });

export const Hero = ({ isFlipped, setIsFlipped, showHint }: any) => {
  const [typedText, setTypedText] = useState('');
  const [lottieData, setLottieData] = useState<any>(null);
  const fullText = "Fullstack Developer & Researcher";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 50);

    // Fetch Lottie Data to avoid type errors with 'path' prop
    fetch("https://lottie.host/8e3a246b-67e4-4d8b-9e6b-748443e02f5a/9Y2Z6K9z1C.json")
      .then(res => res.json())
      .then(data => setLottieData(data))
      .catch(err => console.error("Lottie load error:", err));

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.section 
      className="hero-section"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="profile-flip-container" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div 
          className={`flipper ${isFlipped ? 'flipped' : ''}`}
          whileHover={{ scale: 1.05, rotateY: isFlipped ? 190 : 10 }}
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
      <div className="hero-text" style={{ position: 'relative', flex: 1 }}>
        <motion.h1
          initial={{ clipPath: 'inset(0 100% 0 0)' }}
          animate={{ clipPath: 'inset(0 0% 0 0)' }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          &lt;Harshit Agarwal&gt;
        </motion.h1>
        <h2 style={{ height: '1.5em', fontSize: '1.2rem', color: 'var(--code-comment)' }}>
          // {typedText}
          <motion.span 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            style={{ borderLeft: '2px solid var(--accent-color)', marginLeft: '2px' }}
          />
        </h2>
        <motion.p 
          className="tagline"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          "Not everyone who works hard is rewarded, but all those who succeed have worked hard." - Genji Kamogawa
        </motion.p>
        <div className="hero-links">
          {['about', 'experience', 'projects', 'hackathons', 'skills'].map((item, idx) => (
            <motion.a 
              key={item}
              href={`#${item}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + (idx * 0.1) }}
              whileHover={{ scale: 1.1, color: 'var(--accent-color)' }}
            >
              //{item}
            </motion.a>
          ))}
        </div>

        {/* Mini Lottie Animation */}
        <div className="lottie-mini">
           {lottieData && (
             <Lottie 
               animationData={lottieData} 
               loop={true}
             />
           )}
        </div>
      </div>
    </motion.section>
  );
};
