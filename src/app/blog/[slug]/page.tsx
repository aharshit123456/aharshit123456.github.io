import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import './../blog.css';
import { Metadata } from 'next';
import InteractiveArticle from '@/components/portfolio/InteractiveArticle';

// This function tells Next.js which paths to pre-render at build time
export async function generateStaticParams() {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  try {
    const files = fs.readdirSync(blogsDirectory);
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        slug: file.replace('.md', ''),
      }));
  } catch (error) {
    return [];
  }
}

async function getBlogContent(slug: string) {
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  const filePath = path.join(blogsDirectory, `${slug}.md`);
  
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading blog ${slug}:`, error);
  }
  return null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const content = await getBlogContent(slug);
  
  if (!content) {
    return {
      title: 'Blog Not Found | Harshit Agarwal',
      description: 'The requested blog post could not be found.',
    };
  }

  // Extract the first H1 for the title
  const titleMatch = content.match(/^# (.*)/m);
  const title = titleMatch ? titleMatch[1].replace(/&/g, 'and') : 'Blog Post';
  
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
  const description = overviewLine ? overviewLine.trim().substring(0, 155).replace(/[*_#`\n\r]/g, '').replace(/&/g, 'and') + '...' : 'Read this latest blog post on Harshit Agarwal\'s Sigma Blog.';

  return {
    title: `${title} | Harshit Agarwal Sigma Blog`,
    description: description,
    alternates: {
      canonical: `https://aharshit123456.space/blog/${slug}`,
    },
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      url: `https://aharshit123456.space/blog/${slug}`,
      siteName: 'Harshit Agarwal Portfolio',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
    },
    keywords: ['Sigma Grindset', 'Tech Blog', 'Harshit Agarwal', 'Ohio', 'Mewing', 'AI'],
    authors: [{ name: 'Harshit Agarwal' }],
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const content = await getBlogContent(slug);

  if (!content) {
    return (
      <div className="error-container">
        <h1>404 - Sigma Not Found</h1>
        <p>The requested grindset does not exist on our servers.</p>
        <Link href="/" className="back-link">Back to Desktop</Link>
      </div>
    );
  }

  // Dynamic JSON-LD structured data parameters
  const titleMatch = content.match(/^# (.*)/m);
  const title = titleMatch ? titleMatch[1] : 'Blog Post';
  
  const descriptionMatch = content.match(/^(?!#)(.*)/m);
  const description = descriptionMatch ? descriptionMatch[1].substring(0, 160).replace(/[*_#`\n\r]/g, '') : 'Read this latest blog post on Harshit Agarwal\'s Sigma Blog.';

  return (
    <div className="blog-outer">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": title,
            "description": description,
            "url": `https://aharshit123456.space/blog/${slug}`,
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
        <div className="nav-logo">SIGMA_BLOG</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <InteractiveArticle content={content} slug={slug} />
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Sigma Grindset Publishing. All gainz reserved.</p>
      </footer>
    </div>
  );
}
