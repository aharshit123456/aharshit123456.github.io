import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aharshit123456.space"),

  title: {
    default: "Harshit Agarwal | AI Researcher | Computational Neuroscience",
    template: "%s | Harshit Agarwal"
  },
  description: "Harshit Agarwal: AI Researcher & Software Engineer from KIIT. Expert in Computational Neuroscience, Alzheimer's models & Foundation Models. Find me on GitHub.",
  keywords: [
    "Harshit Agarwal", "Harshit Agarwal Portfolio", "aharshit123456", "Fullstack Engineer India", 
    "AI Researcher", "Machine Learning Engineer", "FastAPI Expert", "Flutter Developer", 
    "Famcare Lead Developer", "shoppin' AI Engineer", "Software Architect Portfolio", 
    "Python Backend Expert", "Scalable Systems Design", "Generative AI Developer",
    "Computational Neuroscience", "Alzheimer's Research", "Foundation Models"
  ],
  authors: [{ name: "Harshit Agarwal", url: "https://aharshit123456.space/" }],
  creator: "Harshit Agarwal",
  publisher: "Harshit Agarwal",
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://aharshit123456.space",
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aharshit123456.space/",
    siteName: "Harshit Agarwal | The Space",
    title: "Harshit Agarwal | AI Researcher | Computational Neuroscience",
    description: "AI Researcher & Software Engineer specializing in Computational Neuroscience, Alzheimer's models, and Foundation Models. Explore my workspace.",
    images: [
      {
        url: "/profile_new.jpg",
        width: 1200,
        height: 630,
        alt: "Harshit Agarwal - AI Researcher & Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harshit Agarwal | AI Researcher | Computational Neuroscience",
    description: "AI Researcher & Software Engineer from KIIT specializing in Computational Neuroscience and Foundation Models.",
    creator: "@aharshit123456",
    images: ["/profile_new.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=4' },
      { url: '/icon.png?v=4', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png?v=4' },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
      </head>
      <body className="dark-mode">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "ProfilePage",
                  "@id": "https://aharshit123456.space/#profilepage",
                  "url": "https://aharshit123456.space/",
                  "name": "Harshit Agarwal | Fullstack Engineer & AI Researcher Portfolio",
                  "description": "Professional space and portfolio of Harshit Agarwal, Fullstack Architect & AI Specialist.",
                  "mainEntity": {
                    "@id": "https://aharshit123456.space/#person"
                  }
                },
                {
                  "@type": "Person",
                  "@id": "https://aharshit123456.space/#person",
                  "name": "Harshit Agarwal",
                  "url": "https://aharshit123456.space/",
                  "image": "https://aharshit123456.space/profile_new.jpg",
                  "sameAs": [
                    "https://github.com/aharshit123456",
                    "https://www.linkedin.com/in/aharshit123456/",
                    "https://twitter.com/aharshit123456",
                    "https://orcid.org/0009-0000-2173-1740",
                    "https://scholar.google.com/citations?user=VSiAoGoAAAAJ&hl=en"
                  ],
                  "jobTitle": "Fullstack Engineer & AI Researcher",
                  "description": "Harshit Agarwal is a high-performance Fullstack Engineer and AI Researcher specializing in scalable backend architectures, cross-platform mobile ecosystems, and advanced Machine Learning pipelines.",
                  "knowsAbout": [
                    "Fullstack Development", "AI/ML", "FastAPI", "Flutter", "Next.js", 
                    "System Architecture", "Scalable Systems", "Python", "Cloud Infrastructure",
                    "Deep Learning", "SLAM", "ORB-SLAM3", "Docker", "Kubernetes", "AWS SageMaker",
                    "WebSockets", "Rancher", "Microservices", "Event-Driven Architecture"
                  ],
                  "alumniOf": {
                    "@type": "EducationalOrganization",
                    "name": "KIIT University",
                    "sameAs": "https://kiit.ac.in/"
                  },
                  "hasOccupation": [
                    {
                      "@type": "Occupation",
                      "name": "Fullstack Architect & Lead",
                      "skills": "FastAPI, Flutter, WebSockets, Fastlane, SpringVerify, Razorpay, FCM, Redis",
                      "description": "Architecting modular monolithic backends and caregiver platforms at Famcare."
                    },
                    {
                      "@type": "Occupation",
                      "name": "Founding SDE (AI & Systems)",
                      "skills": "Generative Video, Lip-sync models, ComfyUI custom nodes, Systems engineering",
                      "description": "Engineering generative video tools and automated media rendering setups at endorphind."
                    },
                    {
                      "@type": "Occupation",
                      "name": "Founding ML Engineer (AI/Infra)",
                      "skills": "YOLO, RT-DETR, MaskRCNN, CLIP, SageMaker, EKS, Terraform, GitOps, Rancher",
                      "description": "Engineered multimodal ML pipelines matching 3-4 crore catalog items at shoppin'."
                    }
                  ]
                }
              ]
            })
          }}
        />
      </body>
    </html>
  );
}
