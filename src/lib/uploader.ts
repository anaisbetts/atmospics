import { asyncMap } from '@anaisbetts/commands'
import { del, head, list, put } from '@vercel/blob'
import { DateTime } from 'luxon'

import { BlueskyFeedBuilder } from './bluesky'
import { ContentManifest, Post, generateHashForManifest } from './types'

export async function loadFullContentManifest(): Promise<ContentManifest> {
  let manifest: ContentManifest | undefined
  let shouldSave = false

  try {
    manifest = await fetchContentManifest()
  } catch (error) {
    console.error(
      'Failed to fetch content manifest, starting from scratch:',
      error
    )
  }

  // Try to fetch and merge archive manifest
  try {
    const archiveManifest = await fetchArchiveManifest()
    if (archiveManifest) {
      console.log(
        `Found archive manifest with ${archiveManifest.posts.length} posts`
      )

      if (!manifest) {
        manifest = {
          createdAt: archiveManifest.createdAt,
          hash: '',
          posts: [],
        }
      }

      if (archiveManifest.posts.length > manifest.posts.length) {
        shouldSave = true
      }

      manifest = mergeManifests(manifest, archiveManifest)
      console.log(
        `Merged archive manifest, now have ${manifest.posts.length} total posts`
      )
    }
  } catch (error) {
    console.error('Failed to fetch or merge archive manifest:', error)
  }

  // Update content
  const feedBuilder = new BlueskyFeedBuilder(process.env.BSKY_TARGET!)
  const newPosts = await feedBuilder.extractPosts(
    manifest ? DateTime.fromISO(manifest.posts[0].createdAt) : undefined
  )

  if (!manifest) {
    manifest = {
      createdAt: newPosts.createdAt,
      hash: '',
      posts: [],
    }
  }

  if (newPosts.posts.length > 0) {
    shouldSave = true
    manifest = mergeManifests(manifest, newPosts)
  }

  manifest = await rehostContent(manifest)

  if (shouldSave) {
    await saveContentManifest(manifest)
  }

  return manifest
}

export async function rehostContent(
  manifest: ContentManifest
): Promise<ContentManifest> {
  const updatedPosts = await asyncMap(manifest.posts, async (post: Post) => {
    const updatedImages = []

    for (const image of post.images) {
      if (image.cdnUrl.includes('blob.vercel-storage.com')) {
        updatedImages.push(image)
        continue
      }
      try {
        const response = await fetch(image.cdnUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const blob = await response.blob()
        const contentType = response.headers.get('content-type') || blob.type
        const extension = getFileExtensionFromMimeType(contentType)
        const filename = `${crypto.randomUUID()}${extension ? '.' + extension : ''}`

        console.log(`Rehosting image ${image.cdnUrl} to ${filename}`)
        const { url } = await put(filename, blob, {
          access: 'public',
        })

        const newPost = {
          ...image,
          cdnUrl: url,
        }

        console.log(`Rehosted image ${image.cdnUrl} to ${newPost.cdnUrl}`)
        updatedImages.push(newPost)
      } catch (error) {
        // XXX: this sucks out loud, what to do here
        console.warn(`Failed to rehost image ${image.cdnUrl}:`, error)
        updatedImages.push(image)
      }
    }

    return {
      ...post,
      images: updatedImages,
    }
  })

  const newManifest = {
    createdAt: manifest.createdAt,
    hash: '',
    posts: Array.from(updatedPosts.values()),
  }

  newManifest.hash = generateHashForManifest(newManifest)
  return newManifest
}

export async function fetchContentManifest(): Promise<ContentManifest> {
  const info = await head('content-manifest.json')

  // Fetch without next.js caching
  const response = await fetch(info.url, {
    next: { revalidate: 0 },
  })

  return (await response.json()) as ContentManifest
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

    return (await response.json()) as ContentManifest
  } catch (error) {
    console.log('Archive manifest not found or failed to fetch')
    return null
  }
}

export async function saveContentManifest(
  manifest: ContentManifest
): Promise<void> {
  const filename = `content-manifest.json`
  const blob = new Blob([JSON.stringify(manifest, null, 2)], {
    type: 'application/json',
  })

  const { url } = await put(filename, blob, {
    access: 'public',
    allowOverwrite: true,
  })

  console.log(`Saved content manifest to ${url}`)
}

function mergeManifests(
  manifest: ContentManifest,
  newPosts: ContentManifest
): ContentManifest {
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

  mergedManifest.hash = generateHashForManifest(mergedManifest)
  return mergedManifest
}

function getFileExtensionFromMimeType(contentType: string): string {
  // Image formats
  if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) {
    return 'jpg'
  } else if (contentType.includes('image/png')) {
    return 'png'
  } else if (contentType.includes('image/gif')) {
    return 'gif'
  } else if (contentType.includes('image/webp')) {
    return 'webp'
  } else if (contentType.includes('image/svg')) {
    return 'svg'
  }
  // Video formats
  else if (contentType.includes('video/mp4')) {
    return 'mp4'
  } else if (contentType.includes('video/webm')) {
    return 'webm'
  } else if (contentType.includes('video/ogg')) {
    return 'ogv'
  } else if (contentType.includes('video/avi')) {
    return 'avi'
  } else if (
    contentType.includes('video/mov') ||
    contentType.includes('video/quicktime')
  ) {
    return 'mov'
  } else if (contentType.includes('video/wmv')) {
    return 'wmv'
  } else if (contentType.includes('video/flv')) {
    return 'flv'
  } else if (contentType.includes('video/mkv')) {
    return 'mkv'
  }

  return ''
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
