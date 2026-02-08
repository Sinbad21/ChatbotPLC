/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
  // Proxy /api/* to backend worker (fallback — middleware.ts handles this first)
  async rewrites() {
    const backend =
      process.env.API_BACKEND_URL ||
      'https://plcassistantbackend.gabrypiritore.workers.dev';
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backend}/health`,
      },
    ];
  },
  // Disable webpack cache to prevent large cache files in Cloudflare deployment
  webpack: (config, { isServer }) => {
    config.cache = false;
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

