import { DateTime } from 'luxon'
import { HashBuilder } from './hash-utils'

export interface ImageContent {
  type: 'video' | 'image'
  cdnUrl: string
  altText: string
  width: number
  height: number
  geolocation?: number[] // lat/lng
  thumbnail?: string // For video content
}

export interface Author {
  username: string
  displayName: string
  avatar: string
}

export interface Post {
  id: string
  images: ImageContent[]
  text: string
  createdAt: string
  originalContentLink?: string
  likeCount?: number
  comments?: Comment[]
  author?: Author
  hash: string
}

export interface Comment {
  author: Author
  text: string
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

export async function generateHashForComment(
  comment: Omit<Comment, 'hash'>
): Promise<Comment> {
  const hash = new HashBuilder()
  hash.update(comment.author.username)
  hash.update(comment.author.displayName)
  hash.update(comment.author.avatar)
  hash.update(comment.text)
  hash.update(comment.originalContentLink || '')
  hash.update(comment.createdAt || '')
  return {
    ...comment,
    hash: await hash.digest(),
  }
}

export async function generateHashForPost(
  post: Omit<Post, 'hash'>
): Promise<Post> {
  const hash = new HashBuilder()
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
    if (image.thumbnail) {
      hash.update(image.thumbnail)
    }
  })

  if (post.comments) {
    post.comments.forEach((comment) => {
      hash.update(comment.hash)
    })
  }

  if (post.author) {
    hash.update(post.author.username)
    hash.update(post.author.displayName)
    hash.update(post.author.avatar)
  }

  return {
    ...post,
    hash: await hash.digest(),
  }
}

export async function generateHashForManifest(
  manifest: ContentManifest
): Promise<string> {
  const hash = new HashBuilder()
  hash.update(manifest.createdAt)

  manifest.posts.forEach((post) => {
    hash.update(post.hash)
  })

  return hash.digest()
}
