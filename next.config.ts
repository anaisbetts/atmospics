import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://*.public.blob.vercel-storage.com/**'),
      new URL('https://image.mux.com/**'),
    ],
  },
  /* config options here */
}

export default nextConfig
