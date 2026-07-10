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
              <p itemProp="text">Harshit Agarwal is a Fullstack Software Architect, Infrastructure Engineer, and AI Researcher based in India. He acts as Founding Engineer & Lead SDE at platforms like Famcare, shoppin', and endorphind, specializing in high-throughput backend services, cloud infrastructure-as-code (Terraform, AWS ECS/RDS/ALB), and deep learning systems. At FamCare, he brought the entire production stack under Terraform with zero downtime, built an isolated staging environment with its own Aurora Serverless v2 database, and shipped a full CI/CD pipeline for it.</p>
            </div>
          </div>
          <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
            <h3 itemProp="name">What technologies does Harshit Agarwal use?</h3>
            <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
              <p itemProp="text">Harshit specializes in Python, FastAPI, Go, C/C++, Java, React/Next.js, Flutter, PyTorch, Terraform, AWS (ECS Fargate, Aurora PostgreSQL, ALB, Secrets Manager, CloudWatch, S3, DynamoDB), GitHub Actions, Docker, PostgreSQL, Redis, and WebSockets.</p>
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

        <h2>Portfolio Gallery & Concept Diagrams</h2>
        <div className="seo-gallery">
          <h3>Delhi & Shopping Highlights</h3>
          <ul>
            <li><img src="/gallery/delhi-shopping/1780959476156.jpeg" alt="Delhi trip and shopping photo 1" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476321.jpeg" alt="Delhi trip and shopping photo 2" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476161.jpeg" alt="Delhi trip and shopping photo 3" /></li>
            <li><img src="/gallery/delhi-shopping/1780959475584.jpeg" alt="Delhi trip and shopping photo 4" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476608.jpeg" alt="Delhi trip and shopping photo 5" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476425.jpeg" alt="Delhi trip and shopping photo 6" /></li>
            <li><img src="/gallery/delhi-shopping/1780959474802.jpeg" alt="Delhi trip and shopping photo 7" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476168.jpeg" alt="Delhi trip and shopping photo 8" /></li>
            <li><img src="/gallery/delhi-shopping/1780959474708.jpeg" alt="Delhi trip and shopping photo 9" /></li>
            <li><img src="/gallery/delhi-shopping/1780959475708.jpeg" alt="Delhi trip and shopping photo 10" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476299.jpeg" alt="Delhi trip and shopping photo 11" /></li>
            <li><img src="/gallery/delhi-shopping/1780959476174.jpeg" alt="Delhi trip and shopping photo 12" /></li>
          </ul>

          <h3>NISER Campus & Times</h3>
          <ul>
            <li><img src="/gallery/niser-times/1780776777123.jpeg" alt="NISER undergrad times and research internship photo 1" /></li>
            <li><img src="/gallery/niser-times/1780776776660.jpeg" alt="NISER undergrad times and research internship photo 2" /></li>
            <li><img src="/gallery/niser-times/1780776776714.jpeg" alt="NISER undergrad times and research internship photo 3" /></li>
            <li><img src="/gallery/niser-times/1780776777775.jpeg" alt="NISER undergrad times and research internship photo 4" /></li>
            <li><img src="/gallery/niser-times/1780776777243.jpeg" alt="NISER undergrad times and research internship photo 5" /></li>
            <li><img src="/gallery/niser-times/1780776777038.jpeg" alt="NISER undergrad times and research internship photo 6" /></li>
            <li><img src="/gallery/niser-times/1780776776680.jpeg" alt="NISER undergrad times and research internship photo 7" /></li>
            <li><img src="/gallery/niser-times/1780776776706.jpeg" alt="NISER undergrad times and research internship photo 8" /></li>
            <li><img src="/gallery/niser-times/1780776776160.jpeg" alt="NISER undergrad times and research internship photo 9" /></li>
            <li><img src="/gallery/niser-times/1780776777024.jpeg" alt="NISER undergrad times and research internship photo 10" /></li>
          </ul>

          <h3>Illustrations & Concept Diagrams</h3>
          <figure>
            <img src="/gallery/illustrations/1782174990163.jpeg" alt="Feature Flag Rollout Strategy Diagram" />
            <figcaption>Feature Flag Rollout Strategy: Flowchart explaining user routing, database query logic, hash-based percentage rollout, and safe fallback systems.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1781798754417.jpeg" alt="Whitefield Traffic Hotspots Map Layout" />
            <figcaption>Whitefield Traffic Hotspots Map: OpenStreetMap satellite overlay of peak travel times and route latencies.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1780700866053.jpeg" alt="Enterprise Java and TypeScript Boilerplate Call Stack" />
            <figcaption>Boilerplate Call Stack Trace: Visualizing nested interceptors, validation chains, and unit of work coordinators in enterprise service layers.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1781729663413.jpeg" alt="Today: Production vs Me - Startup Bugs Dashboard" />
            <figcaption>Today: Production vs Me: sticky note representation of fixing coupon stacking, webhook loops, and checkout totals.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1782174989927.jpeg" alt="Dr. STONE Anime Rocket Scene screenshot" />
            <figcaption>Dr. STONE Space Rocket Episode: Anime screenshot of Senku 7 launching into space as a symbol of engineering determination.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1781798750123.jpeg" alt="AWS ECS Task and OSRM Sidecar Routing Architecture" />
            <figcaption>AWS ECS Task Architecture: Diagram of a Python/FastAPI container communicating via localhost with an OSRM routing engine sidecar in less than 2ms.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1780700865883.jpeg" alt="Technical Debt Cost Curve over Time" />
            <figcaption>Technical Debt Curve: Cost-to-fix compounding timeline illustrating the importance of early architecture decisions before day 90.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1780700866000.jpeg" alt="Software Architecture Comparison: Monolith vs Microservices" />
            <figcaption>Software Architecture Comparison: Visual comparison of flat monoliths, modular monoliths (the sweet spot), and microservice complexity traps.</figcaption>
          </figure>
          <figure>
            <img src="/gallery/illustrations/1781729663439.jpeg" alt="LLM Prompting Comparison: Vague vs Surgical prompts" />
            <figcaption>LLM Prompting Comparison: Highlighting vague vs surgical prompts and why AI response quality depends on codebase familiarity.</figcaption>
          </figure>
        </div>
      </section>

      {/* The actual interactive macOS-style interface */}
      <PortfolioWrapper />
    </main>
  );
}

