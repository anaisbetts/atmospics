import { isBuildPhase, loadGallery } from '@/lib/gallery'
import { ContentManifest } from '@/lib/types'

import ImageGrid from '../components/image-grid'

export const revalidate = 60

export default async function Home() {
  let manifest: ContentManifest = { posts: [], createdAt: '', hash: '' }
  let imageCache = new Map<string, string>()

  try {
    ;({ manifest, imageCache } = await loadGallery())
  } catch (error) {
    // At runtime, throwing keeps the last successfully generated page
    if (!isBuildPhase()) {
      throw error
    }

    console.error('Failed to load content during build:', error)
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
