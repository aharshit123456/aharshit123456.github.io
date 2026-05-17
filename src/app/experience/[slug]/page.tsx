import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import '../../blog/blog.css';
import { Metadata } from 'next';
import InteractiveArticle from '@/components/portfolio/InteractiveArticle';

// This function tells Next.js which paths to pre-render at build time
export async function generateStaticParams() {
  const experiencesDirectory = path.join(process.cwd(), 'public/experiences');
  try {
    const files = fs.readdirSync(experiencesDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        slug: file.replace('.md', ''),
      }));
  } catch (error) {
    return [];
  }
}

async function getExperienceContent(slug: string) {
  const experiencesDirectory = path.join(process.cwd(), 'public/experiences');
  const filePath = path.join(experiencesDirectory, `${slug}.md`);
  
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading experience ${slug}:`, error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getExperienceContent(slug);
  
  if (!content) {
    return {
      title: 'Experience Not Found | Harshit Agarwal',
      description: 'The requested experience details could not be found.',
    };
  }

  // Extract the first H1 for the title
  const titleMatch = content.match(/^# (.*)/m);
  const title = titleMatch ? titleMatch[1].replace(/&/g, 'and') : 'Experience Detail';
  
  // Extract the first paragraph for the description using our advanced crawler
  const lines = content.split('\n');
  const overviewLine = lines.find(line => {
    const trimmed = line.trim();
    return trimmed.length > 0 && 
           !trimmed.startsWith('#') && 
           !trimmed.startsWith('*') && 
           !trimmed.startsWith('-') &&
           !trimmed.includes('Duration:') &&
           !trimmed.includes('Role:') &&
           !trimmed.includes('Website:');
  });
  const description = overviewLine ? overviewLine.trim().substring(0, 155).replace(/[*_#`\n\r]/g, '').replace(/&/g, 'and') + '...' : 'Read details about Harshit Agarwal\'s professional experience and accomplishments.';

  return {
    title: `${title} | Harshit Agarwal Portfolio`,
    description: description,
    alternates: {
      canonical: `https://aharshit123456.space/experience/${slug}`,
    },
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      url: `https://aharshit123456.space/experience/${slug}`,
      siteName: 'Harshit Agarwal Portfolio',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
    },
    keywords: ['Work Experience', 'Fullstack', 'Machine Learning', 'Systems Engineer', 'Harshit Agarwal'],
    authors: [{ name: 'Harshit Agarwal' }],
  };
}

export default async function ExperiencePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getExperienceContent(slug);

  if (!content) {
    return (
      <div className="error-container">
        <h1>404 - Experience Not Found</h1>
        <p>The requested work experience details do not exist on our servers.</p>
        <Link href="/" className="back-link">Back to Desktop</Link>
      </div>
    );
  }

  // Dynamic JSON-LD structured data parameters
  const titleMatch = content.match(/^# (.*)/m);
  const title = titleMatch ? titleMatch[1] : 'Experience Detail';
  
  const descriptionMatch = content.match(/^(?!#)(.*)/m);
  const description = descriptionMatch ? descriptionMatch[1].substring(0, 160).replace(/[*_#`\n\r]/g, '') : 'Read details about Harshit Agarwal\'s professional experience and accomplishments.';

  return (
    <div className="blog-outer experience-outer">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": title,
            "description": description,
            "url": `https://aharshit123456.space/experience/${slug}`,
            "inLanguage": "en-US",
            "author": {
              "@type": "Person",
              "name": "Harshit Agarwal",
              "url": "https://aharshit123456.space/"
            },
            "publisher": {
              "@type": "Person",
              "name": "Harshit Agarwal"
            }
          })
        }}
      />
      <nav className="blog-nav">
        <Link href="/" className="back-link">
           Back to Desktop
        </Link>
        <div className="nav-logo" style={{ background: 'linear-gradient(90deg, #ff4d4d, #ff7675)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          WORK_EXPERIENCE
        </div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <InteractiveArticle content={content} slug={slug} />
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
