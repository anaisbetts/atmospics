import { unstable_cache } from 'next/cache'
import Image from 'next/image'

import { ContentManifest } from '../../lib/types'
import { loadFullContentManifest } from '../../lib/uploader'

const getCachedContentManifest = unstable_cache(
  async () => {
    return await loadFullContentManifest()
  },
  ['content-manifest'],
  {
    revalidate: 5 * 60, // 5 minutes
    tags: ['content-manifest'],
  }
)

async function fetchContentManifest(): Promise<ContentManifest> {
  return await getCachedContentManifest()
}

export default async function ImagesPosts() {
  const manifest = await fetchContentManifest()

  const postsWithImages = manifest.posts
    .filter((post) => post.images.length > 0)
    .map((post) => ({
      ...post,
      firstImage: post.images[0],
    }))

  return (
    <>
      {postsWithImages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No images found</div>
      ) : (
        <div className="grid grid-cols-3 gap-1" style={{ gap: '4px' }}>
          {postsWithImages.map((post, index) => (
            <div key={post.id || index} className="relative">
              <Image
                src={post.firstImage.cdnUrl}
                alt={/*post.firstImage.alt ||*/ ''}
                width={300}
                height={410}
                className="object-cover"
                style={{ width: '300px', height: '410px' }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  )
}
