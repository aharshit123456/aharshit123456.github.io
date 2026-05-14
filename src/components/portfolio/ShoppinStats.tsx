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
                  <circle cx={px} cy={py} r="5" className="graph-point" />
                  <text x={px} y="420" textAnchor="middle" className="graph-text">{m.label}</text>
                  <foreignObject x={px - 100} y={py - 100} width="200" height="80" className="tooltip-wrapper">
                    <div className="graph-tooltip">
                      <strong>{m.title} (Lvl {m.y})</strong><br/>
                      {m.desc}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
      <p className="graph-footer">
        *Y-Axis represents Technical Complexity & Responsibility
      </p>

      <style jsx>{`
        .timeline-container {
          padding: 20px;
          background: #111;
          border-radius: 8px;
          color: #eee;
        }
        .stats-header h2 {
          margin: 0;
          color: var(--accent-color);
        }
        .graph-scroll-wrapper {
          width: 100%;
          overflow-x: auto;
          padding-bottom: 30px;
          margin-top: 20px;
        }
        .graph-relative {
          position: relative;
          width: 800px;
          margin: 0 auto;
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
          transition: r 0.2s;
        }
        .point-group:hover .graph-point {
          r: 8;
        }
        .graph-text {
          fill: #888;
          font-size: 12px;
        }
        .tooltip-wrapper {
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s;
          overflow: visible;
        }
        .point-group:hover .tooltip-wrapper {
          opacity: 1;
        }
        .graph-tooltip {
          background: rgba(0, 0, 0, 0.9);
          border: 1px solid var(--accent-color);
          padding: 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #fff;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }
        .graph-footer {
          margin-top: 10px;
          font-size: 0.8rem;
          opacity: 0.7;
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
