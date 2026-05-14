import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1e1e1e",
};

export const metadata: Metadata = {
  title: "Harshit Agarwal | Fullstack Developer & AI Researcher",
  description: "Harshit Agarwal: Fullstack Developer, AI Researcher & Lead at Famcare. Expert in FastAPI, Flutter, and Scalable Systems. Creator of WHAM! OTT and PreviouslyOn. Based in India.",
  keywords: "Harshit Agarwal, Fullstack Developer, AI Researcher, Famcare, WHAM! OTT, PreviouslyOn, shoppin', Alohomora Labs, Python, React, FastAPI, Flutter, Software Engineer Portfolio",
  authors: [{ name: "Harshit Agarwal" }],
  openGraph: {
    type: "website",
    url: "https://aharshit123456.github.io/",
    title: "Harshit Agarwal | Fullstack Developer & AI Researcher",
    description: "Fullstack Developer & AI Researcher. Founding SDE at shoppin', Research Lead at Alohomora Labs. Creator of WHAM! OTT.",
    images: [{ url: "https://aharshit123456.github.io/profile_new.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Harshit Agarwal | Fullstack Developer & AI Researcher",
    description: "Fullstack Developer & AI Researcher specializing in Scalable Systems and AI/ML. Creator of WHAM! OTT.",
    images: ["https://aharshit123456.github.io/profile_new.jpg"],
  },
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
      </body>
    </html>
  );
}
