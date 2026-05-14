'use client';

import { motion } from 'framer-motion';

export const Section = ({ id, title, children, items, isExpanded, onToggle }: any) => {
  const displayItems = isExpanded ? items : items?.slice(0, 3) || children;

  return (
    <motion.section 
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h3>{title}</h3>
      {items ? (
        <>
          {displayItems}
          {items.length > 3 && (
            <button className="read-more-btn" onClick={onToggle}>
              {isExpanded ? (
                <>Read Less <i className="fas fa-chevron-up"></i></>
              ) : (
                <>Read More <i className="fas fa-chevron-down"></i></>
              )}
            </button>
          )}
        </>
      ) : children}
      <hr className="divider" />
    </motion.section>
  );
};
