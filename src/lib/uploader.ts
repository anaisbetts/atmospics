import { asyncMap } from '@anaisbetts/commands'
import { del, head, list, put } from '@vercel/blob'
import { DateTime } from 'luxon'

import { BlueskyFeedBuilder } from './bluesky'
import { ImageCache } from './image-cache'
import {
  Author,
  ContentManifest,
  Post,
  generateHashForManifest,
  generateHashForPost,
} from './types'
import { fixUnicodeDoubleEncoding } from './utils'

// Cache for Bluesky profile avatar to avoid repeated API calls
let cachedBlueskyAvatar: string | null = null

async function getBlueskyProfileAvatar(): Promise<string> {
  if (cachedBlueskyAvatar) {
    return cachedBlueskyAvatar
  }

  try {
    const AtpAgent = (await import('@atproto/api')).default
    const agent = new AtpAgent({
      service: 'https://bsky.social',
    })

    const bskyUser = process.env.BSKY_USER
    const bskyPass = process.env.BSKY_PASS

    if (!bskyUser || !bskyPass) {
      console.warn(
        'BSKY_USER and BSKY_PASS not available, using fallback avatar'
      )
      return ''
    }

    await agent.login({
      identifier: bskyUser,
      password: bskyPass,
    })

    const profileResponse = await agent.getProfile({
      actor: bskyUser,
    })

    if (profileResponse.success && profileResponse.data.avatar) {
      cachedBlueskyAvatar = profileResponse.data.avatar
      return cachedBlueskyAvatar
    }

    return ''
  } catch (error) {
    console.warn('Failed to get Bluesky profile avatar:', error)
    return ''
  }
}

export async function loadFullContentManifest(): Promise<ContentManifest> {
  let existingManifest: ContentManifest | undefined
  let originalHash = ''

  try {
    existingManifest = await fetchContentManifest()
    originalHash = existingManifest.hash
  } catch (error) {
    console.error(
      'Failed to fetch content manifest, starting from scratch:',
      error
    )
  }

  // Generate new manifest from current BlueSky content
  let newManifest: ContentManifest | undefined

  // Try to fetch and merge archive manifest
  try {
    const archiveManifest = await fetchArchiveManifest()
    if (archiveManifest) {
      console.log(
        `Found archive manifest with ${archiveManifest.posts.length} posts`
      )

      if (!newManifest) {
        newManifest = {
          createdAt: archiveManifest.createdAt,
          hash: '',
          posts: [],
        }
      }

      newManifest = await mergeManifests(newManifest, archiveManifest)
      console.log(
        `Merged archive manifest, now have ${newManifest.posts.length} total posts`
      )
    }
  } catch (error) {
    console.error('Failed to fetch or merge archive manifest:', error)
  }

  // Update content from BlueSky
  const feedBuilder = new BlueskyFeedBuilder(
    process.env.BSKY_TARGET!,
    existingManifest
  )
  const latestPosts = await feedBuilder.extractPosts()

  if (!newManifest) {
    newManifest = {
      createdAt: latestPosts.createdAt,
      hash: '',
      posts: [],
    }
  }

  if (latestPosts.posts.length > 0) {
    newManifest = await mergeManifests(newManifest, latestPosts)
  }

  // Generate hash for the new manifest
  newManifest.hash = await generateHashForManifest(newManifest)

  // Compare with existing manifest and only save if different
  if (newManifest.hash !== originalHash) {
    console.log('Manifest content changed, uploading new version')
    await saveContentManifest(newManifest)
  } else {
    console.log('Manifest content unchanged, skipping upload')
    // Use existing manifest if no changes
    if (existingManifest) {
      newManifest = existingManifest
    }
  }

  // Rehost images from the manifest (this doesn't modify the manifest)
  await rehostContent(newManifest)

  return newManifest
}

export async function rehostContent(
  manifest: ContentManifest
): Promise<ImageCache> {
  const imageCache = new ImageCache()
  await imageCache.initialize()

  // Process all images in the manifest without modifying the manifest structure
  for (const post of manifest.posts) {
    // Process post images
    for (const image of post.images) {
      try {
        await imageCache.rehostContent(image.cdnUrl)
      } catch (error) {
        console.warn(`Failed to rehost image ${image.cdnUrl}:`, error)
      }
    }

    // Process profile pictures in comments
    if (post.comments) {
      for (const comment of post.comments) {
        if (comment.author?.avatar) {
          try {
            await imageCache.rehostContent(comment.author.avatar)
          } catch (error) {
            console.warn(
              `Failed to rehost profile picture ${comment.author?.avatar}:`,
              error
            )
          }
        }
      }
    }
  }

  await imageCache.serialize()

  console.log(
    `Completed rehosting check for manifest with ${manifest.posts.length} posts`
  )

  return imageCache
}

export async function fetchContentManifest(): Promise<ContentManifest> {
  const info = await head('content-manifest.json')

  // Fetch without next.js caching
  const response = await fetch(info.url, {
    next: { revalidate: 0 },
  })

  return (await response.json()) as ContentManifest
}

