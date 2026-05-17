import React from 'react';

const FamcareNotes: React.FC = () => {
  return (
    <div className="personal-notes">
      <section className="blog-post">
        <h1>Architecting for the Hyper-Local Economy: Building the FamCARE Distributed Marketplace</h1>
        <p className="author-line"><em>By Harshit Agarwal, System Architect & Lead</em></p>
        <p>
          Building a service marketplace isn't just about matching supply and demand; it’s about managing a high-fidelity 
          "Physical World State" in digital real-time. At <strong>FamCARE</strong>, we faced a classic distributed systems challenge: 
          how to coordinate users, caretakers, and administrators across a modular ecosystem while maintaining strict transactional 
          integrity and sub-second latency.
        </p>
        <p>
          In this post, I’ll dive into the architectural decisions and engineering patterns I implemented to scale FamCARE 
          from a prototype to a production-ready engine handling thousands of requests.
        </p>
        
        <hr className="note-divider" />
        
        <h2>1. The Modular Monolith: Designing for the Strangler Pattern</h2>
        <p>
          Early-stage startups often fall into the "Microservices Trap" too soon. For FamCARE, I opted for a 
          <strong>Modular Monolith</strong> architecture using <strong>FastAPI</strong> and <strong>PostgreSQL</strong>. 
          However, the system is architected with future scale in mind:
        </p>
        <ul>
          <li><strong>Service Isolation:</strong> I engineered <strong>15+ decoupled services</strong> (modules) within the monolith (e.g., <code>payments</code>, <code>riders</code>, <code>notifications</code>, <code>assignments</code>).</li>
          <li><strong>The Strangler Pattern:</strong> Each module is strictly isolated with its own domain logic and data access patterns, allowing any individual service to be "strangled" out into a standalone microservice with minimal friction as traffic scales.</li>
          <li><strong>Benefit:</strong> This approach combines the deployment simplicity of a monolith with the architectural flexibility of microservices.</li>
        </ul>

        <h2>2. Solving the Distributed State Problem: The Request Lifecycle</h2>
        <p>
          The core of FamCARE is the <strong>Service Request Engine</strong>. The complexity lies in the state machine: 
          a request isn't just "Created"; it is a living entity that transitions through <code>proposing</code>, 
          <code>accepting</code>, <code>ongoing</code>, and <code>settling</code>.
        </p>
        <h3>The "Ghost Assignment" Challenge</h3>
        <p>
          A common failure mode in marketplaces is the "Ghost Assignment"—where a rider is proposed a task but remains 
          "available" to other systems. I implemented a <strong>locking and timeout reservation pattern</strong>:
        </p>
        <ul>
          <li><strong>Atomic Proposals:</strong> When a rider is proposed, they are marked as <code>busy</code> in a Redis-backed cache layer.</li>
          <li><strong>Background Schedulers:</strong> Using <code>APScheduler</code>, I built a reaper service that monitors pending proposals and automatically expires them after 180 seconds, re-injecting the request into the assignment queue.</li>
        </ul>

        <h2>3. Real-Time Synchronization via Redis Pub/Sub</h2>
        <p>To achieve a "live" feel, we couldn't rely on polling. We needed a unified broadcasting system.</p>
        <p>
          We used <strong>WebSockets</strong> for the frontends, but scaling WebSockets across multiple server instances 
          requires a shared backplane. I architected a <strong>Redis Pub/Sub relay</strong>:
        </p>
        <ul>
          <li>When a state change occurs (e.g., Rider accepts a job), the backend publishes a message to a Redis channel.</li>
          <li>Every active FastAPI worker listens to this channel and broadcasts the update only to the relevant connected clients (User, Caretaker, or Admin).</li>
          <li><strong>Result:</strong> We achieved sub-300ms propagation of status updates across the entire ecosystem.</li>
        </ul>

        <h2>4. Engineering the Dynamic Operational Slot Engine</h2>
        <p>
          Perhaps the most mathematically complex piece was the <strong>Hub-Aware Slot Engine</strong>. 
          Unlike a standard calendar, our "slots" are dynamic functions of:
        </p>
        <ul>
          <li><strong>Operational Windows:</strong> Hub-specific start/end times.</li>
          <li><strong>Rider Density:</strong> Real-time count of active vs. assigned riders in a specific geofence.</li>
          <li><strong>Service Duration:</strong> A 4-hour dog-walking service cannot be booked 2 hours before a hub closes.</li>
        </ul>
        <p>
          I implemented this using a <strong>Duration-Aware Lookahead Algorithm</strong> that calculates availability by 
          intersecting the requested service duration with the remaining operational window and the concurrent booking 
          capacity of the local hub.
        </p>

        <h2>5. Stress Testing: Proving the Architecture</h2>
        <p>An architecture is only as good as its breaking point. I developed a custom asynchronous benchmarking suite to simulate high-load scenarios.</p>
        <p><strong>The Findings:</strong></p>
        <ul>
          <li><strong>Concurrency:</strong> The system maintained a <strong>100% success rate</strong> at 50 concurrent users.</li>
          <li><strong>Throughput:</strong> Handled <strong>2,000+ requests/minute</strong> with an average latency of ~950ms.</li>
          <li><strong>Bottleneck Identification:</strong> Under extreme load (100+ concurrent users), the P95 latency shifted to 8s, identifying the database connection pool as the primary scaling target. This data-driven approach allowed us to pre-emptively optimize our RDS instance sizing.</li>
        </ul>

        <h2>6. Multi-Channel Notifications & External Integrations</h2>
        <p>A reliable marketplace requires constant communication. I engineered a unified notification engine that abstracts over multiple providers:</p>
        <ul>
          <li><strong>Real-Time:</strong> <strong>FCM (Firebase Cloud Messaging)</strong> for instant push notifications on order status changes.</li>
          <li><strong>Fallback & Auth:</strong> Integrated <strong>Fast2SMS</strong> and <strong>MSG91</strong> for transactional SMS and OTP verification.</li>
          <li><strong>Service Decoupling:</strong> The notification service is entirely decoupled; it consumes events from the order system, ensuring that adding a new provider (e.g., WhatsApp or Email) requires zero changes to the core business logic.</li>
        </ul>

        <h2>7. Deployment & The Developer Experience</h2>
        <p>Speed of delivery is a feature. I automated the entire mobile deployment pipeline using <strong>Fastlane and GitHub Actions</strong>.</p>
        <ul>
          <li><strong>CI/CD:</strong> Automated builds for three different Flutter apps (User, Caretaker, Admin) are triggered on merge to <code>staging</code>, reducing deployment overhead by <strong>70%</strong>.</li>
          <li><strong>Observability:</strong> Integrated <strong>Sentry</strong> with custom breadcrumbs to track distributed traces—allowing us to debug a failed payment in the User app by tracing it back to a specific async task in the backend.</li>
        </ul>
        <hr className="note-divider" />
        <p>
          <em>If you’re interested in the code behind these patterns, reach out to discuss distributed systems.</em>
        </p>
      </section>

      <section className="blog-post" style={{ marginTop: '60px' }}>
        <h1>Technical Blog: Architecting a Multi-Tiered Promotional Engine & Reactive Session Extensions</h1>
        <p>
          In the latest evolution of the <strong>FamCare</strong> platform, we moved beyond standard CRUD operations 
          to implement two complex, high-impact features: a <strong>Hierarchical Introductory Pricing Engine</strong> 
          and a <strong>Parent-Child Reactive Extension Flow</strong>.
        </p>
        <p>Here is the "deep tech" breakdown of how these systems were engineered to handle scale, edge cases, and real-time state synchronization.</p>

        <h2>1. The Hierarchical Promotional Engine (The "Try at" System)</h2>
        <h3>The Challenge</h3>
        <p>
          Standard discount systems are usually flat. For a service marketplace, this is insufficient. 
          Different services have different margins, and a 1-hour session has a different value proposition 
          than a 4-hour session. We needed a way to offer "Entry-Level" pricing that could be overridden 
          at any level of the service hierarchy.
        </p>

        <h3>The Solution: A Resolution-Priority Fallback Engine</h3>
        <p>
          We engineered a <strong>Resolution-Priority Strategy</strong> across the entire stack. 
          Instead of a hardcoded "First Order Price," the system now performs a recursive lookup 
          to find the most specific price defined by the admin.
        </p>
        <ul>
          <li><strong>The Hierarchy:</strong> Pricing Tier (Most Specific) &rarr; Sub-Service &rarr; Service Category &rarr; Original Price (Fallback).</li>
          <li><strong>Implementation Details:</strong>
            <ul>
              <li><strong>Database Schema:</strong> Extended the <code>services</code> and <code>pricing_tiers</code> tables via <strong>Alembic</strong> migrations to support nullable promotional fields.</li>
              <li><strong>Frontend Resolution Logic:</strong> In Flutter, we implemented a memoized resolution helper <code>_getTrialPrice(sub, tier)</code> that calculates the "Best Available Promotion" in <i>O(1)</i> time during the build cycle, ensuring zero UI lag.</li>
              <li><strong>Eligibility Guard:</strong> A reactive <code>_isTrialEligible</code> state that synchronizes guest-mode heuristics with authenticated <code>booking_count</code> checks.</li>
            </ul>
          </li>
        </ul>

        <h2>2. Parent-Child Reactive Service Extensions</h2>
        <h3>The Challenge</h3>
        <p>In-home services are unpredictable. A 2-hour babysitting session often needs a 1-hour extension. Re-booking from scratch creates friction and breaks the "Live Tracking" experience.</p>

        <h3>The Solution: Atomic Linked Request Mapping</h3>
        <p>Instead of modifying the original request, we implemented a <strong>Linked-Node Architecture</strong>.</p>
        <ul>
          <li><strong>Relational Logic:</strong> When an extension is requested, the system spawns a new <code>Request</code> object with a <code>parent_request_id</code> pointer. This creates an "Extension Chain."</li>
          <li><strong>State Merging:</strong> Once the extension (the child) is paid, a background trigger adds those hours back to the Parent task. The user's live tracker "absorbs" the new time seamlessly.</li>
          <li><strong>UI Synchronization:</strong> The <code>LiveTrackingScreen</code> was refactored into a state-aware consumer. It listens for child-requests and dynamically shifts the UI from a "Tracking State" to a "Payment-Gated Extension State" without a page reload.</li>
        </ul>

        <h2>3. The "Genius" in the Full-Stack Connection</h2>
        <ol>
          <li><strong>Admin Panel (Next.js):</strong> Built a dynamic form system that allows admins to set these prices at any level.</li>
          <li><strong>Sutram (FastAPI/PostgreSQL):</strong> The backend serves as the "Source of Truth," preventing any frontend price manipulation.</li>
          <li><strong>Praja (Flutter):</strong> Implemented a "Premium Aesthetics" UI overhaul with <strong>Vertical Intrinsic Dividers</strong>, <strong>Slashed-Price Visuals</strong>, and <strong>Micro-animations</strong> for the "Try at" badge.</li>
        </ol>

        <h3>Summary of Impact</h3>
        <ul>
          <li><strong>Conversion:</strong> Lowered the entry barrier for the most popular services.</li>
          <li><strong>Revenue Continuity:</strong> Ensuring caregivers are paid for every extra minute while providing a seamless one-tap payment experience.</li>
        </ul>
      </section>

      <style jsx>{`
        .personal-notes {
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
          color: var(--text-color);
          line-height: 1.6;
          font-family: 'Inter', sans-serif;
        }
        .blog-post h1 {
          font-size: 2.2rem;
          margin-bottom: 10px;
          color: var(--accent-color);
          line-height: 1.2;
        }
        .author-line {
          font-size: 0.9rem;
          margin-bottom: 30px;
          opacity: 0.8;
        }
        .note-divider {
          margin: 40px 0;
          border: 0;
          border-top: 1px solid var(--border-color);
          opacity: 0.3;
        }
        h2 {
          font-size: 1.5rem;
          margin-top: 40px;
          margin-bottom: 20px;
          color: var(--text-color);
          border-left: 4px solid var(--accent-color);
          padding-left: 15px;
        }
        h3 {
          font-size: 1.2rem;
          margin-top: 25px;
          margin-bottom: 15px;
          color: var(--accent-color);
        }
        ul, ol {
          margin-bottom: 20px;
          padding-left: 20px;
        }
        li {
          margin-bottom: 10px;
        }
        code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Fira Code', monospace;
          font-size: 0.9rem;
        }
        p {
          margin-bottom: 20px;
        }
        strong {
          color: var(--accent-color);
        }
      `}</style>
    </div>
  );
};

export default FamcareNotes;
