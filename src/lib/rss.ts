import { toXML } from 'jstoxml'
import { DateTime } from 'luxon'
import { ContentManifest, Post } from './types'
import { fixUnicodeDoubleEncoding } from './utils'

export interface RSSConfig {
  title: string
  description: string
  link: string
  language?: string
  copyright?: string
  managingEditor?: string
  webMaster?: string
  pubDate?: string
  lastBuildDate?: string
  image?: {
    url: string
    title: string
    link: string
    width?: number
    height?: number
  }
}

export function generateRSSFeed(
  manifest: ContentManifest,
  config: RSSConfig
): string {
  const now = DateTime.now().toRFC2822()
  const lastBuildDate = config.lastBuildDate || now
  const pubDate = config.pubDate || now

  const items = manifest.posts
    .slice(0, 50) // Limit to 50 most recent posts
    .map((post) => generateRSSItem(post, config.link))

  const rssData = {
    _name: 'rss',
    _attrs: {
      version: '2.0',
      'xmlns:content': 'http://purl.org/rss/1.0/modules/content/',
      'xmlns:media': 'http://search.yahoo.com/mrss/',
    },
    _content: {
      channel: [
        { title: config.title },
        { description: config.description },
        { link: config.link },
        { language: config.language || 'en-US' },
        { pubDate },
        { lastBuildDate },
        { generator: 'Atmospics RSS Generator' },
        ...(config.copyright ? [{ copyright: config.copyright }] : []),
        ...(config.managingEditor
          ? [{ managingEditor: config.managingEditor }]
          : []),
        ...(config.webMaster ? [{ webMaster: config.webMaster }] : []),
        ...(config.image ? [generateRSSImage(config.image)] : []),
        ...items,
      ],
    },
  }

  return toXML(rssData, {
    header: true,
    indent: '  ',
  })
}

function generateRSSItem(post: Post, baseUrl: string): any {
  const pubDate = DateTime.fromISO(post.createdAt).toRFC2822()
  const postUrl = `${baseUrl}/post/${post.id}`
  const guid = postUrl

  // Generate HTML content with images
  const htmlContent = generateHTMLContent(post)

  // Generate media enclosures for images
  const mediaEnclosures = post.images
    .filter((img) => img.type === 'image')
    .map((img) => ({
      _name: 'enclosure',
      _attrs: {
        url: img.cdnUrl,
        type: 'image/jpeg',
        length: '0',
      },
    }))

  // Generate media:content elements for better image support
  const mediaContent = post.images.map((img) => {
    const mediaType = img.type === 'video' ? 'video' : 'image'
    const mediaContentItem: any = {
      _name: 'media:content',
      _attrs: {
        url: img.cdnUrl,
        type: `${mediaType}/jpeg`,
        width: img.width.toString(),
        height: img.height.toString(),
      },
    }

    if (img.altText) {
      mediaContentItem._content = {
        'media:description': fixUnicodeDoubleEncoding(img.altText),
      }
    }

    return mediaContentItem
  })

  const itemData: any = {
    item: [
      {
        title: post.text
          ? truncateText(fixUnicodeDoubleEncoding(post.text), 100)
          : 'Image post',
      },
      { link: postUrl },
      {
        _name: 'guid',
        _attrs: { isPermaLink: 'true' },
        _content: guid,
      },
      { pubDate },
      {
        description: post.text
          ? fixUnicodeDoubleEncoding(post.text)
          : 'Image post',
      },
      {
        _name: 'content:encoded',
        _content: htmlContent,
      },
      ...(post.author
        ? [
            {
              author: `noreply@photos.anais.dev (${fixUnicodeDoubleEncoding(post.author.displayName)})`,
            },
          ]
        : []),
      ...mediaEnclosures,
      ...mediaContent,
    ],
  }

  return itemData
}

function generateHTMLContent(post: Post): string {
  let html = ''

  // Add post text
  if (post.text) {
    html += `<p>${escapeHTML(fixUnicodeDoubleEncoding(post.text))}</p>`
  }

  // Add images
  if (post.images.length > 0) {
    html += '<div>'
    for (const image of post.images) {
      if (image.type === 'image') {
        html += `<img src="${escapeHTML(image.cdnUrl)}" alt="${escapeHTML(fixUnicodeDoubleEncoding(image.altText))}" width="${image.width}" height="${image.height}" style="max-width: 100%; height: auto; margin: 5px;" />`
      } else if (image.type === 'video') {
        html += `<video controls width="${image.width}" height="${image.height}" style="max-width: 100%; height: auto; margin: 5px;">
          <source src="${escapeHTML(image.cdnUrl)}" type="video/mp4">
          ${image.thumbnail ? `<img src="${escapeHTML(image.thumbnail)}" alt="${escapeHTML(fixUnicodeDoubleEncoding(image.altText))}" />` : ''}
        </video>`
      }
    }
    html += '</div>'
  }

  // Add author information
  if (post.author) {
    html += `<p><small>By ${escapeHTML(fixUnicodeDoubleEncoding(post.author.displayName))} (@${escapeHTML(fixUnicodeDoubleEncoding(post.author.username))})</small></p>`
  }

  // Add link to original content
  if (post.originalContentLink) {
    html += `<p><a href="${escapeHTML(post.originalContentLink)}">View original post</a></p>`
  }

  return html
}

function generateRSSImage(image: RSSConfig['image']): any {
  if (!image) return null

  const imageData: any = {
    image: [{ url: image.url }, { title: image.title }, { link: image.link }],
  }

  if (image.width) {
    imageData.image.push({ width: image.width.toString() })
  }
  if (image.height) {
    imageData.image.push({ height: image.height.toString() })
  }

  return imageData
}

// Keep this function only for HTML content within CDATA sections
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}
