'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'
import { useEffect, useState } from 'react'

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel'
import { ImageContent } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PostCarouselProps {
  images: ImageContent[]
  className?: string
}

export function PostCarousel({ images, className }: PostCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  console.log('PostCarousel images count:', images.length)

  useEffect(() => {
    if (!api) return

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

  if (images.length === 0) return null

  return (
    <div className={cn('group relative bg-red-300', className)}>
      <Carousel
        setApi={setApi}
        className="w-full"
        opts={{
          align: 'start',
          loop: false,
        }}
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative flex h-full w-full items-center justify-center bg-green-400">
                {image.type === 'image' ? (
                  <Image
                    src={image.cdnUrl}
                    alt={`Post image ${index + 1}`}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <video
                    src={image.cdnUrl}
                    className="h-full w-full object-contain"
                    controls
                    preload="metadata"
                  />
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
  )
}
