import PortfolioWrapper from '@/components/portfolio/PortfolioWrapper';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

export default function Home() {
  // Read experiences dynamically for SEO crawling
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
    console.error("Error reading experiences for home SEO:", error);
  }

  // Read blogs dynamically for SEO crawling
  const blogsDirectory = path.join(process.cwd(), 'public/blogs');
  let blogs: { slug: string; title: string }[] = [];
  try {
    const blogsJsonPath = path.join(blogsDirectory, 'blogs.json');
    if (fs.existsSync(blogsJsonPath)) {
      const jsonContent = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
      blogs = jsonContent.map((b: any) => ({ slug: b.slug, title: b.title }));
    } else {
      const files = fs.readdirSync(blogsDirectory);
      blogs = files
        .filter(file => file.endsWith('.md'))
        .map(file => ({
          slug: file.replace('.md', ''),
          title: file.replace('.md', '').replace(/-/g, ' '),
        }));
    }
  } catch (error) {
    console.error("Error reading blogs for home SEO:", error);
  }

  return (
    <main>
      {/* 
        This section is hidden from users but visible to search engines and AI crawlers.
        It provides a semantic, SSR-friendly version of the portfolio content with crawlable links.
      */}
      <section className="sr-only">
        <h1>Harshit Agarwal | Fullstack Engineer & AI Researcher</h1>
        <p>
          Founding SDE & System Architect based in India. Specialized in Building Scalable Systems, AI/ML, 
          and Distributed Architectures.
        </p>

        <h2>Work Experience</h2>
        <ul>
          {experiences.map(exp => (
            <li key={exp.slug}>
              <Link href={`/experience/${exp.slug}`}>{exp.title}</Link>
            </li>
          ))}
        </ul>

        <h2>Blog Posts & Publications</h2>
        <ul>
          {blogs.map(blog => (
            <li key={blog.slug}>
              <Link href={`/blog/${blog.slug}`}>{blog.title}</Link>
            </li>
          ))}
        </ul>

        <h2>Quick Links</h2>
        <ul>
          <li><Link href="/about">About Page</Link></li>
          <li><Link href="/links">Links Page</Link></li>
          <li><Link href="/blog">All Blogs</Link></li>
          <li><Link href="/experience">All Experiences</Link></li>
          <li><Link href="/research">AI & Scientific Research</Link></li>
          <li><Link href="/research/computational-neuroscience">Computational Neuroscience Research</Link></li>
          <li><Link href="/research/protein-engineering">Protein Engineering Research</Link></li>
          <li><Link href="/research/drug-discovery">Drug Discovery Research</Link></li>
          <li><Link href="/research/cybersecurity">Cybersecurity Research</Link></li>
          <li><Link href="/research/foundation-models">Foundation Models Research</Link></li>
          <li><Link href="/papers">Academic Papers & Publications</Link></li>
          <li><Link href="/datasets">Research Datasets</Link></li>
          <li><Link href="/models">Trained AI Models</Link></li>
          <li><Link href="/now">Now (Current Activities)</Link></li>
          <li><Link href="/case-studies">Project Case Studies</Link></li>
          <li><Link href="/open-source">Open Source Work</Link></li>
          <li><Link href="/uses">Developer Uses & Stack</Link></li>
          <li><Link href="/contact">Detailed Contact</Link></li>
          <li><Link href="/reading">Reading List</Link></li>
          <li><Link href="/speaking">Speaking & Presentations</Link></li>
          <li><Link href="/ai">Artificial Intelligence Hub</Link></li>
          <li><Link href="/systems">Systems Engineering Hub</Link></li>
          <li><Link href="/engineering">Software Engineering Hub</Link></li>
        </ul>

        <h2>Frequently Asked Questions (FAQ)</h2>
        <div itemScope itemType="https://schema.org/FAQPage">
          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">Who is Harshit Agarwal?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">Harshit Agarwal is a Fullstack Software Architect and AI Researcher based in India. He acts as Founding Engineer & Lead SDE at platforms like Famcare, shoppin', and endorphind, specializing in high-throughput backend services and deep learning systems.</p>
            </div>
          </div>
          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What technologies does Harshit Agarwal use?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">Harshit specializes in Python, FastAPI, Go, C/C++, Java, React/Next.js, Flutter, PyTorch, AWS (SageMaker, EKS, EC2), Kubernetes, Rancher, Docker, PostgreSQL, Redis, and WebSockets.</p>
            </div>
          </div>
          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What research has Harshit published?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">Harshit has published research on transformer-based NLP architectures for software vulnerability exploit prediction in NVD (AIP / Springer), and has submitted gait analysis/Parkinson's Freezing of Gait prediction research to Health and Technology.</p>
            </div>
          </div>
          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What open-source projects has Harshit built?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">Harshit is the author of gaitSetPy (a Python package for high-throughput gait time-series preprocessing and modeling) and has built custom generative video nodes for ComfyUI workflows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The actual interactive macOS-style interface */}
      <PortfolioWrapper />
    </main>
  );
}

