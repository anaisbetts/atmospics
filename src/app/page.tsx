import { loadImageCache } from '@/lib/image-cache'
import { ContentManifest } from '@/lib/types'
import { loadFullContentManifest } from '@/lib/uploader'

import ImageGrid from '../components/image-grid'

// Skip static generation during build to avoid environment variable errors
export const dynamic = 'force-dynamic'

export default async function Home() {
  let manifest: ContentManifest = { posts: [], createdAt: '', hash: '' }
  let imageCache = new Map()

  try {
    // Only try to load content if we're not in a build environment
    if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
      ;[manifest, imageCache] = await Promise.all([
        loadFullContentManifest(),
        loadImageCache(),
      ])
    }
  } catch (error) {
    console.error('Failed to load content:', error)
    // Continue with empty data
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="font-bold text-2xl text-card-foreground">
            Photo Gallery
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {manifest.posts.length > 0 ? (
          <ImageGrid manifest={manifest} imageCache={imageCache} />
        ) : (
          <div className="rounded-lg border border-border p-8 text-center">
            <p className="text-foreground/70">No posts available</p>
          </div>
        )}
      </main>
    </div>
  )
}
