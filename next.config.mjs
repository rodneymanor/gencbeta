/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  // Ignore lint and TypeScript errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configure external image domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent**.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'instagram.com',
      },
    ],
    domains: [
      // Instagram CDN domains - regional servers
      'scontent-waw2-1.cdninstagram.com',
      'scontent-waw2-2.cdninstagram.com',
      'scontent-waw1-1.cdninstagram.com',
      'scontent-waw1-2.cdninstagram.com',
      'scontent-atl3-1.cdninstagram.com',
      'scontent-atl3-2.cdninstagram.com',
      'scontent-iev1-1.cdninstagram.com',
      'scontent-iev1-2.cdninstagram.com',
      'scontent-fra3-1.cdninstagram.com',
      'scontent-fra3-2.cdninstagram.com',
      'scontent-ams4-1.cdninstagram.com',
      'scontent-ams4-2.cdninstagram.com',
      'scontent-lhr8-1.cdninstagram.com',
      'scontent-lhr8-2.cdninstagram.com',
      'scontent-sjc3-1.cdninstagram.com',
      'scontent-sjc3-2.cdninstagram.com',
      'scontent-ord5-1.cdninstagram.com',
      'scontent-ord5-2.cdninstagram.com',
      'scontent-iad3-1.cdninstagram.com',
      'scontent-iad3-2.cdninstagram.com',
      'scontent-dfw5-1.cdninstagram.com',
      'scontent-dfw5-2.cdninstagram.com',
      'scontent-lax3-1.cdninstagram.com',
      'scontent-lax3-2.cdninstagram.com',
      'instagram.com',
      'cdninstagram.com'
    ],
  },
  // Force dynamic rendering for problematic pages
  experimental: {
    forceSwcTransforms: true,
  },
  // Configure output for Vercel compatibility
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard/scripts/new',
        permanent: false,
      },
    ];
  },
}

export default nextConfig
