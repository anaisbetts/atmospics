'use client'

import Image from 'next/image'
import { useState } from 'react'

import { ContentManifest } from '../lib/types'
import ImageDialog from './image-dialog'

export interface ImageGridProps {
  manifest: ContentManifest
}

export default function ImageGrid({ manifest }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<{
    src: string
    alt: string
  } | null>(null)

  const handleImageClick = (src: string, alt: string) => {
    setSelectedImage({ src, alt })
  }

  const handleCloseDialog = () => {
    setSelectedImage(null)
  }

  const postsWithImages = manifest.posts.filter(
    (post) => post.images.length > 0
  )

  return (
    <>
      {postsWithImages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No images found</div>
      ) : (
        <div className="grid grid-cols-3 gap-1" style={{ gap: '4px' }}>
          {postsWithImages.map((post, index) => (
            <div key={post.id || index} className="relative cursor-pointer">
              <Image
                src={post.images[0].cdnUrl}
                alt={/*post.firstImage.alt ||*/ ''}
                width={300}
                height={410}
                className="object-cover hover:brightness-80 transition-all duration-200 cursor-pointer"
                style={{ width: '300px', height: '410px' }}
                onClick={() =>
                  handleImageClick(
                    post.images[0].cdnUrl,
                    /*post.firstImage.alt ||*/ ''
                  )
                }
              />
              {post.images.length > 1 && (
                <div className="absolute top-2 right-2 w-6 h-6">
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
          src={selectedImage.src}
          alt={selectedImage.alt}
          isOpen={!!selectedImage}
          onClose={handleCloseDialog}
        />
      )}
    </>
  )
}
