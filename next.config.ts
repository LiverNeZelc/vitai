import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "sqlite3"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
    qualities: [65, 75],
  },
};

export default nextConfig;
