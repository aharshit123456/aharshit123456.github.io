import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import fs from 'fs';
import path from 'path';
import './../blog.css';
import { Metadata } from 'next';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import remarkAlert from 'remark-github-alerts';

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
  const title = titleMatch ? titleMatch[1] : 'Blog Post';
  
  // Extract the first paragraph for the description
  const descriptionMatch = content.match(/^(?!#)(.*)/m);
  const description = descriptionMatch ? descriptionMatch[1].substring(0, 160) : 'Read this latest blog post on Harshit Agarwal\'s Sigma Blog.';

  return {
    title: `${title} | Sigma Blog`,
    description: description,
    openGraph: {
      title: title,
      description: description,
      type: 'article',
      url: `https://aharshit123456.space/blog/${slug}`,
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

  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
           Back to Desktop
        </Link>
        <div className="nav-logo">SIGMA_BLOG</div>
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
        <p>© 2026 Sigma Grindset Publishing. All gainz reserved.</p>
      </footer>
    </div>
  );
}
