import { NextResponse } from 'next/server'
import { loadImageCache } from '../../../lib/image-cache'
import { fetchContentManifest } from '../../../lib/uploader'
import { resolveImageUrl } from '../../../lib/utils'

export async function GET() {
  try {
    const [manifest, imageCache] = await Promise.all([
      fetchContentManifest(),
      loadImageCache(),
    ])

    const photos = manifest.posts
      .filter((post) => post.images.length > 0)
      .map((post) => ({
        id: post.id,
        text: post.text,
        createdAt: post.createdAt,
        originalContentLink: post.originalContentLink,
        likeCount: post.likeCount,
        hash: post.hash,
        author: post.author
          ? {
              username: post.author.username,
              displayName: post.author.displayName,
              avatar: resolveImageUrl(post.author.avatar, imageCache),
            }
          : undefined,
        images: post.images.map((image) => ({
          type: image.type,
          url: resolveImageUrl(image.cdnUrl, imageCache),
          altText: image.altText,
          width: image.width,
          height: image.height,
          geolocation: image.geolocation,
          thumbnail: image.thumbnail
            ? resolveImageUrl(image.thumbnail, imageCache)
            : undefined,
        })),
        comments: post.comments?.map((comment) => ({
          author: {
            username: comment.author.username,
            displayName: comment.author.displayName,
            avatar: resolveImageUrl(comment.author.avatar, imageCache),
          },
          text: comment.text,
          originalContentLink: comment.originalContentLink,
          createdAt: comment.createdAt,
          hash: comment.hash,
        })),
      }))

    return NextResponse.json(
      { photos },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}
