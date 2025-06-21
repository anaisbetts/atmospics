'use client'

import { Post } from '@/lib/types'
import { DateTime } from 'luxon'
import Comment from './comment'
import { PostCarousel } from './post-carousel'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

interface PostDetailProps {
  post: Post
  onLike?: () => void
}

export default function PostDetail({ post, onLike }: PostDetailProps) {
  const timeAgo = DateTime.fromISO(post.createdAt).toRelative() || 'just now'
  const formattedDate = DateTime.fromISO(post.createdAt).toFormat(
    'MMMM d, yyyy'
  )

  // Convert Post comments to Comment component props
  const comments =
    post.comments?.map((comment) => ({
      id: comment.hash,
      author: {
        name: comment.username,
        username: comment.username.toLowerCase().replace(/\s+/g, ''),
        avatar: comment.profilePicture,
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

  // Extract author info from first comment or use placeholder
  const author = post.comments?.[0]
    ? {
        name: post.comments[0].username,
        username: post.comments[0].username.toLowerCase().replace(/\s+/g, ''),
        avatar: post.comments[0].profilePicture,
      }
    : {
        name: 'Anonymous',
        username: 'anonymous',
        avatar: undefined,
      }

  return (
    <div className="mx-auto flex max-w-6xl overflow-hidden rounded-lg border border-gray-300 bg-white shadow-lg">
      {/* Left side - Image carousel */}
      <div className="flex-1">
        <PostCarousel images={post.images} className="aspect-square" />
      </div>

      {/* Right side - Post info and comments */}
      <div className="flex w-96 flex-col">
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
        {post.text && (
          <div className="border-gray-200 border-b p-4">
            <p className="text-sm">{post.text}</p>
          </div>
        )}

        {/* Comments section */}
        <div className="flex-1 overflow-y-auto">
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
            </div>
            <time className="text-gray-500 text-xs">{formattedDate}</time>
          </div>
        </div>
      </div>
    </div>
  )
}
