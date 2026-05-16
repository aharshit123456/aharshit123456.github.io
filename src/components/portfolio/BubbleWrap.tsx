'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BubbleWrap() {
  const [bubbles, setBubbles] = useState<boolean[]>([]);
  const [popCount, setPopCount] = useState(0);

  // Initialize bubbles on mount to be safe
  useEffect(() => {
    setBubbles(new Array(100).fill(false));
  }, []);

  const popBubble = (index: number) => {
    if (bubbles[index]) return;
    
    setBubbles(prev => {
      const next = [...prev];
      next[index] = true;
      return next;
    });
    setPopCount(prev => prev + 1);

    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  };

  const resetBubbles = () => {
    setBubbles(new Array(100).fill(false));
    setPopCount(0);
  };

  return (
    <div className="bubble-wrap-container" style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#f8f8f8',
      padding: '16px',
      overflow: 'hidden'
    }}>
      <div className="bubble-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '16px',
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#1d1d1f' }}>{popCount}</span>
          <span style={{ fontSize: '10px', color: '#86868b', textTransform: 'uppercase', fontWeight: '700' }}>Bubbles Popped</span>
        </div>
        <button 
          onClick={resetBubbles}
          style={{ 
            background: '#007aff', color: '#fff', border: 'none', 
            padding: '8px 16px', borderRadius: '20px', fontWeight: '600', cursor: 'pointer' 
          }}
        >
          Reset
        </button>
      </div>

      <div className="scroll-area" style={{ 
        flex: 1, 
        overflowY: 'auto', 
        background: 'rgba(0,0,0,0.03)', 
        borderRadius: '16px', 
        padding: '12px' 
      }}>
        <div className="bubble-flex-container" style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px', 
          justifyContent: 'center' 
        }}>
          {bubbles.map((popped, i) => (
            <motion.div
              key={i}
              onMouseDown={(e) => { e.preventDefault(); popBubble(i); }}
              onMouseEnter={(e) => { if (e.buttons === 1) popBubble(i); }}
              onTouchStart={() => popBubble(i)}
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                borderRadius: '50%',
                background: popped ? '#ececec' : '#ffffff',
                boxShadow: popped ? 'inset 2px 2px 4px rgba(0,0,0,0.05)' : '0 3px 6px rgba(0,0,0,0.06), inset -2px -2px 4px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.04)',
                cursor: popped ? 'default' : 'pointer',
                position: 'relative',
                flexShrink: 0
              }}
              animate={popped ? { scale: 0.9, opacity: 0.6 } : { scale: 1, opacity: 1 }}
            >
              {!popped && (
                <div style={{
                  position: 'absolute',
                  top: '20%',
                  left: '20%',
                  width: '25%',
                  height: '25%',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '50%',
                  filter: 'blur(0.5px)'
                }} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
