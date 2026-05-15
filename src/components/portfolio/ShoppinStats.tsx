import React from 'react';

const ShoppinStats: React.FC = () => {
  const milestones = [
    { x: 5, y: 3, label: 'Dec \'24', title: 'Multimodal AI', desc: 'Starting Intern. CLIP/VLLM systems.' },
    { x: 30, y: 4, label: 'Apr \'25', title: 'Backend APIs', desc: 'CRUD APIs, Robust Patterns.' },
    { x: 42, y: 5, label: 'May \'25', title: 'Aesthetic Agents', desc: 'Classifying Stores (Human Params) & Redis.' },
    { x: 55, y: 6, label: 'Jul \'25', title: 'Internal Tools', desc: 'Techblogs, Dashboards & On-Call Reliability.' },
    { x: 70, y: 7, label: 'Aug \'25', title: 'Order Agents', desc: 'Shopify Order Placement & Automations.' },
    { x: 80, y: 8, label: 'Sep \'25', title: 'Scale & Rancher', desc: 'Rancher Expansion & 200+ Store Scrapers.' },
    { x: 95, y: 10, label: 'Nov \'25', title: 'Microservices', desc: 'Event-Driven SQS/DLQ Architecture.' }
  ];

  const [selectedMilestone, setSelectedMilestone] = React.useState<typeof milestones[0] | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = React.useState<typeof milestones[0] | null>(null);
  const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const formatPoints = milestones.map(m => {
    const px = m.x * 8;
    const py = 400 - (m.y * 35);
    return `${px},${py}`;
  }).join(' ');

  return (
    <div className="timeline-container">
      <div className="stats-header">
        <h2>Stats: shoppin'</h2>
        <p>Level Progression (Dec '24 - Nov '25)</p>
        <p className="mobile-hint"> <i className="fas fa-arrows-alt-h"></i> Scroll to view full timeline</p>
      </div>
      
      <div className="graph-scroll-wrapper">
        <div className="graph-relative">
          <svg className="graph-svg" viewBox="0 0 850 450" preserveAspectRatio="xMidYMid meet">
            {/* Grid Lines */}
            <line x1="0" y1="365" x2="800" y2="365" className="grid-line" />
            <line x1="0" y1="190" x2="800" y2="190" className="grid-line" />
            <line x1="0" y1="15" x2="800" y2="15" className="grid-line" />
            
            {/* Axes */}
            <line x1="0" y1="400" x2="800" y2="400" className="graph-axis" />
            <line x1="0" y1="400" x2="0" y2="0" className="graph-axis" />
            
            {/* Path */}
            <polyline points={formatPoints} className="graph-line" />
            
            {/* Points */}
            {milestones.map((m, i) => {
              const px = m.x * 8;
              const py = 400 - (m.y * 35);
              return (
                <g key={i} className="point-group">
                  <circle cx={px} cy={py} r="6" className="graph-point" />
                  <circle 
                    cx={px} 
                    cy={py} 
                    r="15" 
                    className="point-hitbox" 
                    fill="white" 
                    fillOpacity="0"
                    style={{ cursor: 'pointer', pointerEvents: 'all' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic([15, 30, 15]);
                      setSelectedMilestone(m);
                    }}
                    onMouseEnter={() => {
                      triggerHaptic(5);
                    }}
                  />
                  <text x={px} y="430" textAnchor="middle" className="graph-text">{m.label}</text>
                  <foreignObject 
                    x={px - 110} 
                    y={py + 15} 
                    width="220" 
                    height="160" 
                    className="tooltip-fo"
                  >
                    <div className="graph-tooltip tooltip-below">
                      <div className="tooltip-title">{m.title}</div>
                      <div className="tooltip-lvl">Level {m.y}</div>
                      <div className="tooltip-desc">{m.desc}</div>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Milestone Modal */}
      {selectedMilestone && (
        <div className="milestone-modal-overlay" onClick={() => { triggerHaptic(10); setSelectedMilestone(null); }}>
          <div className="milestone-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => { triggerHaptic(10); setSelectedMilestone(null); }}>&times;</button>
            <div className="modal-header">
              <div className="modal-date">{selectedMilestone.label}</div>
              <h2>{selectedMilestone.title}</h2>
              <div className="modal-badge">Experience Level {selectedMilestone.y}</div>
            </div>
            <div className="modal-content">
              <h3>Achievements & Impact</h3>
              <p>{selectedMilestone.desc}</p>
              <div className="modal-meta">
                <div className="meta-item">
                  <i className="fas fa-microchip"></i>
                  <span>Tech Stack Core Focus</span>
                </div>
                <div className="meta-item">
                  <i className="fas fa-chart-line"></i>
                  <span>System Scalability Contribution</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <p className="graph-footer">
        *Y-Axis represents Technical Complexity & Responsibility
      </p>

      <style jsx>{`
        .timeline-container {
          padding: 20px;
          background: #111;
          border-radius: 8px;
          color: #eee;
          width: 100%;
          box-sizing: border-box;
        }
        .stats-header h2 {
          margin: 0;
          color: var(--accent-color);
        }
        .graph-scroll-wrapper {
          width: 100%;
          overflow-x: auto;
          padding: 30px 0 150px;
          margin-top: 10px;
          position: relative;
        }
        .graph-relative {
          position: relative;
          width: 850px;
          height: 450px;
          margin: 0 auto;
        }
        .graph-svg {
          width: 100%;
          height: 100%;
          display: block;
        }
        .grid-line {
          stroke: rgba(255, 255, 255, 0.05);
          stroke-width: 1;
        }
        .graph-axis {
          stroke: #444;
          stroke-width: 2;
        }
        .graph-line {
          fill: none;
          stroke: var(--accent-color);
          stroke-width: 3;
          stroke-linejoin: round;
        }
        .graph-point {
          fill: var(--accent-color);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: drop-shadow(0 0 5px var(--accent-color));
        }
        .point-group:hover .graph-point {
          r: 10;
          fill: #fff;
        }
        .graph-text {
          fill: #888;
          font-size: 11px;
          font-weight: 500;
        }
        .tooltip-fo {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transition: all 0.2s ease;
          overflow: visible;
        }
        .point-group:hover .tooltip-fo {
          opacity: 1;
          visibility: visible;
          transform: translateY(5px);
        }
        .graph-tooltip {
          background: #1a1a1a;
          border: 2px solid var(--accent-color);
          padding: 12px;
          border-radius: 12px;
          color: #fff;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          width: 220px;
          text-align: center;
          pointer-events: none;
          position: relative;
        }
        .tooltip-below::after {
          content: '';
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid var(--accent-color);
        }
        .tooltip-title {
          font-weight: 700;
          color: var(--accent-color);
          font-size: 0.9rem;
          margin-bottom: 2px;
        }
        .tooltip-lvl {
          font-size: 0.7rem;
          opacity: 0.6;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .tooltip-desc {
          font-size: 0.8rem;
          line-height: 1.4;
          opacity: 0.9;
        }

        /* Modal Styles */
        .milestone-modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 1000000;
          display: flex;
          justify-content: center;
          align-items: center;
          pointer-events: auto;
          animation: fadeIn 0.3s ease;
        }
        .milestone-modal {
          background: #1a1a1a;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          max-width: 500px;
          width: 90%;
          max-height: 85%;
          overflow-y: auto;
          padding: 30px;
          position: relative;
          box-shadow: 0 30px 60px rgba(0,0,0,0.8);
          animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .close-modal {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .close-modal:hover { background: var(--accent-color); }
        .modal-header { margin-bottom: 25px; }
        .modal-date { color: var(--accent-color); font-size: 0.8rem; font-weight: 600; margin-bottom: 5px; }
        .modal-header h2 { font-size: 1.8rem; margin: 0; margin-bottom: 10px; }
        .modal-badge { background: rgba(255,255,255,0.05); padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; display: inline-block; }
        .modal-content h3 { font-size: 1rem; color: var(--accent-color); margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; }
        .modal-content p { line-height: 1.6; opacity: 0.9; margin-bottom: 25px; }
        .modal-meta { display: flex; flex-direction: column; gap: 15px; }
        .meta-item { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; opacity: 0.7; }
        .meta-item i { color: var(--accent-color); width: 16px; }

        .graph-footer {
          margin-top: 15px;
          font-size: 0.75rem;
          opacity: 0.5;
          text-align: center;
        }
        .mobile-hint {
          font-size: 0.75rem;
          opacity: 0.6;
          margin-top: 5px;
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-hint {
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

export default ShoppinStats;
