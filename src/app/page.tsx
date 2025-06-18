import { loadImageCache } from '@/lib/image-cache'
import { loadFullContentManifest } from '@/lib/uploader'

import ImageGrid from '../components/image-grid'

export default async function Home() {
  const [manifest, imageCache] = await Promise.all([
    loadFullContentManifest(),
    loadImageCache(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="font-bold text-2xl text-gray-900">BlueSky Posts</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-700 text-lg">
            Latest 20 Posts
          </h2>
        </div>

        <ImageGrid manifest={manifest} imageCache={imageCache} />
      </main>
    </div>
  )
}
