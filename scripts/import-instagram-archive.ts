import crypto from 'crypto'
import path from 'path'
import { asyncMap } from '@anaisbetts/commands'
import { put } from '@vercel/blob'
import fs from 'fs/promises'
import { DateTime } from 'luxon'
import sharp from 'sharp'

import {
  ContentManifest,
  ImageContent,
  Post,
  generateHashForManifest,
  generateHashForPost,
} from '../src/lib/types'

interface InstagramPost {
  media: Array<{
    uri: string
    creation_timestamp: number
    title?: string
    media_metadata?: {
      photo_metadata?: {
        exif_data?: Array<{
          latitude?: number
          longitude?: number
        }>
      }
      video_metadata?: {
        exif_data?: Array<{
          latitude?: number
          longitude?: number
        }>
      }
    }
  }>
}

export default async function main(args: string[]): Promise<number> {
  if (args.length === 0) {
    console.error(
      'Usage: bun run scripts/import-instagram-archive.ts <archive-path>'
    )
    return 1
  }

  const archivePath = args[0]
  const postsPath = path.join(
    archivePath,
    'your_instagram_activity/media/posts_1.json'
  )

  try {
    // Check if posts file exists
    await fs.access(postsPath)
  } catch (error) {
    console.error(`Posts file not found at ${postsPath}`)
    return 1
  }

  try {
    console.log('Reading Instagram posts...')
    const postsData = await fs.readFile(postsPath, { encoding: 'utf8' })
    const instagramPosts: InstagramPost[] = JSON.parse(postsData)

    console.log(`Found ${instagramPosts.length} Instagram posts`)

    // Convert Instagram posts to our ContentManifest format
    const posts = await asyncMap(instagramPosts, async (igPost) => {
      console.log('Starting conversion for post:', igPost.media[0].uri)
      return await convertInstagramPost(igPost, archivePath)
    })

    // Filter out posts that failed to process
    const validPosts = Array.from(posts.values()).filter(
      (post) => post !== null
    ) as Post[]

    // Create ContentManifest
    const manifest: ContentManifest = {
      createdAt: DateTime.now().toISO(),
      hash: '',
      posts: validPosts,
    }

    manifest.hash = await generateHashForManifest(manifest)

    // Upload manifest to Vercel Blob
    console.log('Uploading manifest to Vercel Blob...')
    const manifestJson = JSON.stringify(manifest, null, 2)
    const manifestBlob = new Blob([manifestJson], {
      type: 'application/json; charset=utf-8',
    })

    const { url } = await put('archive-manifest.json', manifestBlob, {
      access: 'public',
      allowOverwrite: true,
    })

    console.log(
      `✅ Successfully uploaded archive manifest with ${validPosts.length} posts to ${url}`
    )
    return 0
  } catch (error) {
    console.error('Error processing Instagram archive:', error)
    return 1
  }
}

async function convertInstagramPost(
  igPost: InstagramPost,
  archivePath: string
): Promise<Post | null> {
  try {
    const firstMedia = igPost.media[0]
    if (!firstMedia) return null

    // Generate post ID from first media URI
    const postId = crypto.createHash('md5').update(firstMedia.uri).digest('hex')

    // Convert creation timestamp to ISO string
    const createdAt = DateTime.fromSeconds(
      firstMedia.creation_timestamp
    ).toISO()

    // Extract text from title
    const text = firstMedia.title || ''

    // Log any non-ASCII characters for debugging
    if (text && /[^\x00-\x7F]/.test(text)) {
      console.log(`  📝 Post contains Unicode text: "${text}"`)
    }

    // Process all media in the post
    const images = await asyncMap(igPost.media, async (media) => {
      return await processMediaFile(media, archivePath)
    })

    // Filter out failed media
    const validImages = Array.from(images.values()).filter(
      (img) => img !== null
    ) as ImageContent[]

    if (validImages.length === 0) {
      console.warn(`No valid media found for post ${postId}`)
      return null
    }

    const postData = {
      id: postId,
      images: validImages,
      text,
      createdAt,
      originalContentLink: undefined,
      likeCount: undefined,
      comments: undefined,
    }

    return await generateHashForPost(postData)
  } catch (error) {
    console.error('Error converting Instagram post:', error)
    return null
  }
}

async function processMediaFile(
  media: InstagramPost['media'][0],
  archivePath: string
): Promise<ImageContent | null> {
  try {
    const mediaPath = path.join(archivePath, media.uri)

    // Check if media file exists
    try {
      await fs.access(mediaPath)
    } catch (error) {
      console.warn(`Media file not found: ${mediaPath}`)
      return null
    }

    // Determine media type from extension
    const extension = path.extname(mediaPath).toLowerCase()
    const isVideo = ['.mp4', '.mov', '.avi', '.webm'].includes(extension)
    const isHEIC = extension === '.heic'

    let buffer: Buffer
    let contentType: string
    let finalExtension: string

    if (isVideo) {
      // For videos, upload as-is
      buffer = await fs.readFile(mediaPath)
      // Determine video content type from extension
      if (extension === '.mp4') {
        contentType = 'video/mp4'
      } else if (extension === '.mov') {
        contentType = 'video/quicktime'
      } else if (extension === '.avi') {
        contentType = 'video/x-msvideo'
      } else if (extension === '.webm') {
        contentType = 'video/webm'
      } else {
        contentType = 'video/mp4' // fallback
      }
      finalExtension = extension
    } else if (isHEIC) {
      // Convert HEIC to WebP
      const originalBuffer = await fs.readFile(mediaPath)
      buffer = await sharp(originalBuffer).webp({ quality: 85 }).toBuffer()
      contentType = 'image/webp'
      finalExtension = '.webp'
    } else {
      // For other images, upload as-is
      buffer = await fs.readFile(mediaPath)
      // Determine content type from extension
      if (extension === '.jpg' || extension === '.jpeg') {
        contentType = 'image/jpeg'
      } else if (extension === '.png') {
        contentType = 'image/png'
      } else if (extension === '.gif') {
        contentType = 'image/gif'
      } else if (extension === '.webp') {
        contentType = 'image/webp'
      } else {
        contentType = 'image/jpeg' // fallback
      }
      finalExtension = extension
    }

    // Get image dimensions
    let width = 0
    let height = 0

    if (!isVideo) {
      try {
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || 0
        height = metadata.height || 0
      } catch (error) {
        console.warn('Could not get image dimensions:', error)
      }
    }

    // Generate filename and upload to Vercel Blob
    const filename = `${crypto.randomUUID()}${finalExtension}`

    const { url } = await put(filename, buffer, {
      access: 'public',
      contentType,
    })

    // Extract geolocation if available
    let geolocation: number[] | undefined
    if (
      media.media_metadata?.photo_metadata?.exif_data ||
      media.media_metadata?.video_metadata?.exif_data
    ) {
      const exifData =
        media.media_metadata.photo_metadata?.exif_data ||
        media.media_metadata.video_metadata?.exif_data
      const locationData = exifData?.find(
        (data) => data.latitude && data.longitude
      )
      if (locationData?.latitude && locationData?.longitude) {
        geolocation = [locationData.latitude, locationData.longitude]
      }
    }

    console.log(`  ✅ Uploaded ${path.basename(mediaPath)} to ${url}`)

    return {
      type: isVideo ? 'video' : 'image',
      cdnUrl: url,
      altText: media.title || '',
      width,
      height,
      geolocation,
    }
  } catch (error) {
    console.error(`Error processing media file ${media.uri}:`, error)
    return null
  }
}

main(process.argv.slice(2))
  .then((exitCode) => {
    process.exit(exitCode)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
