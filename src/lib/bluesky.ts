import AtpAgent from '@atproto/api'
import { DateTime } from 'luxon'
import { CID } from 'multiformats/cid'

import {
  ContentManifest,
  FeedBuilder,
  ImageContent,
  Post,
  generateHashForManifest,
} from './types'

async function createAuthenticatedAgent() {
  const bskyUser = process.env.BSKY_USER
  const bskyPass = process.env.BSKY_PASS

  if (!bskyUser || !bskyPass) {
    throw new Error(
      'BSKY_USER and BSKY_PASS environment variables are required'
    )
  }

  const agent = new AtpAgent({
    service: 'https://bsky.social',
  })

  await agent.login({
    identifier: bskyUser,
    password: bskyPass,
  })

  return agent
}

export class BlueskyFeedBuilder implements FeedBuilder {
  private handle: string

  constructor(handle: string) {
    this.handle = handle
  }

  async extractPosts(since?: DateTime): Promise<ContentManifest> {
    const agent = await createAuthenticatedAgent()

    // First, resolve target's profile to get their DID
    const profileResponse = await agent.getProfile({
      actor: this.handle,
    })

    if (!profileResponse.success) {
      throw new Error(`Could not find ${this.handle} profile`)
    }

    const targetDid = profileResponse.data.did

    const allPosts: Post[] = []
    let cursor: string | undefined
    let shouldContinue = true

    while (shouldContinue) {
      // Fetch target's posts with pagination
      const postsResponse = await agent.getAuthorFeed({
        actor: targetDid,
        limit: 50,
        cursor,
      })

      if (!postsResponse.success) {
        throw new Error('Failed to fetch posts')
      }

      // Extract post content and images
      const posts: Post[] = postsResponse.data.feed.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const record = item.post.record as Record<string, any>
        const images: ImageContent[] = []

        // Extract images from embed
        if (record.embed?.images) {
          for (const img of record.embed.images) {
            if (img.image?.ref) {
              const cid: CID = img.image.ref

              const cdn = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${targetDid}&cid=${cid.toString()}`
              images.push({
                type: 'image',
                cdnUrl: cdn,
                altText: img.alt || '',
                width: img.aspectRatio?.width || 0,
                height: img.aspectRatio?.height || 0,
              })
            } else {
              console.warn('Image ref is not a link!', img.image)
            }
          }
        }

        return {
          id: item.post.cid.toString(),
          images,
          text: record.text || 'No text content',
          createdAt: record.createdAt || item.post.indexedAt,
        }
      })

      // Filter posts by 'since' date if provided
      for (const post of posts) {
        const postDate = DateTime.fromISO(post.createdAt)

        if (since && postDate < since) {
          shouldContinue = false
          break
        }

        // Only add posts that are newer than or equal to 'since'
        if (!since || postDate >= since) {
          allPosts.push(post)
        }
      }

      // Check if there are more posts to fetch
      cursor = postsResponse.data.cursor
      if (!cursor || postsResponse.data.feed.length === 0) {
        shouldContinue = false
      }
    }

    const manifest: ContentManifest = {
      createdAt: new Date().toISOString(),
      hash: '', // Will be set by generateHashForManifest
      posts: allPosts,
    }

    manifest.hash = generateHashForManifest(manifest)

    return manifest
  }
}
