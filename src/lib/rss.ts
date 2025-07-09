import { DateTime } from 'luxon'
import { ContentManifest, Post } from './types'

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
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXML(config.title)}</title>
    <description>${escapeXML(config.description)}</description>
    <link>${escapeXML(config.link)}</link>
    <language>${config.language || 'en-US'}</language>
    <pubDate>${pubDate}</pubDate>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <generator>Atmospics RSS Generator</generator>
    ${config.copyright ? `<copyright>${escapeXML(config.copyright)}</copyright>` : ''}
    ${config.managingEditor ? `<managingEditor>${escapeXML(config.managingEditor)}</managingEditor>` : ''}
    ${config.webMaster ? `<webMaster>${escapeXML(config.webMaster)}</webMaster>` : ''}
    ${config.image ? generateRSSImage(config.image) : ''}
    ${items}
  </channel>
</rss>`
}

function generateRSSItem(post: Post, baseUrl: string): string {
  const pubDate = DateTime.fromISO(post.createdAt).toRFC2822()
  const postUrl = `${baseUrl}/post/${post.id}`
  const guid = post.id

  // Generate HTML content with images
  const htmlContent = generateHTMLContent(post)

  // Generate media enclosures for images
  const mediaEnclosures = post.images
    .filter((img) => img.type === 'image')
    .map(
      (img) =>
        `<enclosure url="${escapeXML(img.cdnUrl)}" type="image/jpeg" length="0" />`
    )
    .join('\n    ')

  // Generate media:content elements for better image support
  const mediaContent = post.images
    .map((img) => {
      const mediaType = img.type === 'video' ? 'video' : 'image'
      return `<media:content url="${escapeXML(img.cdnUrl)}" type="${mediaType}/jpeg" width="${img.width}" height="${img.height}">
      ${img.altText ? `<media:description>${escapeXML(img.altText)}</media:description>` : ''}
    </media:content>`
    })
    .join('\n    ')

  return `    <item>
      <title>${escapeXML(post.text ? truncateText(post.text, 100) : 'Image post')}</title>
      <link>${escapeXML(postUrl)}</link>
      <guid isPermaLink="true">${escapeXML(guid)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXML(post.text || 'Image post')}</description>
      <content:encoded><![CDATA[${htmlContent}]]></content:encoded>
      ${post.author ? `<author>${escapeXML(post.author.username)} (${escapeXML(post.author.displayName)})</author>` : ''}
      ${mediaEnclosures}
      ${mediaContent}
    </item>`
}

function generateHTMLContent(post: Post): string {
  let html = ''

  // Add post text
  if (post.text) {
    html += `<p>${escapeHTML(post.text)}</p>`
  }

  // Add images
  if (post.images.length > 0) {
    html += '<div>'
    for (const image of post.images) {
      if (image.type === 'image') {
        html += `<img src="${escapeHTML(image.cdnUrl)}" alt="${escapeHTML(image.altText)}" width="${image.width}" height="${image.height}" style="max-width: 100%; height: auto; margin: 5px;" />`
      } else if (image.type === 'video') {
        html += `<video controls width="${image.width}" height="${image.height}" style="max-width: 100%; height: auto; margin: 5px;">
          <source src="${escapeHTML(image.cdnUrl)}" type="video/mp4">
          ${image.thumbnail ? `<img src="${escapeHTML(image.thumbnail)}" alt="${escapeHTML(image.altText)}" />` : ''}
        </video>`
      }
    }
    html += '</div>'
  }

  // Add author information
  if (post.author) {
    html += `<p><small>By ${escapeHTML(post.author.displayName)} (@${escapeHTML(post.author.username)})</small></p>`
  }

  // Add link to original content
  if (post.originalContentLink) {
    html += `<p><a href="${escapeHTML(post.originalContentLink)}">View original post</a></p>`
  }

  return html
}

function generateRSSImage(image: RSSConfig['image']): string {
  if (!image) return ''

  return `<image>
      <url>${escapeXML(image.url)}</url>
      <title>${escapeXML(image.title)}</title>
      <link>${escapeXML(image.link)}</link>
      ${image.width ? `<width>${image.width}</width>` : ''}
      ${image.height ? `<height>${image.height}</height>` : ''}
    </image>`
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

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
