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
        hostname: '*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent-*.cdninstagram.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.cdninstagram.com',
      },
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
