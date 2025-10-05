import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'image.mux.com',
      },
    ],
  },
  // Skip prerendering the page in build to avoid environment variable errors
  // Theme changes don't require environment variables
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = Array.isArray(config.externals)
        ? config.externals
        : []
      externals.push({
        '@atproto/api': 'commonjs @atproto/api',
        '@atproto/lexicon': 'commonjs @atproto/lexicon',
        '@atproto/common-web': 'commonjs @atproto/common-web',
        multiformats: 'commonjs multiformats',
        'multiformats/cid': 'commonjs multiformats/cid',
      })
      config.externals = externals
    }
    return config
  },
}

export default nextConfig
