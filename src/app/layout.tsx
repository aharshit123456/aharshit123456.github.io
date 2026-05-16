import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aharshit123456.space"),

  title: {
    default: "Harshit Agarwal | Fullstack Engineer & AI Researcher",
    template: "%s | Harshit Agarwal"
  },
  description: "Harshit Agarwal: Expert Fullstack Engineer, AI Researcher, and Product Architect. Lead at Famcare, Founding ML Engineer at shoppin'. Specialist in FastAPI, Flutter, Python, and Scalable AI Systems. Based in India.",
  keywords: [
    "Harshit Agarwal", "Harshit Agarwal Portfolio", "aharshit123456", "Fullstack Engineer India", 
    "AI Researcher", "Machine Learning Engineer", "FastAPI Expert", "Flutter Developer", 
    "Famcare Lead Developer", "shoppin' AI Engineer", "Software Architect Portfolio", 
    "Python Backend Expert", "Scalable Systems Design", "Generative AI Developer"
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
    title: "Harshit Agarwal | Fullstack Engineer & AI Researcher",
    description: "Architecting scalable AI systems and cross-platform ecosystems. Founding SDE at shoppin', Lead at Famcare. Explore the workspace of Harshit Agarwal.",
    images: [
      {
        url: "/profile_new.jpg",
        width: 1200,
        height: 630,
        alt: "Harshit Agarwal - Fullstack Engineer & AI Researcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harshit Agarwal | Fullstack Engineer & AI Researcher",
    description: "Building the future of AI-driven commerce and healthcare systems. Explore my professional space.",
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
    <html lang="en">
      <body className="dark-mode">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              "name": "Harshit Agarwal",
              "url": "https://aharshit123456.space/",
              "image": "https://aharshit123456.space/profile_new.jpg",
              "sameAs": [
                "https://github.com/aharshit123456",
                "https://www.linkedin.com/in/aharshit123456/",
                "https://twitter.com/aharshit123456"
              ],
              "jobTitle": "Fullstack Engineer & AI Researcher",
              "worksFor": [
                {
                  "@type": "Organization",
                  "name": "Famcare"
                },
                {
                  "@type": "Organization",
                  "name": "shoppin' (USAR Commerce Technologies)"
                }
              ],
              "description": "Harshit Agarwal is a high-performance Fullstack Engineer and AI Researcher specializing in scalable backend architectures, cross-platform mobile ecosystems, and advanced Machine Learning pipelines.",
              "knowsAbout": [
                "Fullstack Development", "AI/ML", "FastAPI", "Flutter", "Next.js", 
                "System Architecture", "Scalable Systems", "Python", "Cloud Infrastructure"
              ],
              "alumniOf": "KIIT University"
            })
          }}
        />
      </body>
    </html>
  );
}