async function normalizeArchivePosts(
  manifest: ContentManifest
): Promise<ContentManifest> {
  const blueskyAvatar = await getBlueskyProfileAvatar()

  const normalizedPosts = await asyncMap(manifest.posts, async (post) => {
    // If post doesn't have an author, substitute with Instagram import info
    if (!post.author) {
      const authorInfo: Author = {
        username: 'imported-from-instagram',
        displayName: 'Imported from Instagram',
        avatar: blueskyAvatar,
      }

      // NB: Instagram double-encodes emoji and sends back garbage data,
      // fix it for them
      const postWithAuthor = {
        ...post,
        text: fixUnicodeDoubleEncoding(post.text ?? ''),
        author: authorInfo,
      }

      // Regenerate hash since we added author info
      return await generateHashForPost(postWithAuthor)
    }

    return post
  })

  return {
    ...manifest,
    posts: Array.from(normalizedPosts.values()),
  }
}

export async function fetchArchiveManifest(): Promise<ContentManifest | null> {
  try {
    const info = await head('archive-manifest.json')

    // Fetch without next.js caching
    console.log(`Fetching archive manifest from ${info.url}`)
    const response = await fetch(info.url, {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      return null
    }

    const rawManifest = (await response.json()) as ContentManifest

    // Normalize posts to ensure they have proper author information
    return await normalizeArchivePosts(rawManifest)
  } catch (error) {
    console.log('Archive manifest not found or failed to fetch')
    return null
  }
}

export async function saveContentManifest(
  manifest: ContentManifest
): Promise<void> {
  const filename = `content-manifest.json`

  // Check if we need to merge with remote changes right before upload
  try {
    const remoteManifest = await fetchContentManifest()

    if (remoteManifest.hash !== manifest.hash) {
      console.log(
        'Remote manifest has changed, checking if upload is still needed'
      )

      // If the remote manifest is different but has the same content hash, skip upload
      if (remoteManifest.hash === (await generateHashForManifest(manifest))) {
        console.log(
          'Remote manifest already matches our content, skipping upload'
        )
        return
      }
    }
  } catch (error) {
    // Remote manifest doesn't exist or couldn't be fetched, proceed with upload
    console.log('Remote manifest not found, proceeding with upload')
  }

  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json',
  })

  const { url } = await put(filename, blob, {
    access: 'public',
    allowOverwrite: true,
  })

  console.log(`Saved content manifest to ${url}`)
}

async function mergeManifests(
  manifest: ContentManifest,
  newPosts: ContentManifest
): Promise<ContentManifest> {
  const allPosts = [...manifest.posts, ...newPosts.posts]

  const uniquePosts = allPosts.reduce((acc, post) => {
    if (!acc.find((p) => p.id === post.id)) {
      acc.push(post)
    }
    return acc
  }, [] as Post[])

  uniquePosts.sort((a, b) => {
    const dateA = DateTime.fromISO(a.createdAt)
    const dateB = DateTime.fromISO(b.createdAt)
    return dateB.toMillis() - dateA.toMillis()
  })

  const mergedManifest = {
    ...manifest,
    posts: uniquePosts,
  }

  mergedManifest.hash = await generateHashForManifest(mergedManifest)
  return mergedManifest
}

export async function deleteContentManifest(): Promise<void> {
  try {
    await del('content-manifest.json')
    console.log('Content manifest deleted successfully')
  } catch (error) {
    console.error('Failed to delete content manifest:', error)
    throw error
  }
}

export async function cleanupUnusedBlobs(): Promise<void> {
  try {
    const manifest = await fetchContentManifest()
    const { blobs } = await list()

    const usedUrls = new Set<string>()

    // Add manifest URL
    usedUrls.add('content-manifest.json')

    // Collect all URLs from the manifest
    for (const post of manifest.posts) {
      for (const image of post.images) {
        if (image.cdnUrl.includes('blob.vercel-storage.com')) {
          const pathname = new URL(image.cdnUrl).pathname
          const filename = pathname.split('/').pop()
          if (filename) {
            usedUrls.add(filename)
          }
        }
      }

      // Collect profile picture URLs from comments
      if (post.comments) {
        for (const comment of post.comments) {
          if (
            comment.author?.avatar &&
            comment.author.avatar.includes('blob.vercel-storage.com')
          ) {
            const pathname = new URL(comment.author.avatar).pathname
            const filename = pathname.split('/').pop()
            if (filename) {
              usedUrls.add(filename)
            }
          }
        }
      }
    }

    // Delete unused blobs
    const deletionPromises = []
    for (const blob of blobs) {
      if (!usedUrls.has(blob.pathname)) {
        console.log(`Deleting unused blob: ${blob.pathname}`)
        deletionPromises.push(del(blob.url))
      }
    }

    await Promise.all(deletionPromises)
    console.log(
      `Cleanup completed. Deleted ${deletionPromises.length} unused blobs.`
    )
  } catch (error) {
    console.error('Failed to cleanup unused blobs:', error)
    throw error
  }
}
