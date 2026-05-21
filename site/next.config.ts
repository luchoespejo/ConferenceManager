import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@puckeditor/core'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
