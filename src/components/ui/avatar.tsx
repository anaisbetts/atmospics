'use client'

import NextImage from 'next/image'
import * as React from 'react'
import { cn } from '../../lib/utils'

const Avatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = 'Avatar'

type AvatarImageProps = Omit<
  React.ComponentProps<typeof NextImage>,
  'fill' | 'width' | 'height'
> & { className?: string }

const AvatarImage = ({ className, alt = '', ...props }: AvatarImageProps) => {
  return (
    <NextImage
      alt={alt}
      fill
      sizes="40px"
      className={cn('aspect-square h-full w-full object-cover', className)}
      loading="lazy"
      {...props}
    />
  )
}
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-muted',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
