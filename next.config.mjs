/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide build activity overlay in dev by positioning it off-screen (Next.js ≥15.3)
  devIndicators: {
    position: 'bottom-left',
  },
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
      {
        protocol: 'https',
        hostname: '**.b-cdn.net',
      },
      {
        protocol: 'https',
        hostname: 'bunny.net',
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
      'cdninstagram.com',
      // Bunny.net CDN domains
      'bunny.net',
      '**.b-cdn.net',
      // Development placeholder images
      'via.placeholder.com'
    ],
  },
  // Force dynamic rendering and disable development features
  experimental: {
    forceSwcTransforms: true,
  },
  // Configure output for Vercel compatibility
  output: 'standalone',
  transpilePackages: [],
  // No custom webpack alias needed
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
