import crypto from 'crypto'
import { DateTime } from 'luxon'

export interface ImageContent {
  type: 'video' | 'image'
  cdnUrl: string
}

export interface Post {
  id: string
  images: ImageContent[]
  text: string
  createdAt: string
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
