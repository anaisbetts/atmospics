'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ContentManifest, Post } from '../lib/types'
import ImageDialog from './image-dialog'
import PostDetail from './post-detail'

export interface ImageGridProps {
  manifest: ContentManifest
  imageCache: Map<string, string>
}

export default function ImageGrid({ manifest, imageCache }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Post | null>(null)

  const resolveUrl = (originalUrl: string): string => {
    return imageCache.get(originalUrl) || originalUrl
  }
  const postsWithImages = manifest.posts.filter(
    (post) => post.images.length > 0
  )

  return (
    <>
      {postsWithImages.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No images found</div>
      ) : (
        <div
          className="grid grid-cols-1 gap-1 md:grid-cols-3"
          style={{ gap: '4px' }}
        >
          {postsWithImages.map((post, index) => (
            <div key={post.id || index} className="relative cursor-pointer">
              <Image
                src={resolveUrl(post.images[0].cdnUrl)}
                alt={/*post.firstImage.alt ||*/ ''}
                width={300}
                height={410}
                className="cursor-pointer object-cover transition-all duration-200 hover:brightness-80"
                style={{ width: '300px', height: '410px' }}
                onClick={() => setSelectedImage(post)}
              />
              {post.images.length > 1 && (
                <div className="absolute top-2 right-2 h-6 w-6">
                  <Image
                    src="/carousel.svg"
                    alt="Carousel icon"
                    width={24}
                    height={24}
                    className="drop-shadow-md"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedImage && (
        <ImageDialog
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
        >
          <PostDetail post={selectedImage} />
        </ImageDialog>
      )}
    </>
  )
}
