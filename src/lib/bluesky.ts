import type AtpAgent from '@atproto/api'
import { DateTime } from 'luxon'
import type { CID } from 'multiformats/cid'

import {
  Comment,
  ContentManifest,
  FeedBuilder,
  generateHashForComment,
  generateHashForManifest,
  generateHashForPost,
  ImageContent,
  Post,
} from './types'
import { createMuxClient } from './utils'

async function createAuthenticatedAgent() {
  const { default: AtpAgent } = await import('@atproto/api')
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

async function uploadVideoToMux(videoUrl: string): Promise<{
  playbackId: string
  width: number
  height: number
  thumbnailUrl: string
}> {
  const mux = await createMuxClient()

  // Create Mux asset from video URL
  const asset = await mux.video.assets.create({
    inputs: [{ url: videoUrl }],
    playback_policy: ['public'],
    master_access: 'temporary',
  })

  // Wait for asset to be ready
  let assetReady = false
  let attempts = 0
  const maxAttempts = 60 // 5 minutes with 5 second intervals

  while (!assetReady && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 5000))
    const updatedAsset = await mux.video.assets.retrieve(asset.id)

    if (updatedAsset.status === 'ready') {
      assetReady = true
      const playbackId = updatedAsset.playback_ids?.[0]?.id
      const tracks = updatedAsset.tracks

      if (!playbackId) {
        throw new Error('No playback ID found for Mux asset')
      }

      // Find video track for dimensions
      const videoTrack = tracks?.find((track) => track.type === 'video') as any
      const width = videoTrack?.width || 0
      const height = videoTrack?.height || 0

      // Generate thumbnail URL
      const thumbnailUrl = `https://image.mux.com/${playbackId}/thumbnail.jpg`

      return {
        playbackId,
        width,
        height,
        thumbnailUrl,
      }
    } else if (updatedAsset.status === 'errored') {
      throw new Error(
        `Mux asset processing failed: ${updatedAsset.errors?.messages?.join(', ')}`
      )
    }

    attempts++
  }

  throw new Error('Mux asset processing timed out')
}

async function fetchCommentsForPost(
  agent: AtpAgent,
  postUri: string
): Promise<Comment[]> {
  try {
    const response = await agent.getPostThread({
      uri: postUri,
      depth: 1, // Only fetch direct replies
    })

    if (!response.success) {
      console.warn(`Failed to fetch comments for post ${postUri}`)
      return []
    }

    const thread = response.data.thread
    if (!thread || thread.$type !== 'app.bsky.feed.defs#threadViewPost') {
      return []
    }

    const comments: Comment[] = []

    // Type cast to access replies property
    const threadViewPost = thread as any

    if (threadViewPost.replies) {
      for (const reply of threadViewPost.replies) {
        if (reply.$type === 'app.bsky.feed.defs#threadViewPost' && reply.post) {
          const post = reply.post
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const record = post.record as Record<string, any>

          const commentData = {
            author: {
              username: post.author.handle,
              displayName: post.author.displayName || post.author.handle,
              avatar: post.author.avatar || '',
            },
            text: record.text || '',
            originalContentLink: `https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`,
            createdAt: record.createdAt || post.indexedAt,
          }

          const comment = await generateHashForComment(commentData)
          comments.push(comment)
        }
      }
    }

    return comments
  } catch (error) {
    console.warn(`Error fetching comments for post ${postUri}:`, error)
    return []
  }
}

export class BlueskyFeedBuilder implements FeedBuilder {
  private handle: string
  private existingManifest?: ContentManifest

  constructor(handle: string, existingManifest?: ContentManifest) {
    this.handle = handle
    this.existingManifest = existingManifest
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
      const posts: Post[] = await Promise.all(
        postsResponse.data.feed.map(async (item) => {
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

          // Extract video from embed
          if (
            record.embed?.$type === 'app.bsky.embed.video' &&
            record.embed.video?.ref
          ) {
            const cid: CID = record.embed.video.ref
            const videoUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${targetDid}&cid=${cid.toString()}`

            // Check if video is already uploaded to Mux by looking for existing posts with this CID
            const existingPost = this.existingManifest?.posts.find(
              (p) => p.id === item.post.cid.toString()
            )
            const existingVideo = existingPost?.images.find(
              (img) =>
                img.type === 'video' && img.cdnUrl.includes('stream.mux.com')
            )

            if (existingVideo) {
              console.log(
                `Video for post ${item.post.cid.toString()} already uploaded to Mux, reusing`
              )
              images.push(existingVideo)
            } else {
              try {
                console.log(
                  `Processing video for post ${item.post.cid.toString()}`
                )
                const muxData = await uploadVideoToMux(videoUrl)

                // Store Mux playback URL as cdnUrl
                const playbackUrl = `https://stream.mux.com/${muxData.playbackId}.m3u8`

                images.push({
                  type: 'video',
                  cdnUrl: playbackUrl,
                  altText: record.embed.alt || '',
                  width: muxData.width,
                  height: muxData.height,
                  thumbnail: muxData.thumbnailUrl,
                })
              } catch (error) {
                console.error(
                  `Failed to process video for post ${item.post.cid.toString()}:`,
                  error
                )
                // Fall back to original video URL if Mux processing fails
                images.push({
                  type: 'video',
                  cdnUrl: videoUrl,
                  altText: record.embed.alt || '',
                  width: record.embed.aspectRatio?.width || 0,
                  height: record.embed.aspectRatio?.height || 0,
                })
              }
            }
          }

          // Generate BlueSky post URL
          const postUri = item.post.uri
          const postRkey = postUri.split('/').pop()
          const originalContentLink = `https://bsky.app/profile/${this.handle}/post/${postRkey}`

          // Fetch comments for this post
          const comments = await fetchCommentsForPost(agent, item.post.uri)

          const postData = {
            id: item.post.cid.toString(),
            images,
            text: record.text || 'No text content',
            createdAt: record.createdAt || item.post.indexedAt,
            originalContentLink,
            likeCount: item.post.likeCount || 0,
            comments,
            author: {
              username: item.post.author.handle,
              displayName:
                item.post.author.displayName || item.post.author.handle,
              avatar: item.post.author.avatar || '',
            },
          }

          return await generateHashForPost(postData)
        })
      )

      // Filter posts by 'since' date if provided
      for (const post of posts) {
        const postDate = DateTime.fromISO(post.createdAt)

        if (since && postDate < since) {
          shouldContinue = false
          break
        }

        // Only add posts that are newer than 'since'
        if (!since || postDate > since) {
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

    manifest.hash = await generateHashForManifest(manifest)

    return manifest
  }
}
