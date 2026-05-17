import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';
import '../../blog/blog.css';
import { Metadata } from 'next';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkAlert from 'remark-github-alerts';

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
  const title = titleMatch ? titleMatch[1] : 'Experience Detail';
  
  // Extract the first paragraph for the description
  const descriptionMatch = content.match(/^(?!#)(.*)/m);
  const description = descriptionMatch ? descriptionMatch[1].substring(0, 160) : 'Read details about Harshit Agarwal\'s professional experience and accomplishments.';

  return {
    title: `${title} | Work Experience`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      url: `https://aharshit123456.space/experience/${slug}`,
      siteName: 'Harshit Agarwal Portfolio',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
        },
      ],
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

  return (
    <div className="blog-outer experience-outer">
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
          <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkAlert]}
            rehypePlugins={[rehypeRaw]}
          >
            {content}
          </ReactMarkdown>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
