'use client'

import MuxPlayer from '@mux/mux-player-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'
import { useEffect, useState } from 'react'

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { Post } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DateTime } from 'luxon'
import Comment from './comment'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface PostDetailProps {
  post: Post
  onLike?: () => void
}

export default function PostDetail({ post, onLike }: PostDetailProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  const images = post.images
  const timeAgo = DateTime.fromISO(post.createdAt).toRelative() || 'just now'
  const formattedDate = DateTime.fromISO(post.createdAt).toFormat(
    'MMMM d, yyyy'
  )

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  // Convert Post comments to Comment component props
  const comments =
    post.comments?.map((comment) => ({
      id: comment.hash,
      author: {
        username: comment.author.username,
        displayName: comment.author.displayName,
        avatar: comment.author.avatar,
      },
      content: comment.text,
      createdAt: comment.createdAt || post.createdAt,
      likes: Math.floor(Math.random() * 10), // Random likes for demo
      isLiked: Math.random() > 0.5, // Random liked state for demo
    })) || []

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Use the direct author information from the post
  const author = post.author
    ? {
        name: post.author.displayName,
        username: post.author.username.toLowerCase().replace(/\s+/g, ''),
        avatar: post.author.avatar,
      }
    : {
        name: 'Unknown User',
        username: 'unknown',
        avatar: undefined,
      }

  if (images.length === 0) return null

  return (
    <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg md:flex-row">
      {/* Image carousel */}
      <div className="flex-1">
        <div
          className={cn(
            'group relative aspect-square min-h-[300px] w-full md:h-full md:min-h-[200px]'
          )}
        >
          <Carousel
            setApi={setApi}
            className="h-full w-full"
            opts={{
              align: 'start',
              loop: false,
            }}
          >
            <CarouselContent className="h-full">
              {images.map((image, index) => (
                <CarouselItem key={index} className="h-full">
                  <div className="relative flex h-full w-full items-center justify-center bg-black">
                    {image.type === 'image' ? (
                      <img
                        src={image.cdnUrl}
                        alt={image.altText || `Post image ${index + 1}`}
                        className="max-h-full max-w-full object-contain object-center"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    ) : (
                      <VideoPlayer image={image} index={index} />
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Arrows - Only show if more than 1 image */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => api?.scrollPrev()}
                  className="-translate-y-1/2 absolute top-1/2 left-2 z-10 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
                  disabled={current === 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Previous image</span>
                </button>
                <button
                  onClick={() => api?.scrollNext()}
                  className="-translate-y-1/2 absolute top-1/2 right-2 z-10 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity duration-200 hover:bg-black/70 group-hover:opacity-100"
                  disabled={current === count}
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next image</span>
                </button>
              </>
            )}
          </Carousel>

          {/* Dots Indicator - Only show if more than 1 image */}
          {images.length > 1 && (
            <div className="-translate-x-1/2 absolute bottom-4 left-1/2 z-10 flex space-x-2">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => api?.scrollTo(index)}
                  className={cn(
                    'h-2 w-2 rounded-full transition-all duration-200',
                    index + 1 === current
                      ? 'bg-white'
                      : 'bg-white/50 hover:bg-white/70'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Post info and comments */}
      <div className="flex w-full flex-col md:w-96">
        {/* Post header */}
        <div className="flex items-center gap-3 border-gray-200 border-b p-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={author.avatar} alt={`${author.name}'s avatar`} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-medium text-white text-xs">
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{author.name}</h3>
            <p className="text-gray-500 text-xs">{timeAgo}</p>
          </div>
        </div>

        {/* Post content */}
        {post.text && post.text !== 'No text content' && (
          <div className="border-gray-200 border-b p-4">
            <p className="text-sm">{post.text}</p>
          </div>
        )}

        {/* Comments section */}
        <div className="flex-1 overflow-y-auto md:max-h-[400px]">
          <div className="space-y-2 p-4">
            {comments.map((comment) => (
              <Comment key={comment.id} {...comment} />
            ))}
          </div>
        </div>

        {/* Bottom section - Like count and date */}
        <div className="border-gray-200 border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onLike}
                className="flex items-center gap-1 text-gray-600 transition-colors hover:text-red-500"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  />
                </svg>
              </button>
              <span className="font-semibold text-sm">
                {post.likeCount || 0} likes
              </span>

              {/* Share button */}
              <button
                onClick={() => {
                  const shareUrl = `${window.location.origin}/post/${post.id}`
                  navigator.clipboard.writeText(shareUrl)
                }}
                className="ml-2 flex items-center gap-1 text-gray-600 transition-colors hover:text-blue-500"
                title="Copy share link"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                  />
                </svg>
              </button>
            </div>
            <time className="text-gray-500 text-xs">{formattedDate}</time>
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoPlayer({ image, index }: { image: any; index: number }) {
  const playbackId = getMuxPlaybackId(image.cdnUrl)

  if (playbackId) {
    return (
      <MuxPlayer
        playbackId={playbackId}
        metadata={{
          video_title: image.altText || `Post video ${index + 1}`,
        }}
        className="max-h-full max-w-full"
        style={{ width: 'auto', height: 'auto' }}
        autoPlay={false}
      />
    )
  }

  return (
    <video
      src={image.cdnUrl}
      className="max-h-full max-w-full object-contain"
      controls
      preload="metadata"
      aria-label={image.altText || `Post video ${index + 1}`}
      style={{ width: 'auto', height: 'auto' }}
    />
  )
}

function getMuxPlaybackId(cdnUrl: string): string | null {
  try {
    // Check if it's a Mux streaming URL (e.g., https://stream.mux.com/PLAYBACK_ID.m3u8)
    const muxStreamMatch = cdnUrl.match(/stream\.mux\.com\/([^.]+)\.m3u8/)
    if (muxStreamMatch) {
      return muxStreamMatch[1]
    }
    return null
  } catch {
    return null
  }
}
