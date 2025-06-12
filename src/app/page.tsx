import { loadFullContentManifest } from '@/lib/uploader'

import ImageGrid from '../components/image-grid'

export default async function Home() {
  const manifest = await loadFullContentManifest()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">BlueSky Posts</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-700">
            Latest 20 Posts
          </h2>
        </div>

        <ImageGrid manifest={manifest} />
      </main>
    </div>
  )
}
