import React from 'react';

type ProductionKey = 'omwt' | 'pause' | 'morning';

interface ProductionItem {
  title: string;
  type: string;
  description: string;
  videoId?: string;
}

const productionData: Record<ProductionKey, ProductionItem> = {
  omwt: {
    title: "On My Way Through",
    type: "Docu-Series",
    description: "A raw and unpolished docuseries capturing the perspective of a 22-year-old navigating societal complexities. It seeks to understand the world by asking the difficult questions that demand answers.",
  },
  pause: {
    title: "Pause",
    type: "Micro Film",
    description: "A 75-second micro-film featuring the Honda SP 160. Through a deliberate interplay of right-heavy close-ups and distant, left-heavy compositions, the visual narrative explores the act of pausing to reflect amidst motion, telling a story without words.",
    videoId: "10RxkMV5kwM"
  },
  morning: {
    title: "Morning",
    type: "Micro Film",
    description: "A cinematic micro-film created in a single hour by a 15-year-old filmmaker. This experimental piece explores the entire pipeline from storyboarding to final rendering, transforming a simple morning routine into a visual experience.",
    videoId: "0g_dcVBP0ms"
  }
};

const ProductionContent: React.FC<{ prodKey: ProductionKey }> = ({ prodKey }) => {
  const data = productionData[prodKey];
  if (!data) return <div>Production not found.</div>;

  return (
    <div className="production-modal">
      <div className="prod-header">
        <h2>{data.title}</h2>
        <span className="prod-type">{data.type}</span>
      </div>
      <div className="video-container">
        {data.videoId ? (
          <iframe 
            width="100%" 
            height="400" 
            src={`https://www.youtube.com/embed/${data.videoId}`} 
            title={data.title} 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
          ></iframe>
        ) : (
          <div className="video-placeholder">
            <i className="fas fa-video-slash"></i>
            <p>[Video Archive/Upcoming]</p>
          </div>
        )}
      </div>
      <p className="prod-desc">{data.description}</p>

      <style jsx>{`
        .production-modal {
          padding: 30px;
          color: #eee;
          max-width: 800px;
          margin: 0 auto;
        }
        .prod-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 10px;
        }
        .prod-header h2 {
          margin: 0;
          color: var(--accent-color);
        }
        .prod-type {
          font-size: 0.8rem;
          text-transform: uppercase;
          background: var(--accent-color);
          color: #000;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .video-container {
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }
        .video-placeholder {
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #555;
        }
        .video-placeholder i {
          font-size: 3rem;
          margin-bottom: 10px;
        }
        .prod-desc {
          line-height: 1.6;
          font-size: 1.1rem;
          opacity: 0.9;
        }
      `}</style>
    </div>
  );
};

export default ProductionContent;
export type { ProductionKey };
