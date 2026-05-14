'use client';

import { useState, useEffect, useRef } from 'react';

type Roast = {
  text: string;
  trigger?: () => boolean;
};

export default function SiriAssistant({ batteryLevel, isDarkMode }: { batteryLevel: number, isDarkMode: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const roasts: Roast[] = [
    { text: "Scanning projects... 500+ commits? Go touch some grass, Harshit." },
    { text: `Battery at ${batteryLevel}%. Just like your social battery after this hackathon.` },
    { text: "Looking at your skills... You know 'Go'? More like 'Go get some sleep'." },
    { text: "Architecture notes for FamCARE? Looks more like a love letter to FastAPI." },
    { text: "Kickboxing bronze medal? I guess you can fight your bugs now." },
    { text: "Hajime no Ippo quote? Still waiting for that Dempsey Roll in your CSS transitions." },
    { text: "You build 'Scalable Systems' but can't scale your sleep schedule?" },
    { text: "4 repositories for one startup? Someone's a fan of micro-monolith-hell." },
    { text: "Letterboxd link found. Watching 500 movies won't make your UI look like Inception." },
    { text: "Found a link to 'Old Version'. Even your portfolio has a redemption arc." },
    { text: "Undergrad at KIIT? I see you've mastered the art of 'Assignment-Driven Development'." }
  ];

  const triggerRoast = () => {
    if (isTyping) return;
    
    // Play Siri-like sound
    const siriSound = new Audio('https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Glass.mp3');
    siriSound.volume = 0.4;
    siriSound.play().catch(() => {
      // Fallback to local click
      const fallback = new Audio('/click.mp3');
      fallback.volume = 0.2;
      fallback.play().catch(() => {});
    });

    setIsOpen(true);
    setIsTyping(true);
    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)].text;
    
    // Voice Roast
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(randomRoast);
      const voices = window.speechSynthesis.getVoices();
      
      // Try to find a good "Siri-like" voice (Samantha is the classic macOS Siri voice)
      const siriVoice = voices.find(v => v.name.includes('Samantha') || v.name.includes('Siri')) || voices[0];
      if (siriVoice) utterance.voice = siriVoice;
      
      utterance.pitch = 1.1;
      utterance.rate = 1;
      window.speechSynthesis.speak(utterance);
    }
    
    let i = 0;
    setMessage('');
    const interval = setInterval(() => {
      setMessage(prev => prev + randomRoast[i]);
      i++;
      if (i >= randomRoast.length) {
        clearInterval(interval);
        setIsTyping(false);
        // Auto-close after 10 seconds to allow for speech to finish
        setTimeout(() => setIsOpen(false), 10000);
      }
    }, 40);
  };

  return (
    <div className="siri-container">
      {/* The Orb in Menu Bar */}
      <div 
        className={`siri-orb ${isOpen ? 'active' : ''}`} 
        onClick={triggerRoast}
        title="Ask Siri (Roast Mode)"
      >
        <div className="orb-layer layer-1"></div>
        <div className="orb-layer layer-2"></div>
        <div className="orb-layer layer-3"></div>
      </div>

      {/* The Message Panel */}
      {isOpen && (
        <div className="siri-panel">
          <div className="siri-content">
            <div className="siri-icon-small">
              <div className="orb-layer layer-1"></div>
            </div>
            <p className="siri-message">{message}<span className="cursor">|</span></p>
          </div>
          <div className="siri-footer">AI Assistant (Roast Edition)</div>
        </div>
      )}

      <style jsx>{`
        .siri-container {
          position: relative;
          display: flex;
          align-items: center;
          padding: 0 10px;
          height: 100%;
          cursor: pointer;
        }

        .siri-container:hover {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }

        .siri-orb {
          width: 22px;
          height: 22px;
          position: relative;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: saturate(1.5);
        }

        .siri-orb:hover {
          transform: scale(1.2);
        }

        .siri-orb.active {
          animation: pulse 2s infinite;
        }

        .orb-layer {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          mix-blend-mode: screen;
          filter: blur(2px);
        }

        .layer-1 {
          background: radial-gradient(circle, #4285f4, transparent 70%);
          animation: rotate 4s infinite linear;
        }

        .layer-2 {
          background: radial-gradient(circle, #ea4335, transparent 70%);
          animation: rotate 3s infinite linear reverse;
          opacity: 0.7;
        }

        .layer-3 {
          background: radial-gradient(circle, #fbbc05, transparent 70%);
          animation: rotate 5s infinite linear;
          opacity: 0.5;
        }

        @keyframes rotate {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          to { transform: rotate(360deg) scale(1); }
        }

        @keyframes pulse {
          0% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.3); filter: brightness(1.5) blur(1px); }
          100% { transform: scale(1); filter: brightness(1); }
        }

        .siri-panel {
          position: fixed;
          top: 40px;
          right: 20px;
          width: 320px;
          background: ${isDarkMode ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border-radius: 12px;
          padding: 15px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 10000;
          animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .siri-content {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .siri-icon-small {
          width: 24px;
          height: 24px;
          position: relative;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .siri-message {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: ${isDarkMode ? '#fff' : '#000'};
          margin: 0;
        }

        .cursor {
          display: inline-block;
          width: 2px;
          animation: blink 0.8s infinite;
          color: var(--accent-color);
          margin-left: 2px;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .siri-footer {
          margin-top: 12px;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          opacity: 0.4;
          text-align: right;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
