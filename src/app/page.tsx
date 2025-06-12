import { Suspense } from 'react'

import ImagesPosts from './feed/images-posts'

export default function Home() {
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

        <Suspense
          fallback={
            <div className="text-center text-gray-500 py-8">
              Loading posts...
            </div>
          }
        >
          <ImagesPosts />
        </Suspense>
      </main>
    </div>
  )
}
