# Famcare - Fullstack Architect & Lead

**Duration:** April 2026 - Present  
**Role:** Fullstack Architect & Lead  
**Website:** [famcare.co.in](https://famcare.co.in)

## Overview
Architected and delivered the entire FamCARE full-stack ecosystem, scaling a modular FastAPI backend and 3 cross-platform Flutter applications from absolute zero to production with **640+ commits** across 4 major repositories.

## Key Accomplishments
* **Architected and delivered** the FamCARE full-stack ecosystem, scaling a modular **FastAPI backend** and **3 cross-platform Flutter apps** from zero to production with **640+ commits** across 4 repositories.
* **Engineered a high-throughput API architecture**, verified via custom stress testing to handle **2,000+ requests/minute** and **100 concurrent users** with a **100% success rate** for core operational flows.
* **Engineered a modular monolith architecture** with **15+ decoupled services** designed for the **Strangler Pattern**, managing complex **Order/Booking** flows, **Razorpay** payments, and a multi-channel notification engine (**FCM**, **Fast2SMS**, **MSG91**).
* **Optimized operational velocity**, reducing deployment cycles by **70%** through **Fastlane CI/CD** and automating caregiver background checks via **SpringVerify**, while maintaining sub-second latency for real-time **WebSocket** tracking.

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
      <span class="cute-stat-value">640+</span>
      <span class="cute-stat-label">Total Commits</span>
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
        <span class="repo-badge">Provider App • Flutter Mobile • 32 Commits</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>Empowering local caregivers with task bidding, active availability states, and AWS S3 security proof checks.</p>
      <ul>
        <li><strong>Task Bidding:</strong> Custom provider dashboards with live booking proposals and real-time alerts.</li>
        <li><strong>Foreground Timer Patch:</strong> Solved Android chronometer tick bugs by resetting foreground notifications upon task status state changes.</li>
        <li><strong>Secure Check-ins:</strong> Direct AWS S3 photo capturing flow for secure check-in/out proofs.</li>
      </ul>
    </div>
  </details>

  <!-- Card 4: Admin -->
  <details class="repo-card">
    <summary class="repo-header">
      <span class="repo-icon">🛡️</span>
      <div class="repo-meta">
        <h3>famcare_admin</h3>
        <span class="repo-badge">Admin Panel • Flutter/Web • 54 Commits</span>
      </div>
    </summary>
    <div class="repo-details">
      <p>The high-powered command dashboard giving administrators absolute operational system control.</p>
      <ul>
        <li><strong>Slot Allocation:</strong> Advanced scheduling slots, capacities, and operational hour overrides.</li>
        <li><strong>Dynamic BGV Approval:</strong> springVerify status review panel with manual override flags.</li>
        <li><strong>Cohort Broadcasts:</strong> Advanced FCM notification center filtering targeted user/caretaker segments.</li>
        <li><strong>Developer Sandbox:</strong> Integrated developer order cancellations and DB overrides for fast staging.</li>
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
