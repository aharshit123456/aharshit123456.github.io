import PortfolioWrapper from '@/components/portfolio/PortfolioWrapper';

export default function Home() {
  return (
    <main>
      {/* 
        This section is hidden from users but visible to search engines and AI crawlers.
        It provides a semantic, SSR-friendly version of the portfolio content.
      */}
      <section className="sr-only" aria-hidden="true" style={{ display: 'none' }}>
        <h1>Harshit Agarwal | Fullstack Engineer & AI Researcher</h1>
        <p>
          Founding SDE & System Architect based in India. Specialized in Building Scalable Systems, AI/ML, 
          and Distributed Architectures.
        </p>

        <h2>Work Experience</h2>
        <article>
          <h3>FamCARE - Fullstack Architect & Lead</h3>
          <p>April 2026 - Present</p>
          <ul>
            <li>Architected modular FastAPI backend and 3 cross-platform Flutter apps.</li>
            <li>Engineered modular monolith with 15+ decoupled services.</li>
            <li>Optimized deployment velocity by 70% via CI/CD.</li>
            <li>Handled 2,000+ requests/minute with 100% success rate.</li>
          </ul>
        </article>

        <article>
          <h3>endorphind - Founding SDE (AI & Systems)</h3>
          <p>Jan 2026 - Present</p>
          <ul>
            <li>Engineered SOTA lip-sync and video generation pipelines.</li>
            <li>Developed custom ComfyUI nodes for automated media generation.</li>
            <li>Leading platform technical scoping and team management.</li>
          </ul>
        </article>

        <article>
          <h3>shoppin' - Founding ML Engineer (AI/Infra)</h3>
          <p>Dec 2024 - Nov 2025</p>
          <ul>
            <li>Developed multimodal ML pipelines for 3-4 crore items.</li>
            <li>Deployed CLIP/VLLM systems on AWS SageMaker.</li>
            <li>Architected AWS EKS clusters with GitOps.</li>
          </ul>
        </article>

        <h2>Featured Projects</h2>
        <ul>
          <li><strong>WHAM! OTT</strong>: Hybrid video engine with immersive comic-book UI.</li>
          <li><strong>PreviouslyOn</strong>: Social TV tracking app with AI recommendations.</li>
          <li><strong>ORB-SLAM3</strong>: Accurate Visual-Inertial SLAM library.</li>
        </ul>

        <h2>Technical Skills</h2>
        <p>Python, C/C++, Java, Go, JS/TS, NextJS, React, Flutter, FastAPI, PyTorch, AWS, Docker, K8s, PostgreSQL, Redis.</p>
      </section>

      {/* The actual interactive macOS-style interface */}
      <PortfolioWrapper />
    </main>
  );
}
