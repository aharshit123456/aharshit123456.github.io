import React from 'react';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Work Experience | Harshit Agarwal Portfolio',
  description: 'Read the detailed professional work experience history of Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/experience',
  },
};

export default async function ExperienceIndexPage() {
  const experiencesDirectory = path.join(process.cwd(), 'public/experiences');
  let experiences: { slug: string; title: string }[] = [];
  try {
    if (fs.existsSync(experiencesDirectory)) {

      const files = fs.readdirSync(experiencesDirectory);
      experiences = files
        .filter(file => file.endsWith('.md'))
        .map(file => {
          const slug = file.replace('.md', '');
          const content = fs.readFileSync(path.join(experiencesDirectory, file), 'utf8');
          const titleMatch = content.match(/^# (.*)/m);
          const title = titleMatch ? titleMatch[1] : slug.replace(/-/g, ' ');
          return { slug, title };
        });
    }
  } catch (error) {
    console.error("Error reading experiences:", error);
  }

  return (
    <div className="experience-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">WORK_EXPERIENCE</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Work Experience</h1>
          <p>Detailed technical records of roles and systems architected.</p>
          <div className="experience-list" style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {experiences.map((exp: any) => (
              <div key={exp.slug} className="blog-item" style={{ borderBottom: '1px solid rgba(255, 77, 77, 0.1)', paddingBottom: '20px' }}>
                <Link href={`/experience/${exp.slug}`} className="blog-link" style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {exp.title}
                </Link>
              </div>
            ))}
          </div>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
