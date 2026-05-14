import React from 'react';

export const experienceData = [
  {
    id: "famcare",
    company: "Famcare",
    url: "https://famcare.co.in",
    role: "Fullstack Architect & Lead",
    period: "April 2026 - Present",
    hasScreenshots: true,
    screenshots: ["assets/famcare/1.webp", "assets/famcare/2.webp", "assets/famcare/3.webp", "assets/famcare/4.webp", "assets/famcare/5.webp"],
    links: [
      { url: "https://play.google.com/store/apps/details?id=com.famcare.praja&pcampaignid=web_share", icon: "fab fa-google-play", title: "Play Store" },
      { url: "https://apps.apple.com/in/app/famcare-caregiver-in-minutes/id6761720384", icon: "fab fa-apple", title: "App Store" }
    ],
    bullets: [
      "Architected and delivered the FamCARE full-stack ecosystem, scaling a modular FastAPI backend and 3 cross-platform Flutter apps from zero to production with 500+ commits across 4 repositories.",
      "Engineered a high-throughput API architecture, verified via custom stress testing to handle 2,000+ requests/minute and 100 concurrent users with a 100% success rate for core operational flows.",
      "Engineered a modular monolith architecture with 15+ decoupled services designed for the Strangler Pattern, managing complex Order/Booking flows, Razorpay payments, and a multi-channel notification engine (FCM, Fast2SMS, MSG91).",
      "Optimized operational velocity, reducing deployment cycles by 70% through Fastlane CI/CD and automating caregiver background checks via SpringVerify, while maintaining sub-second latency for real-time WebSocket tracking."
    ]
  },
  {
    id: "endorphind",
    company: "endorphind",
    url: "http://endorphind.com/",
    role: "Founding SDE (AI & Systems)",
    period: "Jan 2026 - Present",
    bullets: [
      "Generative Video AI: Engineered SOTA lip-sync and video generation pipelines using Wan 2.2/2.6, LatentSync, and InfiniteTalk (GGUF). Integrated ElevenLabs and F5 for high-fidelity voice cloning.",
      "Workflow Automation: Developed custom ComfyUI nodes and automated media generation tools for high-throughput digital avatar production.",
      "System Design & Leadership: Managing 2-3 intern SDEs, overseeing client-facing system architecture, and leading platform technical scoping.",
      "Product Engineering: Scoped and architected the \"LangLearn\" educational module, focusing on LLM-driven story generation and vocabulary tracking."
    ]
  },
  {
    id: "shoppin",
    company: "shoppin'",
    url: "https://shoppin.app",
    role: "Founding ML Engineer (AI/Infra)",
    period: "Dec 2024 - Nov 2025",
    hasScreenshots: true,
    screenshots: ["assets/shoppin/1.webp", "assets/shoppin/2.webp", "assets/shoppin/3.webp", "assets/shoppin/4.webp", "assets/shoppin/5.webp"],
    links: [
      { url: "https://play.google.com/store/apps/details?id=app.shoppin.ios", icon: "fab fa-google-play", title: "Play Store" },
      { url: "https://apps.apple.com/in/app/shoppin-ai-discovery-try-on/id6738202299", icon: "fab fa-apple", title: "App Store" }
    ],
    bullets: [
      "Multimodal AI: Developed scalable ML pipelines (3-4 crore items). Deployed CLIP/VLLM systems for search & recs. Led end-to-end visual AI stack (YOLO, RT-DETR, MaskRCNN, Diffusion-based VTON).",
      "Scalable Infra: Built distributed image/video preprocessing pipelines. Dockerized and served models on AWS SageMaker.",
      "Backend & Automation: Designed CRUD APIs, integrated Redis/Alembic. Created high-throughput scraping agents for 200+ partner stores.",
      "Cloud & DevOps: Architected AWS EKS clusters with GitOps (Terraform, CI/CD). Enabled disaster recovery setups."
    ]
  }
];

export const projectData = [
  {
    id: "wham",
    title: "WHAM! OTT",
    url: "https://wham.cosq.in/",
    tech: "React 18, Vite, FastAPI, Supabase, HLS/M3U8. CapacitorJS",
    bullets: [
      "Hybrid Playback: Custom video engine integrating FastPix (H264/HLS) and VidRock (Iframe) with real-time \"Switch Player\" toggle.",
      "Comicpaneled UI: Immersive \"Living Comic Book\" design with \"Noir Mode\" toggle, infinite carousels, and \"BAM!\" click-animations.",
      "Tech Achievements: Cross-origin watch progress synchronization (postMessage), TMDB data ingestion with fallback logic, and theme-aware Giscus comments."
    ]
  },
  {
    id: "previously",
    title: "PreviouslyOn",
    url: "http://previouslyon.cosq.in/",
    github: "https://github.com/aharshit123456/previouslyon",
    tech: "Next.js, Supabase",
    description: "Developed a full-stack social TV tracking application using Next.js and Supabase, featuring real-time user activity feeds, custom list curation, and polymorphic review systems. Integrated Gemini AI for personalized content recommendations."
  }
];
