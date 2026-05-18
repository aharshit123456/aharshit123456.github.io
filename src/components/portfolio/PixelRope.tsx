'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useAnimate } from 'framer-motion';

interface PixelRopeProps {
  playSound?: (sound: 'startup' | 'funk' | 'tink' | 'click') => void;
  triggerHaptic?: (pattern?: number | number[]) => void;
}

export default function PixelRope({ playSound, triggerHaptic }: PixelRopeProps) {
  const [isLatched, setIsLatched] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [scope, animate] = useAnimate();

  // Motion value for the vertical position of the handle/pull ring
  // Default (retracted) handle Y is 35px from top, fully extended is 500px
  const y = useMotionValue(35);
  
  // Create a spring version of y for smooth swaying and natural stretch rendering
  const springY = useSpring(y, { stiffness: 120, damping: 18 });

  // Dynamically calculate rotation (sway) based on movement
  const lastY = useRef(35);
  const lastTime = useRef(Date.now());
  const [swayRotation, setSwayRotation] = useState(0);

  // Handle updates to springY to calculate velocity and sway
  useEffect(() => {
    return springY.on('change', (latest) => {
      const now = Date.now();
      const dt = Math.max(1, now - lastTime.current);
      const dy = latest - lastY.current;
      const velocity = dy / dt;

      // Map velocity to rotation for a dynamic swing effect when pulled/released
      const targetRotation = Math.max(-8, Math.min(8, velocity * 45));
      setSwayRotation(targetRotation);

      lastY.current = latest;
      lastTime.current = now;
    });
  }, [springY]);

  // Slowly decay the sway rotation back to 0 or gentle passive sway
  useEffect(() => {
    const interval = setInterval(() => {
      setSwayRotation((prev) => {
        if (Math.abs(prev) < 0.05) {
          // Subtle passive sway when stationary
          return Math.sin(Date.now() / 600) * 0.4;
        }
        return prev * 0.92; // Dampen sway
      });
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // Set up the latch logic
  const handleDragEnd = async (event: any, info: any) => {
    const currentY = y.get();
    
    if (playSound) playSound('click');
    if (triggerHaptic) triggerHaptic(10);

    // If pulled down past 300px, latch it open!
    if (currentY > 300) {
      setIsLatched(true);
      setShowTooltip(false);
      if (playSound) setTimeout(() => playSound('tink'), 150);
      
      // Animate handle Y to the perfect fully-extended resting position
      animate(y, 660, {
        type: 'spring',
        stiffness: 150,
        damping: 15
      });
    } else {
      // Otherwise, snap back up
      setIsLatched(false);
      animate(y, 35, {
        type: 'spring',
        stiffness: 200,
        damping: 20
      });
    }
  };

  const handleDragStart = () => {
    if (playSound) playSound('click');
    if (triggerHaptic) triggerHaptic(8);
  };

  const toggleRope = () => {
    if (playSound) playSound('click');
    if (triggerHaptic) triggerHaptic(12);

    if (isLatched) {
      setIsLatched(false);
      animate(y, 35, {
        type: 'spring',
        stiffness: 180,
        damping: 22
      });
    } else {
      setIsLatched(true);
      setShowTooltip(false);
      if (playSound) setTimeout(() => playSound('tink'), 150);
      animate(y, 660, {
        type: 'spring',
        stiffness: 150,
        damping: 15
      });
    }
  };

  // Compute positions of 3 frames and rope segments dynamically from springY
  // Frame 3 is the bottom frame, just above the handle
  const frame3Y = useTransform(springY, (val) => val - 170);
  // Frame 2 is the middle frame, above Frame 3
  const frame2Y = useTransform(springY, (val) => val - 380);
  // Frame 1 is the top frame, above Frame 2
  const frame1Y = useTransform(springY, (val) => val - 590);

  // Hide paintings when fully retracted using opacity transition
  const opacity = useTransform(springY, [35, 220], [0, 1]);

  return (
    <div 
      ref={scope} 
      className="pixel-rope-container"
      style={{
        position: 'fixed',
        top: 0,
        right: '180px',
        width: '240px',
        height: '100vh',
        zIndex: 9999, // Floating on top of macOS workspace
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      {/* Dynamic SVG Rope */}
      <svg 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none'
        }}
      >
        <defs>
          {/* Pixelated rope pattern */}
          <pattern id="pixel-rope-pat" width="12" height="16" patternUnits="userSpaceOnUse">
            {/* Core rope body */}
            <rect x="3" y="0" width="6" height="16" fill="#c2986e" />
            {/* Highlights */}
            <rect x="5" y="0" width="2" height="16" fill="#e7c8a6" />
            {/* Left and right outline borders */}
            <rect x="1" y="0" width="2" height="16" fill="#604020" />
            <rect x="9" y="0" width="2" height="16" fill="#604020" />
            {/* Rope segment texture lines */}
            <rect x="3" y="4" width="6" height="2" fill="#9c6e46" />
            <rect x="3" y="12" width="6" height="2" fill="#9c6e46" />
          </pattern>
        </defs>

        {/* Rope Segment 1: Top of screen to Frame 1 */}
        <motion.rect
          x="114"
          y="0"
          width="12"
          height={useTransform(springY, (val) => Math.max(0, val - 590))}
          fill="url(#pixel-rope-pat)"
        />

        {/* Rope Segment 2: Connecting Frame 1 to Frame 2 */}
        <motion.rect
          x="114"
          y={useTransform(springY, (val) => Math.max(0, val - 400))}
          width="12"
          height={useTransform(springY, (val) => Math.max(0, Math.min(20, val - 380 - (val - 400))))}
          style={{ opacity }}
          fill="url(#pixel-rope-pat)"
        />

        {/* Rope Segment 3: Connecting Frame 2 to Frame 3 */}
        <motion.rect
          x="114"
          y={useTransform(springY, (val) => Math.max(0, val - 190))}
          width="12"
          height={useTransform(springY, (val) => Math.max(0, Math.min(20, val - 170 - (val - 190))))}
          style={{ opacity }}
          fill="url(#pixel-rope-pat)"
        />

        {/* Rope Segment 4: Connecting Frame 3 to Handle */}
        <motion.rect
          x="114"
          y={useTransform(springY, (val) => Math.max(0, val - 20))}
          width="12"
          height="20"
          style={{ opacity }}
          fill="url(#pixel-rope-pat)"
        />
      </svg>

      {/* Frame 1: pxArt Painting (Death of Socrates) */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          y: frame1Y,
          opacity,
          rotate: swayRotation * 0.8,
          transformOrigin: '50% -100px',
          pointerEvents: isLatched ? 'auto' : 'none'
        }}
        className="pixel-frame-wrapper"
      >
        <a 
          href="/blog/the-death-of-socrates" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}
        >
          <div className="pixel-wood-frame">
            <div className="corner-gold tl"></div>
            <div className="corner-gold tr"></div>
            <div className="corner-gold bl"></div>
            <div className="corner-gold br"></div>
            <div className="canvas-matte">
              <img 
                src="/images/pxArt.png" 
                alt="pxArt Painting" 
                className="painting-canvas"
                draggable="false"
              />
            </div>
            <div className="gold-plaque">
              <span>&lt;pxArt /&gt;</span>
            </div>
          </div>
        </a>
      </motion.div>

      {/* Frame 2: F7XKK6UM09L2A3E Painting (Starry Night) */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          y: frame2Y,
          opacity,
          rotate: swayRotation * 0.95,
          transformOrigin: '50% -120px',
          pointerEvents: isLatched ? 'auto' : 'none'
        }}
        className="pixel-frame-wrapper"
      >
        <a 
          href="/blog/the-starry-night" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}
        >
          <div className="pixel-wood-frame">
            <div className="corner-gold tl"></div>
            <div className="corner-gold tr"></div>
            <div className="corner-gold bl"></div>
            <div className="corner-gold br"></div>
            <div className="canvas-matte">
              <img 
                src="/images/F7XKK6UM09L2A3E.webp" 
                alt="F7XKK6UM Painting" 
                className="painting-canvas"
                draggable="false"
              />
            </div>
            <div className="gold-plaque">
              <span>&lt;Elysian /&gt;</span>
            </div>
          </div>
        </a>
      </motion.div>

      {/* Frame 3: scream.jpg Painting (The Scream) */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          y: frame3Y,
          opacity,
          rotate: swayRotation * 1.1,
          transformOrigin: '50% -140px',
          pointerEvents: isLatched ? 'auto' : 'none'
        }}
        className="pixel-frame-wrapper"
      >
        <a 
          href="/blog/the-scream" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', color: 'inherit', display: 'block', width: '100%', height: '100%' }}
        >
          <div className="pixel-wood-frame">
            <div className="corner-gold tl"></div>
            <div className="corner-gold tr"></div>
            <div className="corner-gold bl"></div>
            <div className="corner-gold br"></div>
            <div className="canvas-matte">
              <img 
                src="/images/scream.jpg" 
                alt="The Scream Painting" 
                className="painting-canvas"
                draggable="false"
              />
            </div>
            <div className="gold-plaque">
              <span>&lt;scream /&gt;</span>
            </div>
          </div>
        </a>
      </motion.div>

      {/* Interactive Handle (Wooden Pull Ring) */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 35, bottom: 660 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={toggleRope}
        style={{
          position: 'absolute',
          top: 0,
          y,
          x: 0,
          width: '40px',
          height: '40px',
          cursor: 'grab',
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100
        }}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        whileHover={{ scale: 1.08 }}
        className="rope-handle"
      >
        {/* SVG Pixel Pull Ring */}
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.45))' }}>
          {/* Outer dark outline (pixel style) */}
          <path d="M12 4h12v4h4v4h4v12h-4v4h-4v4H12v-4H8v-4H4V12h4V8h4V4z" fill="#4a2c11" />
          
          {/* Middle wood texture */}
          <path d="M14 6h8v2h4v4h4v8h-4v4h-4v2h-8v-2h-4v-4H6v-8h4V12h4V6z" fill="#8B5A2B" />
          
          {/* Inner ring hole outline */}
          <path d="M14 14h8v8h-8v-8z" fill="#4a2c11" />
          
          {/* Highlight top-left */}
          <path d="M14 8h4v2h-4v2h-2v4H8v-4h2V10h4V8z" fill="#d4a373" />
          
          {/* Ring Center Hole */}
          <path d="M16 16h4v4h-4v-4z" fill="none" />
        </svg>

        {/* Pulsing Hint Tag (PULL) */}
        {showTooltip && (
          <div className="pull-hint-tag">
            <span>PULL</span>
            <div className="hint-arrow"></div>
          </div>
        )}
      </motion.div>

      <style jsx global>{`
        .pixel-frame-wrapper {
          width: 190px;
          height: 190px;
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.65));
        }

        .pixel-wood-frame {
          position: relative;
          width: 100%;
          height: 100%;
          background: #7c5230; /* Medium wood */
          border: 6px solid #4a2c11; /* Dark wood border */
          outline: 4px solid #a6734c; /* Lighter outer bevel shadow */
          box-shadow: inset 0 0 0 6px #5c3a21; /* Inner frame shadow */
          padding: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          image-rendering: pixelated;
        }

        .corner-gold {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #d4a373;
          border: 2px solid #4a2c11;
          z-index: 5;
        }
        .corner-gold.tl { top: -2px; left: -2px; }
        .corner-gold.tr { top: -2px; right: -2px; }
        .corner-gold.bl { bottom: -2px; left: -2px; }
        .corner-gold.br { bottom: -2px; right: -2px; }

        .canvas-matte {
          width: 100%;
          height: calc(100% - 18px);
          background: #e8e2d5; /* Linen matte background */
          border: 4px solid #4a2c11;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .painting-canvas {
          width: 100%;
          height: 100%;
          object-fit: cover;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
          transition: transform 0.3s;
        }

        .pixel-wood-frame:hover .painting-canvas {
          transform: scale(1.05);
        }

        .gold-plaque {
          margin-top: 8px;
          background: #d4a373;
          border: 2px solid #4a2c11;
          padding: 2px 8px;
          font-family: 'Fira Code', 'Courier New', monospace;
          font-size: 8px;
          font-weight: 700;
          color: #4a2c11;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 1px 1px 0px rgba(0,0,0,0.3);
          user-select: none;
        }

        .pull-hint-tag {
          position: absolute;
          left: 50px;
          background: #d4a373;
          border: 2px solid #4a2c11;
          padding: 3px 8px;
          font-family: 'Fira Code', monospace;
          font-size: 9px;
          font-weight: 900;
          color: #4a2c11;
          border-radius: 4px;
          box-shadow: 2px 2px 0px rgba(0,0,0,0.4);
          animation: floatTag 1.5s infinite ease-in-out;
          pointer-events: none;
          white-space: nowrap;
        }

        .hint-arrow {
          position: absolute;
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
          border-right: 6px solid #4a2c11;
        }

        .hint-arrow::after {
          content: '';
          position: absolute;
          left: 2px;
          top: -3px;
          width: 0;
          height: 0;
          border-top: 3px solid transparent;
          border-bottom: 3px solid transparent;
          border-right: 5px solid #d4a373;
        }

        @keyframes floatTag {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}
