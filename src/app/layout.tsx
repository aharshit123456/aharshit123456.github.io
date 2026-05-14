import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://aharshit123456.github.io/"),
  title: {
    default: "Harshit Agarwal | Fullstack Developer & AI Researcher",
    template: "%s | Harshit Agarwal"
  },
  description: "Harshit Agarwal: Fullstack Developer, AI Researcher & Lead at Famcare. Expert in FastAPI, Flutter, and Scalable Systems. Creator of WHAM! OTT and PreviouslyOn. Based in India.",
  keywords: ["Harshit Agarwal", "Fullstack Developer", "AI Researcher", "Famcare", "WHAM! OTT", "PreviouslyOn", "shoppin'", "Alohomora Labs", "Python", "React", "FastAPI", "Flutter", "Software Engineer Portfolio"],
  authors: [{ name: "Harshit Agarwal", url: "https://aharshit123456.github.io/" }],
  creator: "Harshit Agarwal",
  publisher: "Harshit Agarwal",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aharshit123456.github.io/",
    siteName: "Harshit Agarwal Portfolio",
    title: "Harshit Agarwal | Fullstack Developer & AI Researcher",
    description: "Fullstack Developer & AI Researcher. Founding SDE at shoppin', Research Lead at Alohomora Labs. Creator of WHAM! OTT.",
    images: [
      {
        url: "/profile_new.jpg",
        width: 1200,
        height: 630,
        alt: "Harshit Agarwal - Fullstack Developer & AI Researcher",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harshit Agarwal | Fullstack Developer & AI Researcher",
    description: "Fullstack Developer & AI Researcher specializing in Scalable Systems and AI/ML. Creator of WHAM! OTT.",
    creator: "@aharshit123456", // Assuming this is his handle based on github/linkedin
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
  verification: {
    google: 'google-site-verification-id', // User should replace this
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
              "url": "https://aharshit123456.github.io/",
              "image": "https://aharshit123456.github.io/profile_new.jpg",
              "sameAs": [
                "https://github.com/aharshit123456",
                "https://www.linkedin.com/in/aharshit123456/"
              ],
              "jobTitle": "Fullstack Developer & AI Researcher",
              "worksFor": {
                "@type": "Organization",
                "name": "Famcare"
              },
              "description": "Harshit Agarwal is a Fullstack Developer and AI Researcher specialized in building scalable systems and AI-driven applications.",
              "knowsAbout": ["Fullstack Development", "AI/ML", "FastAPI", "Flutter", "Next.js", "System Architecture"]
            })
          }}
        />
      </body>
    </html>
  );
}
