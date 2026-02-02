/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL || (process.env.NODE_ENV === 'production' ? 'http://backend:8000/:path*' : 'http://localhost:8000/:path*'),
      },
    ];
  },
};

module.exports = nextConfig;
