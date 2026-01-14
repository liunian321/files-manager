import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '1gb',
      allowedOrigins: ['172.18.0.1:3000', 'localhost:3000'],
    },
  },
  webpack: (config) => {
    config.externals.push('better-sqlite3');
    return config;
  },
};

export default nextConfig;
