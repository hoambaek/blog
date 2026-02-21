import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    qualities: [75, 90],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-e7d9b0569247435fa5adc92a77955acd.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
