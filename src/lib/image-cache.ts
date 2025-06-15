import crypto from 'crypto'
import { head, put } from '@vercel/blob'

interface ImageCacheData {
  hash: string
  cache: Record<string, string>
}

export class ImageCache {
  private cache = new Map<string, string>()
  private originalHash = ''
  private readonly cacheFileName = 'image-cache.json'

  async initialize(): Promise<void> {
    try {
      await this.deserialize()
    } catch (error) {
      console.log('No existing image cache found, starting fresh')
    }
  }

  private async deserialize(): Promise<void> {
    const info = await head(this.cacheFileName)
    const response = await fetch(info.url, {
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch cache: ${response.statusText}`)
    }

    const data: ImageCacheData = await response.json()
    this.originalHash = data.hash
    this.cache = new Map(Object.entries(data.cache))
  }

  private async serialize(): Promise<void> {
    const currentData: ImageCacheData = {
      hash: this.generateHash(),
      cache: Object.fromEntries(this.cache),
    }

    // Check if we need to merge with remote changes
    try {
      const remoteInfo = await head(this.cacheFileName)
      const remoteResponse = await fetch(remoteInfo.url, {
        next: { revalidate: 0 },
      })

      if (remoteResponse.ok) {
        const remoteData: ImageCacheData = await remoteResponse.json()

        if (remoteData.hash !== this.originalHash) {
          // Remote cache has changed, merge it with our local changes
          const remoteCache = new Map(Object.entries(remoteData.cache))

          // Merge remote changes into our cache
          for (const [key, value] of remoteCache) {
            if (!this.cache.has(key)) {
              this.cache.set(key, value)
            }
          }

          // Regenerate data with merged cache
          currentData.cache = Object.fromEntries(this.cache)
          currentData.hash = this.generateHash()
        }
      }
    } catch (error) {
      // Remote cache doesn't exist or couldn't be fetched, proceed with upload
    }

    // Only upload if hash has changed
    if (currentData.hash === this.originalHash) {
      return
    }

    const blob = new Blob([JSON.stringify(currentData, null, 2)], {
      type: 'application/json',
    })

    await put(this.cacheFileName, blob, {
      access: 'public',
      allowOverwrite: true,
    })

    this.originalHash = currentData.hash
    console.log(`Updated image cache with ${this.cache.size} entries`)
  }

  private generateHash(): string {
    const cacheEntries = Array.from(this.cache.entries()).sort()
    const dataToHash = JSON.stringify(cacheEntries)
    return crypto.createHash('sha256').update(dataToHash).digest('hex')
  }

  private stripQueryParams(url: string): string {
    try {
      const urlObj = new URL(url)
      return `${urlObj.origin}${urlObj.pathname}`
    } catch {
      return url
    }
  }

  async rehostContent(imageUrl: string): Promise<string> {
    const cleanUrl = this.stripQueryParams(imageUrl)

    // Check if already cached
    if (this.cache.has(cleanUrl)) {
      return this.cache.get(cleanUrl)!
    }

    // Skip if already on Vercel Blob
    if (imageUrl.includes('blob.vercel-storage.com')) {
      this.cache.set(cleanUrl, imageUrl)
      await this.serialize()
      return imageUrl
    }

    try {
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || blob.type
      const extension = this.getFileExtensionFromMimeType(contentType)
      const filename = `${crypto.randomUUID()}${extension ? '.' + extension : ''}`

      console.log(`Rehosting image ${imageUrl} to ${filename}`)
      const { url } = await put(filename, blob, {
        access: 'public',
      })

      this.cache.set(cleanUrl, url)
      await this.serialize()

      console.log(`Rehosted image ${imageUrl} to ${url}`)
      return url
    } catch (error) {
      console.warn(`Failed to rehost image ${imageUrl}:`, error)
      // Cache the original URL to avoid repeated failures
      this.cache.set(cleanUrl, imageUrl)
      await this.serialize()
      return imageUrl
    }
  }

  private getFileExtensionFromMimeType(contentType: string): string {
    // Image formats
    if (
      contentType.includes('image/jpeg') ||
      contentType.includes('image/jpg')
    ) {
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

  getCachedUrl(originalUrl: string): string | undefined {
    const cleanUrl = this.stripQueryParams(originalUrl)
    return this.cache.get(cleanUrl)
  }

  getCacheSize(): number {
    return this.cache.size
  }
}
