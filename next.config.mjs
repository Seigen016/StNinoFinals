/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable Turbopack (default in Next.js 16)
  turbopack: {},
  // Reduce bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        sideEffects: false,
      }
    }
    return config
  },
  // Compress responses
  compress: true,
}

export default nextConfig
