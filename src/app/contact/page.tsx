import React from 'react';
import Link from 'next/link';
import '../blog/blog.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Harshit Agarwal Portfolio',
  description: 'How to contact and connect with Harshit Agarwal.',
  alternates: {
    canonical: 'https://aharshit123456.space/contact',
  },
};

export default function ContactPage() {
  return (
    <div className="blog-outer">
      <nav className="blog-nav">
        <Link href="/" className="back-link">
          Back to Desktop
        </Link>
        <div className="nav-logo">CONTACT_ME</div>
      </nav>
      
      <main className="blog-content">
        <article className="article-card markdown-body">
          <h1>Get In Touch</h1>
          <p>Connect with me regarding fullstack software engineering, AI research collaboration, or systems consulting.</p>
          
          <h2>Contact Channels</h2>
          <ul>
            <li><strong>Email:</strong> <a href="mailto:aharshit123456@gmail.com">aharshit123456@gmail.com</a></li>
            <li><strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/aharshit123456/" target="_blank" rel="noopener noreferrer">linkedin.com/in/aharshit123456</a></li>
            <li><strong>GitHub:</strong> <a href="https://github.com/aharshit123456" target="_blank" rel="noopener noreferrer">github.com/aharshit123456</a></li>
            <li><strong>X / Twitter:</strong> <a href="https://x.com/aharshit123456" target="_blank" rel="noopener noreferrer">x.com/aharshit123456</a></li>
          </ul>

          <h2>Academic Coordinates</h2>
          <ul>
            <li><strong>ORCID ID:</strong> <a href="https://orcid.org/0009-0000-2173-1740" target="_blank" rel="noopener noreferrer">0009-0000-2173-1740</a></li>
            <li><strong>Google Scholar:</strong> <a href="https://scholar.google.com/citations?user=VSiAoGoAAAAJ&hl=en" target="_blank" rel="noopener noreferrer">Google Scholar Profile</a></li>
          </ul>
        </article>
      </main>

      <footer className="blog-footer">
        <p>© 2026 Harshit Agarwal. All rights reserved.</p>
      </footer>
    </div>
  );
}
