# Famcare - Founding Engineer & Tech Lead

**Duration:** April 2026 - Present  
**Role:** Founding Engineer & Tech Lead  
**Website:** [famcare.co.in](https://famcare.co.in)

## Overview
Architected and delivered the FamCARE full-stack ecosystem — a FastAPI backend, a Flutter customer app, a Capacitor-based caretaker app, and a Next.js admin dashboard — scaling from zero to production across 4 repositories. Personally authored **679 commits** (~105,000 lines added) as the top contributor on every repo, while mentoring a team of 7 engineering interns who collectively shipped **554 commits** and **113,000+ lines of code** under direct technical guidance.

## Key Accomplishments
* **Architected and delivered** the FamCARE full-stack ecosystem — a **FastAPI backend**, a **Flutter** customer app, a **Capacitor**-based caretaker app, and a **Next.js** admin dashboard — scaling from zero to production across **4 repositories**. Personally authored **679 commits** (~105,000 lines added) as the top contributor on every repo.
* **Led system design and core technical architecture** as the founding engineer, setting the technical direction for the platform from inception.
* **Mentored and led a team of 7 engineering interns**, hand-holding them through codebase ramp-up, code reviews, and best practices — the team collectively shipped **554 commits** and **113,000+ lines of code** across the same 4 repos under direct technical guidance.
* **Engineered a high-throughput API architecture**, verified via custom stress testing to handle **2,000+ requests/minute** and **100 concurrent users** with a **100% success rate** for core operational flows.
* **Engineered a modular monolith architecture** with **25+ decoupled services** designed for the **Strangler Pattern**, managing complex **Order/Booking** flows, **Razorpay** payments, and a multi-channel notification engine (**FCM**, **Fast2SMS**, **MSG91**).
* **Optimized operational velocity**, reducing deployment cycles by **70%** through **Fastlane CI/CD** (confirmed in both the Flutter and Capacitor apps) and automating caregiver background checks via **SpringVerify**, while maintaining sub-second **WebSocket**-based real-time tracking.

---

## 📈 Quantified Impact Metrics (Cute & Mighty!)

<div class="cute-stats-container">
  <h3>⚡ Engineering Strength Metrics ⚡</h3>
  <div class="cute-stats-grid">
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">🎯</span>
      <span class="cute-stat-value">0 to 1</span>
      <span class="cute-stat-label">4 Systems Launched</span>
    </div>
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">🚀</span>
      <span class="cute-stat-value">679</span>
      <span class="cute-stat-label">Personal Commits</span>
    </div>
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">🔥</span>
      <span class="cute-stat-value">2k+ / min</span>
      <span class="cute-stat-label">Req Handling</span>
    </div>
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">⏱️</span>
      <span class="cute-stat-value">70%</span>
      <span class="cute-stat-label">Faster Releases</span>
    </div>
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">🧑‍🏫</span>
      <span class="cute-stat-value">7</span>
      <span class="cute-stat-label">Interns Mentored</span>
    </div>
    <div class="cute-stat-card">
      <span class="cute-stat-emoji">🧬</span>
      <span class="cute-stat-value">121</span>
      <span class="cute-stat-label">DB Migrations</span>
    </div>
  </div>
</div>

---

## 🌟 Dynamic Repo Explorers (Tap to Expand!)

We didn't just build an app—we spawned an entire digital universe! Expand each tab below to view our repository blueprints:

<div class="ecosystem-flex">
  <!-- Card 1: Sutram -->
  <details class="repo-card" open>
    <summary class="repo-header">
      <span class="repo-icon">🧠</span>
      <div class="repo-meta">
        <h3>famcare_sutram</h3>
        <span class="repo-badge">FastAPI Backend Server • 187 Commits</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>The core engine. Handles distributed transactional states, real-time sync, and idempotent migration nodes.</p>
      <ul>
        <li><strong>Modular Architecture:</strong> Decoupled router-service-repository patterns built on FastAPI.</li>
        <li><strong>Dispatch Engine:</strong> Automated sequential booking queues and async scheduler states.</li>
        <li><strong>Unified Wallet System:</strong> Ledger transactional accounting with Razorpay checkout verification.</li>
        <li><strong>FCM notification:</strong> Broadcast pipelines delivering targeted user and rider notifications.</li>
        <li><strong>WebSocket migration:</strong> Decoupled messaging by migrating local memory sync to a robust DB-backed socket stream.</li>
      </ul>
    </div>
  </details>

  <!-- Card 2: Praja -->
  <details class="repo-card">
    <summary class="repo-header">
      <span class="repo-icon">📱</span>
      <div class="repo-meta">
        <h3>famcare_praja</h3>
        <span class="repo-badge">Consumer App • Flutter Mobile • 120 Commits</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>The consumer-facing portal. Handles multi-pet onboarding, visual live map tracking, and secure transactions.</p>
      <ul>
        <li><strong>Smart Questionnaire:</strong> Tailored forms dynamically building Child, Elderly, and Pet Care flows.</li>
        <li><strong>Real-time Tracking:</strong> Live proximity mapping with Geolocator and sub-second WebSockets.</li>
        <li><strong>Dynamic Pricing preview:</strong> Real-time coupon application and multi-pet pricing logic.</li>
        <li><strong>Fastlane Mobile CI:</strong> Direct automatic releases, localization updates, and Play Store pipeline deploys.</li>
      </ul>
    </div>
  </details>

  <!-- Card 3: Caretaker -->
  <details class="repo-card">
    <summary class="repo-header">
      <span class="repo-icon">🧑‍⚕️</span>
      <div class="repo-meta">
        <h3>famcare-caretaker</h3>
        <span class="repo-badge">Provider App • Capacitor (Web-to-Native)</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>Empowering local caregivers with task bidding, live chat, active availability states, and AWS S3 security proof checks.</p>
      <ul>
        <li><strong>Task Bidding:</strong> Custom provider dashboards with live booking proposals and real-time alerts.</li>
        <li><strong>In-app Chat:</strong> Direct customer-caregiver messaging built on the same real-time backplane as live tracking.</li>
        <li><strong>Foreground Timer Patch:</strong> Solved Android chronometer tick bugs by resetting foreground notifications upon task status state changes.</li>
        <li><strong>Secure Check-ins:</strong> Direct AWS S3 photo capturing flow for secure check-in/out proofs.</li>
        <li><strong>Fastlane CI/CD:</strong> Automated build, signing, and store deployment alongside the customer app.</li>
      </ul>
    </div>
  </details>

  <!-- Card 4: Admin -->
  <details class="repo-card">
    <summary class="repo-header">
      <span class="repo-icon">🛡️</span>
      <div class="repo-meta">
        <h3>famcare_admin</h3>
        <span class="repo-badge">Admin Panel • Next.js</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>The high-powered operations console giving the internal team absolute control over orders, riders, and finances.</p>
      <ul>
        <li><strong>Financial Reporting:</strong> Real P&L in daily report PDFs, cancellation tracking, MTD/YTD analytics with custom date-range filters.</li>
        <li><strong>Rider Dashboards:</strong> Salary and revenue-utilization dashboards plus a full audit log of admin actions.</li>
        <li><strong>Slot Allocation:</strong> Advanced scheduling slots, capacities, and operational hour overrides.</li>
        <li><strong>Dynamic BGV Approval:</strong> SpringVerify status review panel with manual override flags, handling provider 404s gracefully.</li>
        <li><strong>Feature Flags:</strong> Per-feature off / dev_only / live gating to ship new code paths without exposing them before they're ready.</li>
        <li><strong>Cohort Broadcasts:</strong> FCM notification center filtering targeted user/caretaker segments, plus manual OTP regeneration and referral backfills.</li>
      </ul>
    </div>
  </details>
</div>

---

## App Store & Play Store Downloads
<div class="app-links-grid">
  <a href="https://play.google.com/store/apps/details?id=com.famcare.praja&pcampaignid=web_share" target="_blank" class="app-store-btn" rel="noopener noreferrer">
    <i class="fab fa-google-play"></i> Google Play Store
  </a>
  <a href="https://apps.apple.com/in/app/famcare-caregiver-in-minutes/id6761720384" target="_blank" class="app-store-btn" rel="noopener noreferrer">
    <i class="fab fa-apple"></i> Apple App Store
  </a>
</div>

## Product Screenshots
<div class="screenshot-container">
  <img src="/assets/famcare/1.webp" alt="Famcare App Screenshot 1" />
  <img src="/assets/famcare/2.webp" alt="Famcare App Screenshot 2" />
  <img src="/assets/famcare/3.webp" alt="Famcare App Screenshot 3" />
  <img src="/assets/famcare/4.webp" alt="Famcare App Screenshot 4" />
  <img src="/assets/famcare/5.webp" alt="Famcare App Screenshot 5" />
</div>
