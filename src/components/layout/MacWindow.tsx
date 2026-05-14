'use client';

import { motion, AnimatePresence } from 'framer-motion';

export const MacWindow = ({ children, isDarkMode, toggleTheme, tabs, activeTabId, switchTab, closeTab }: any) => {
  return (
    <motion.div 
      className="mac-window"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="title-bar">
        <div className="buttons">
          <div className="close"></div>
          <div className="minimize"></div>
          <div className="maximize"></div>
        </div>
        <div className="window-title">harshit_agarwal.exe</div>
        <div className="theme-toggle" onClick={toggleTheme}>
          <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"}></i>
        </div>
      </div>

      <div className="tab-bar">
        <AnimatePresence mode="popLayout">
          {tabs.map((tab: any) => (
            <motion.div
              key={tab.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
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
