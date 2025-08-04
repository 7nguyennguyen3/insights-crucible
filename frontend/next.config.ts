import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**.ggpht.com",
      },
    ],
  },
};
export default nextConfig;
