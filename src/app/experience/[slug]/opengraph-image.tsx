import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const alt = 'Harshit Agarwal | Experience';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Retrieve the experience content to extract title
  const experiencesDirectory = path.join(process.cwd(), 'public/experiences');
  const filePath = path.join(experiencesDirectory, `${slug}.md`);
  let title = 'Work Experience Detail';
  let description = 'Read about Harshit Agarwal\'s professional experience and accomplishments.';

  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const titleMatch = content.match(/^# (.*)/m);
      if (titleMatch) title = titleMatch[1];
      
      const descriptionMatch = content.match(/^(?!#)(.*)/m);
      if (descriptionMatch) {
        description = descriptionMatch[1].substring(0, 130).replace(/[*_#`\n\r]/g, '') + '...';
      }
    }
  } catch (error) {
    console.error("Error reading file in OG image generator:", error);
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #090a0f 0%, #151821 100%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          position: 'relative',
          border: '4px solid #ff4d4d',
        }}
      >
        {/* Glow Element */}
        <div
          style={{
            position: 'absolute',
            top: '-150px',
            right: '-150px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 77, 77, 0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#ff4d4d',
              letterSpacing: '3px',
              textTransform: 'uppercase',
            }}
          >
            WORK_EXPERIENCE
          </div>
          <div style={{ fontSize: '18px', color: '#a0a5b5', fontWeight: 500 }}>
            aharshit123456.space
          </div>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', margin: '40px 0' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 800,
              color: '#ffffff',
              lineHeight: 1.2,
              wordBreak: 'break-word',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#a0a5b5',
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '25px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div
              style={{
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                background: '#ff4d4d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                fontWeight: 800,
                fontSize: '20px',
              }}
            >
              HA
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '18px', color: '#ffffff', fontWeight: 600 }}>Harshit Agarwal</span>
              <span style={{ fontSize: '14px', color: '#a0a5b5' }}>Fullstack Engineer & AI Researcher</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span
              style={{
                background: 'rgba(255, 77, 77, 0.1)',
                color: '#ff4d4d',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              Professional Portfolio
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
