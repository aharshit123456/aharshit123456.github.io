'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VoxelHertaOverlayProps {
  isOpen?: boolean;
  onClose: () => void;
}

export default function VoxelHertaOverlay({ onClose }: VoxelHertaOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(6, 4, 10, 0.96)',
        backdropFilter: 'blur(20px)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        userSelect: 'none'
      }}
      onClick={onClose}
    >
      {/* Neon Purple Ambient Glows */}
      <div style={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '40px',
          right: '40px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: '#d8b4fe',
          padding: '12px 28px',
          borderRadius: '30px',
          cursor: 'pointer',
          fontSize: '15px',
          fontWeight: '600',
          fontFamily: 'system-ui, sans-serif',
          backdropFilter: 'blur(8px)',
          zIndex: 10,
          boxShadow: '0 0 15px rgba(168,85,247,0.1)',
          transition: 'all 0.3s ease'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
          e.currentTarget.style.boxShadow = '0 0 25px rgba(168,85,247,0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
          e.currentTarget.style.boxShadow = '0 0 15px rgba(168,85,247,0.1)';
        }}
      >
        Close View
      </button>

      {/* Cinematic Title-Screen Character Container (Frameless) */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* The Character (Frameless, Zoomed-in) */}
        <motion.div
          initial={{ scale: 0.3, rotate: -45, x: -200, y: 200, opacity: 0 }}
          animate={{ scale: 1.25, rotate: 0, x: 0, y: 0, opacity: 1 }}
          exit={{ scale: 0.3, rotate: -45, x: -200, y: 200, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 45, 
            damping: 14,
            mass: 1.2
          }}
          style={{
            width: '500px',
            height: '500px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            filter: 'drop-shadow(0 25px 50px rgba(168, 85, 247, 0.45))',
            cursor: 'pointer'
          }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Pure SVG Vector Render of Herta Wielding her Hammer */}
          <img
            src="/images/herta.svg"
            alt="Madam Herta Pixel Art SVG"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              imageRendering: 'pixelated',
              pointerEvents: 'none',
              userSelect: 'none'
            }}
          />
        </motion.div>

        {/* Title / Name Plate (Pops up AFTER character finishes rotating/sliding in) */}
        <motion.div
          initial={{ scale: 0.7, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.7, y: 50, opacity: 0 }}
          transition={{ 
            type: 'spring', 
            stiffness: 80, 
            damping: 15,
            delay: 0.9 // Delayed until character completes ~3/4 of the entry spring
          }}
          style={{
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif'
          }}
        >
          <h1 style={{
            margin: 0,
            color: '#fff',
            fontSize: '44px',
            fontWeight: '900',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow: '0 0 20px rgba(168, 85, 247, 0.8), 0 0 40px rgba(168, 85, 247, 0.4)',
            background: 'linear-gradient(to bottom, #ffffff 30%, #e9d5ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Madam Herta
          </h1>
          <p style={{
            margin: 0,
            color: '#c084fc',
            fontSize: '16px',
            fontWeight: '700',
            letterSpacing: '1px',
            textTransform: 'uppercase',
            opacity: 0.9,
            textShadow: '0 0 10px rgba(192, 132, 252, 0.5)'
          }}>
            Genius Society #83
          </p>

          {/* Original Creator Credit Link */}
          <motion.a
            href="https://www.reddit.com/r/HonkaiStarRail/comments/14o3t7s/pixel_art_herta_by_me/"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.3 }}
            style={{
              marginTop: '16px',
              color: '#c084fc',
              fontSize: '12px',
              textDecoration: 'none',
              letterSpacing: '0.5px',
              borderBottom: '1px dashed rgba(192, 132, 252, 0.4)',
              paddingBottom: '2px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              zIndex: 20
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = '#e9d5ff';
              e.currentTarget.style.borderBottom = '1px solid #e9d5ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.opacity = '0.55';
              e.currentTarget.style.color = '#c084fc';
              e.currentTarget.style.borderBottom = '1px dashed rgba(192, 132, 252, 0.4)';
            }}
            onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing modal
          >
            Original Herta Pixel Art by /u/ButrChiknMan (Reddit)
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  );
}
