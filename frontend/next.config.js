/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/:path*',
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3000',
  },
};

module.exports = nextConfig;
