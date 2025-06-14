'use client'

import { DateTime } from 'luxon'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'

export interface CommentProps {
  id: string
  author: {
    name: string
    avatar?: string
    username: string
  }
  content: string
  createdAt: string
  likes?: number
  isLiked?: boolean
  onLike?: () => void
}

export default function Comment({
  author,
  content,
  createdAt,
  likes = 0,
  isLiked = false,
  onLike,
}: CommentProps) {
  const timeAgo = DateTime.fromISO(createdAt).toRelative() || 'just now'

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={author.avatar} alt={`${author.name}'s avatar`} />
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-medium text-sm text-white">
          {getInitials(author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h4 className="truncate font-semibold text-gray-900 text-sm">
            {author.name}
          </h4>
          <span className="text-gray-500 text-sm">@{author.username}</span>
          <span className="text-gray-400 text-xs">•</span>
          <time className="text-gray-500 text-xs" dateTime={createdAt}>
            {timeAgo}
          </time>
        </div>

        <p className="mb-3 whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
          {content}
        </p>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onLike}
            className={`flex items-center gap-1 rounded-full px-2 py-1 font-medium text-xs transition-colors ${
              isLiked
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg
              className={`h-4 w-4 ${isLiked ? 'fill-current' : 'fill-none stroke-current'}`}
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {likes > 0 && <span>{likes}</span>}
          </button>

          <button
            type="button"
            className="flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 font-medium text-gray-600 text-xs transition-colors hover:bg-gray-100"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            Reply
          </button>
        </div>
      </div>
    </div>
  )
}
