import { loadImageCache } from '@/lib/image-cache'
import { loadFullContentManifest } from '@/lib/uploader'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

interface PostPageProps {
  params: { id: string }
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const manifest = await loadFullContentManifest()
  const post = manifest.posts.find((p) => p.id === params.id)

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    }
  }

  const firstImage = post.images[0]
  const imageUrl = firstImage?.cdnUrl
  const isVideo = firstImage?.type === 'video'
  const thumbnail = isVideo ? firstImage?.thumbnail : imageUrl

  return {
    title: post.text
      ? `${post.text.slice(0, 60)}${post.text.length > 60 ? '...' : ''}`
      : 'BlueSky Post',
    description: post.text || 'View this post on BlueSky',
    openGraph: {
      title: post.text
        ? `${post.text.slice(0, 60)}${post.text.length > 60 ? '...' : ''}`
        : 'BlueSky Post',
      description: post.text || 'View this post on BlueSky',
      images: thumbnail
        ? [
            {
              url: thumbnail,
              width: firstImage?.width || 800,
              height: firstImage?.height || 600,
              alt: firstImage?.altText || post.text || 'BlueSky post image',
            },
          ]
        : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: post.text
        ? `${post.text.slice(0, 60)}${post.text.length > 60 ? '...' : ''}`
        : 'BlueSky Post',
      description: post.text || 'View this post on BlueSky',
      images: thumbnail ? [thumbnail] : [],
    },
  }
}

export default async function PostPage({ params }: PostPageProps) {
  // Redirect to home with hash for client-side modal
  redirect(`/#post-${params.id}`)
}
