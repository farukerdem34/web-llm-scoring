import type { NextConfig } from "next";

const API_BACKEND = process.env.NEXT_PUBLIC_API_BASE_URL!;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${API_BACKEND}/api/v1/:path*`,
      },
      {
        source: "/health/:path*",
        destination: `${API_BACKEND}/health/:path*`,
      },
    ];
  },
};

export default nextConfig;
