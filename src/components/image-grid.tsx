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
                className="object-cover hover:opacity-90 transition-opacity"
                style={{ width: '300px', height: '410px' }}
                onClick={() =>
                  handleImageClick(
                    post.images[0].cdnUrl,
                    /*post.firstImage.alt ||*/ ''
                  )
                }
              />
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
