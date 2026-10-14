import { NextResponse } from 'next/server'
import { loadGallery } from '../../../lib/gallery'
import { generateRSSFeed } from '../../../lib/rss'

export async function GET() {
  try {
    const { manifest } = await loadGallery()

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || 'https://atmospics.vercel.app'

    const rssConfig = {
      title: process.env.RSS_TITLE || 'Atmospics - Social Media Archive',
      description:
        process.env.RSS_DESCRIPTION ||
        'A curated collection of social media posts with images and content',
      link: baseUrl,
      language: 'en-US',
      copyright: `© ${new Date().getFullYear()} Atmospics`,
      managingEditor: process.env.RSS_MANAGING_EDITOR,
      webMaster: process.env.RSS_WEBMASTER,
      image: {
        url: `${baseUrl}/favicon.ico`,
        title: process.env.RSS_TITLE || 'Atmospics',
        link: baseUrl,
        width: 32,
        height: 32,
      },
    }

    const rssXml = generateRSSFeed(manifest, rssConfig)

    return new NextResponse(rssXml, {
      headers: {
        'Content-Type': 'application/rss+xml',
        'Cache-Control':
          'public, max-age=300, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error('Error generating RSS feed:', error)
    return NextResponse.json(
      { error: 'Failed to generate RSS feed' },
      { status: 500 }
    )
  }
}
