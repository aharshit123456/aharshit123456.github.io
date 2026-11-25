import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    qualities: [75, 85],
  },
  async redirects() {
    return [
      {
        source: '/case-studies/famcare/:study(voice-agent|system-design|slots-and-pricing).html',
        destination: '/blog/famcare-:study',
        permanent: true,
      },
      {
        source: '/case-studies/famcare/famcare-case-study-:study(voice-agent|system-design|slots-and-pricing).pdf',
        destination: '/blog/famcare-:study',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
