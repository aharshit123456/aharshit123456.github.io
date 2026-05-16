'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DesktopPetProps {
  trigger?: boolean;
}

type PetState = 'idle' | 'walking' | 'mewing' | 'sleeping' | 'hidden';

const CatSVG = ({ state, direction }: { state: PetState; direction: 'left' | 'right' }) => {
  return (
    <motion.svg 
      viewBox="0 0 20 20" 
      width="64" 
      height="64" 
      style={{ 
        imageRendering: 'pixelated',
        transform: direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
      }}
    >
      {/* Shadow */}
      <ellipse cx="10" cy="18" rx="6" ry="2" fill="rgba(0,0,0,0.1)" />

      {/* Tail */}
      <motion.rect 
        x="2" y="10" width="4" height="2" fill="white" stroke="#000" strokeWidth="0.5"
        animate={{ 
          rotate: state === 'idle' ? [0, -20, 0] : [0, 10, 0],
          y: state === 'walking' ? [0, -1, 0] : 0
        }}
        transition={{ repeat: Infinity, duration: 1 }}
      />

      {/* Body */}
      <motion.rect 
        x="5" y="8" width="10" height="8" rx="1" fill="white" stroke="#000" strokeWidth="0.5"
        animate={{ 
          scaleY: state === 'idle' ? [1, 1.05, 1] : 1 
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      />

      {/* Head */}
      <motion.g
        animate={{ 
          y: state === 'walking' ? [-0.5, 0.5, -0.5] : 0
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
      >
        <rect x="7" y="4" width="8" height="7" rx="1" fill="white" stroke="#000" strokeWidth="0.5" />
        {/* Ears */}
        <path d="M7 4 L7 2 L9 4 Z" fill="white" stroke="#000" strokeWidth="0.5" />
        <path d="M13 4 L15 2 L15 4 Z" fill="white" stroke="#000" strokeWidth="0.5" />
        
        {/* Eyes */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
          transition={{ repeat: Infinity, duration: 4, times: [0, 0.9, 0.95, 0.98, 1] }}
        >
          <rect x="9" y="7" width="1.5" height="1.5" fill="#000" />
          <rect x="12" y="7" width="1.5" height="1.5" fill="#000" />
        </motion.g>

        {/* Mouth/Mew */}
        <motion.path 
          d="M10 9 Q11 10 12 9" 
          fill="none" stroke="#000" strokeWidth="0.5" 
          animate={{ d: state === 'mewing' ? "M10 9 Q11 11 12 9" : "M10 9 Q11 10 12 9" }}
        />
      </motion.g>

      {/* Legs */}
      <motion.rect 
        x="6" y="15" width="2" height="3" fill="white" stroke="#000" strokeWidth="0.5"
        animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 0.4, delay: 0 }}
      />
      <motion.rect 
        x="12" y="15" width="2" height="3" fill="white" stroke="#000" strokeWidth="0.5"
        animate={{ y: state === 'walking' ? [0, -2, 0] : 0 }}
        transition={{ repeat: Infinity, duration: 0.4, delay: 0.2 }}
      />
    </motion.svg>
  );
};

export default function DesktopPet({ trigger = false }: DesktopPetProps) {
  const [state, setState] = useState<PetState>('hidden');
  const [position, setPosition] = useState({ x: -100, y: 0 });
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [speech, setSpeech] = useState<string | null>(null);

  useEffect(() => {
    if (trigger && state === 'hidden') {
      setState('walking');
      setPosition({ x: -100, y: window.innerHeight - 150 });
    }
  }, [trigger, state]);

  useEffect(() => {
    if (state === 'hidden') return;

    const interval = setInterval(() => {
      if (state === 'walking') {
        setPosition(prev => {
          const targetX = 300; // Walk to this point first
          const speed = 2;
          if (Math.abs(prev.x - targetX) < 5) {
            setState('idle');
            return prev;
          }
          return { ...prev, x: prev.x + speed };
        });
      }

      // Randomly Mew
      if (state === 'idle' && Math.random() > 0.98) {
        setState('mewing');
        const phrases = ["Mew!", "Bye-bye! 👋", "Aura +1000", "🤫🧏‍♂️", "Skibidi?"];
        setSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
        setTimeout(() => {
          setSpeech(null);
          setState('idle');
        }, 3000);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [state]);

  return (
    <AnimatePresence>
      {state !== 'hidden' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            zIndex: 9999,
            pointerEvents: 'auto',
            cursor: 'grab'
          }}
          drag
          dragConstraints={{ left: 0, right: window.innerWidth - 64, top: 0, bottom: window.innerHeight - 64 }}
        >
          {speech && (
            <motion.div 
              initial={{ scale: 0, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="pet-speech"
            >
              {speech}
              <div className="speech-arrow" />
            </motion.div>
          )}
          <CatSVG state={state} direction={direction} />

          <style jsx>{`
            .pet-speech {
              position: absolute;
              bottom: 100%;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              border: 2px solid #000;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              margin-bottom: 10px;
              color: black;
              box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
            }
            .speech-arrow {
              position: absolute;
              top: 100%;
              left: 50%;
              transform: translateX(-50%);
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid #000;
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
