'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRef, useEffect } from 'react';

export const MacWindow = ({ children, isDarkMode, toggleTheme, tabs, activeTabId, switchTab, closeTab }: any) => {
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (windowRef.current) {
        const rect = windowRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        windowRef.current.style.setProperty('--mouse-x', `${x}%`);
        windowRef.current.style.setProperty('--mouse-y', `${y}%`);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <motion.div
      ref={windowRef}
      className="mac-window"
      initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 100,
        duration: 0.8 
      }}
    >
      <div className="title-bar">
        <div className="buttons">
          <div className="close"></div>
          <div className="minimize"></div>
          <div className="maximize"></div>
        </div>
        <div className="window-title">harshit_agarwal.dmg</div>
        <div className="theme-toggle" onClick={toggleTheme}>
          <motion.i 
            key={isDarkMode ? 'sun' : 'moon'}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}
          />
        </div>
      </div>

      <div className="tab-bar">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab: any) => (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -2 }}
              className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
              onClick={() => switchTab(tab.id)}
            >
              <span className="tab-title">{tab.title}</span>
              {tab.id !== 'main' && (
                <span className="tab-close" onClick={(e) => closeTab(e, tab.id)}>
                  <i className="fas fa-times"></i>
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="content-container">
        {children}
      </div>
    </motion.div>
  );
};
