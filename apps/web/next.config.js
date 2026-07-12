/** @type {import('next').NextConfig} */
const API_BACKEND = (
  process.env.API_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/[^\x21-\x7E]/g, '').replace(/\/api\/v1\/?$/, '') ||
  'https://eb-payments-api.onrender.com'
).replace(/\/+$/, '');

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
