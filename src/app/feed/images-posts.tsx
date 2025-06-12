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

  const allImages = manifest.posts.flatMap((post) =>
    post.images.map((image) => ({
      ...image,
      postText: post.text,
      postDate: post.createdAt,
    }))
  )

  return (
    <>
      {allImages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No images found</div>
      ) : (
        <div className="grid grid-cols-3 gap-1" style={{ gap: '4px' }}>
          {allImages.map((image, index) => (
            <div key={index} className="relative">
              <Image
                src={image.cdnUrl}
                alt={/*image.alt ||*/ ''}
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
