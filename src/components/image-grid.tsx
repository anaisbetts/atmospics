'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ContentManifest, Post } from '../lib/types'
import { resolveImageUrl } from '../lib/utils'
import ImageDialog from './image-dialog'
import PostDetail from './post-detail'

export interface ImageGridProps {
  manifest: ContentManifest
  imageCache: Map<string, string>
}

export default function ImageGrid({ manifest, imageCache }: ImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<Post | null>(null)
  const [_currentHash, setCurrentHash] = useState('')
  const [columns, setColumns] = useState<number>(1)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  // Memoize posts lookup to avoid recreating on every render
  const postsById = useMemo(() => {
    const map = new Map<string, Post>()
    manifest.posts.forEach((post) => map.set(post.id, post))
    return map
  }, [manifest.posts])

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)')
    const update = () => setColumns(mql.matches ? 3 : 1)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [])

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) // Remove #
      setCurrentHash(hash)

      if (hash.startsWith('post-')) {
        const postId = hash.replace('post-', '')
        const post = postsById.get(postId)
        setSelectedImage(post || null)
      } else {
        setSelectedImage(null)
      }
    }

    // Set initial hash
    handleHashChange()

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [postsById])

  const handleImageClick = (post: Post) => {
    if (post.id) {
      // Set state immediately for responsive UI
      setSelectedImage(post)

      // Then update hash
      window.location.hash = `post-${post.id}`
    }
  }

  const handleGridKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    total: number
  ) => {
    let nextIndex = -1
    switch (event.key) {
      case 'ArrowRight':
        nextIndex = Math.min(index + 1, total - 1)
        break
      case 'ArrowLeft':
        nextIndex = Math.max(index - 1, 0)
        break
      case 'ArrowDown':
        nextIndex = Math.min(index + columns, total - 1)
        break
      case 'ArrowUp':
        nextIndex = Math.max(index - columns, 0)
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = total - 1
        break
      default:
        return
    }
    event.preventDefault()
    const next = itemRefs.current[nextIndex]
    next?.focus()
  }

  const handleClose = () => {
    // Clear state immediately
    setSelectedImage(null)
    // Clear hash without triggering scroll
    const currentScrollY = window.scrollY
    window.location.hash = ''
    // Immediately restore scroll position to prevent jump
    window.scrollTo(0, currentScrollY)
  }

  const _getDisplayUrl = (image: any): string => {
    // For video content, use thumbnail if available, otherwise fall back to cdnUrl
    if (image.type === 'video' && image.thumbnail) {
      return resolveImageUrl(image.thumbnail, imageCache)
    }
    return resolveImageUrl(image.cdnUrl, imageCache)
  }
  const postsWithImages = manifest.posts.filter(
    (post) => post.images.length > 0
  )

  return (
    <>
      {postsWithImages.length === 0 ? (
        <div
          className="py-8 text-center text-gray-500"
          role="status"
          aria-live="polite"
        >
          No images found
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-1 md:grid-cols-3"
          style={{ gap: '4px' }}
          role="grid"
          aria-label="Image gallery"
        >
          {postsWithImages.map((post, index) => (
            <div
              key={post.id || index}
              className="relative"
              role="gridcell"
              aria-rowindex={Math.floor(index / columns) + 1}
              aria-colindex={(index % columns) + 1}
            >
              <button
                className="relative h-full w-full cursor-pointer rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => handleImageClick(post)}
                aria-label={`View image from post: ${post.text || `Post ${index + 1}`}`}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                onKeyDown={(e) =>
                  handleGridKeyDown(e, index, postsWithImages.length)
                }
              >
                <Image
                  src={_getDisplayUrl(post.images[0])}
                  alt={post.text || `Post ${index + 1}`}
                  width={300}
                  height={410}
                  className="object-cover transition-all duration-200 hover:brightness-80"
                  style={{ width: '300px', height: '410px' }}
                />
              </button>

              {/* Video indicator */}
              {post.images[0].type === 'video' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black bg-opacity-60 p-3">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-white"
                    >
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Multiple images indicator */}
              {post.images.length > 1 && (
                <div className="pointer-events-none absolute top-2 right-2 h-6 w-6">
                  <Image
                    src="/carousel.svg"
                    alt={`${post.images.length} images`}
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
        <ImageDialog isOpen={!!selectedImage} onClose={handleClose}>
          <PostDetail post={selectedImage} imageCache={imageCache} />
        </ImageDialog>
      )}
    </>
  )
}
