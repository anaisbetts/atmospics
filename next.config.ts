import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL('https://*.public.blob.vercel-storage.com/**')],
  },
  /* config options here */
}

export default nextConfig
