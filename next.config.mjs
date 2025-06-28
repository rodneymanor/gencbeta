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
        hostname: 'scontent-waw2-1.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-waw2-2.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-waw1-1.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-waw1-2.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-atl3-1.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-atl3-2.cdninstagram.com',
      },
    ],
    domains: [
      'scontent-waw2-1.cdninstagram.com',
      'scontent-waw2-2.cdninstagram.com',
      'scontent-waw1-1.cdninstagram.com',
      'scontent-waw1-2.cdninstagram.com',
      'scontent-atl3-1.cdninstagram.com',
      'scontent-atl3-2.cdninstagram.com',
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
        destination: '/dashboard/content-creator',
        permanent: false,
      },
    ];
  },
}

export default nextConfig
