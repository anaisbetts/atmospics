import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://*.public.blob.vercel-storage.com/**'),
      new URL('https://image.mux.com/**'),
    ],
  },
  // Skip prerendering the page in build to avoid environment variable errors
  // Theme changes don't require environment variables
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
}

export default nextConfig
