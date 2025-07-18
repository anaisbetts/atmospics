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
import { createMuxClient, fixUnicodeDoubleEncoding } from '../src/lib/utils'

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

async function uploadVideoToMux(videoBuffer: Buffer): Promise<{
  playbackId: string
  width: number
  height: number
  thumbnailUrl: string
}> {
  const mux = await createMuxClient()

  // First upload video to a temporary blob for Mux to access
  const tempFilename = `temp-${crypto.randomUUID()}.mp4`
  const { url: tempUrl } = await put(tempFilename, videoBuffer, {
    access: 'public',
    contentType: 'video/mp4',
  })

  try {
    // Create Mux asset from temp URL
    const asset = await mux.video.assets.create({
      inputs: [{ url: tempUrl }],
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
        const videoTrack = tracks?.find(
          (track) => track.type === 'video'
        ) as any
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
  } finally {
    // Clean up temporary file (optional - Vercel Blob will handle cleanup)
    // We could delete the temp file here, but it's not critical
  }
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
    // NB: Instagram double-encodes emoji and sends back garbage data,
    // fix it for them
    const text = fixUnicodeDoubleEncoding(firstMedia.title || '')

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
    let muxData: {
      playbackId: string
      width: number
      height: number
      thumbnailUrl: string
    } | null = null

    if (isVideo) {
      // For videos, process through Mux
      buffer = await fs.readFile(mediaPath)

      try {
        console.log(
          `  🎬 Processing video through Mux: ${path.basename(mediaPath)}`
        )
        muxData = await uploadVideoToMux(buffer)
        console.log(
          `  ✅ Mux processing complete for ${path.basename(mediaPath)}`
        )
      } catch (error) {
        console.warn(
          `  ⚠️ Mux processing failed for ${path.basename(mediaPath)}, uploading raw video:`,
          error
        )
        // Fall back to raw video upload
      }

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

    // Get dimensions
    let width = 0
    let height = 0
    let cdnUrl: string
    let thumbnail: string | undefined

    if (isVideo && muxData) {
      // Use Mux data for processed videos
      width = muxData.width
      height = muxData.height
      thumbnail = muxData.thumbnailUrl
      cdnUrl = `https://stream.mux.com/${muxData.playbackId}.m3u8`
    } else if (isVideo) {
      // Fall back to raw video upload for failed Mux processing
      const filename = `${crypto.randomUUID()}${finalExtension}`
      const { url } = await put(filename, buffer, {
        access: 'public',
        contentType,
      })
      cdnUrl = url
    } else {
      // Handle images
      try {
        const metadata = await sharp(buffer).metadata()
        width = metadata.width || 0
        height = metadata.height || 0
      } catch (error) {
        console.warn('Could not get image dimensions:', error)
      }

      // Generate filename and upload to Vercel Blob
      const filename = `${crypto.randomUUID()}${finalExtension}`
      const { url } = await put(filename, buffer, {
        access: 'public',
        contentType,
      })
      cdnUrl = url
    }

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

    console.log(`  ✅ Uploaded ${path.basename(mediaPath)} to ${cdnUrl}`)

    return {
      type: isVideo ? 'video' : 'image',
      cdnUrl,
      altText: media.title || '',
      width,
      height,
      geolocation,
      thumbnail,
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
