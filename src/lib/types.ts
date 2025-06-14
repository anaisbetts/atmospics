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
}

export interface Comment {
  username: string
  text: string
  profilePicture: string
  originalContentLink?: string
  createdAt?: string
}

export interface ContentManifest {
  createdAt: string
  hash: string
  posts: Post[]
}

export interface FeedBuilder {
  extractPosts(since?: DateTime): Promise<ContentManifest>
}

export function generateHashForManifest(manifest: ContentManifest): string {
  const hash = crypto.createHash('sha256')
  hash.update(manifest.createdAt)

  manifest.posts.forEach((post) => {
    hash.update(post.id)
  })

  return hash.digest('hex')
}
