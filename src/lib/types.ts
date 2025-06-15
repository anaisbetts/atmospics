import crypto from 'crypto'
import { DateTime } from 'luxon'

export interface ImageContent {
  type: 'video' | 'image'
  cdnUrl: string
  altText: string
  width: number
  height: number
  geolocation?: number[] // lat/lng
}

export interface Post {
  id: string
  images: ImageContent[]
  text: string
  createdAt: string
  originalContentLink?: string
  likeCount?: number
  comments?: Comment[]
  hash: string
}

export interface Comment {
  username: string
  text: string
  profilePicture: string
  originalContentLink?: string
  createdAt?: string
  hash: string
}

export interface ContentManifest {
  createdAt: string
  hash: string
  posts: Post[]
}

export interface FeedBuilder {
  extractPosts(since?: DateTime): Promise<ContentManifest>
}

export function generateHashForComment(
  comment: Omit<Comment, 'hash'>
): Comment {
  const hash = crypto.createHash('sha256')
  hash.update(comment.username)
  hash.update(comment.text)
  hash.update(comment.profilePicture)
  hash.update(comment.originalContentLink || '')
  hash.update(comment.createdAt || '')
  return {
    ...comment,
    hash: hash.digest('hex'),
  }
}

export function generateHashForPost(post: Omit<Post, 'hash'>): Post {
  const hash = crypto.createHash('sha256')
  hash.update(post.id)
  hash.update(post.text)
  hash.update(post.createdAt)
  hash.update(post.originalContentLink || '')
  hash.update(post.likeCount?.toString() || '')

  post.images.forEach((image) => {
    hash.update(image.cdnUrl)
    hash.update(image.altText)
    hash.update(image.width.toString())
    hash.update(image.height.toString())
    if (image.geolocation) {
      hash.update(image.geolocation.join(','))
    }
  })

  if (post.comments) {
    post.comments.forEach((comment) => {
      hash.update(comment.hash)
    })
  }

  return {
    ...post,
    hash: hash.digest('hex'),
  }
}

export function generateHashForManifest(manifest: ContentManifest): string {
  const hash = crypto.createHash('sha256')
  hash.update(manifest.createdAt)

  manifest.posts.forEach((post) => {
    hash.update(post.hash)
  })

  return hash.digest('hex')
}
