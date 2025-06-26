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
  async redirects() {
    return [];
  },
  // Trigger a fresh build to clear the Vercel cache
  experimental: {
    // Other experimental features can be added here
  },
}

export default nextConfig
