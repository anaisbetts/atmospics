import { head, put } from '@vercel/blob'
import { createSHA256Hash, generateUUID } from './hash-utils'

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

  async serialize(): Promise<void> {
    const currentData: ImageCacheData = {
      hash: await this.generateHash(),
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
          currentData.hash = await this.generateHash()
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

  private async generateHash(): Promise<string> {
    const cacheEntries = Array.from(this.cache.entries()).sort()
    const dataToHash = JSON.stringify(cacheEntries)
    return createSHA256Hash(dataToHash)
  }

  async rehostContent(imageUrl: string): Promise<string> {
    // Check if already cached
    if (this.cache.has(imageUrl)) {
      return this.cache.get(imageUrl)!
    }

    // Skip if already on Vercel Blob
    if (imageUrl.includes('blob.vercel-storage.com')) {
      this.cache.set(imageUrl, imageUrl)
      return imageUrl
    }

    // Skip if it's a Mux URL (already hosted correctly)
    if (imageUrl.includes('stream.mux.com')) {
      this.cache.set(imageUrl, imageUrl)
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
      const filename = `${generateUUID()}${extension ? '.' + extension : ''}`

      console.log(`Rehosting image ${imageUrl} to ${filename}`)
      const { url } = await put(filename, blob, {
        access: 'public',
      })

      this.cache.set(imageUrl, url)
      console.log(`Rehosted image ${imageUrl} to ${url}`)

      return url
    } catch (error) {
      console.warn(`Failed to rehost image ${imageUrl}:`, error)
      // Cache the original URL to avoid repeated failures
      this.cache.set(imageUrl, imageUrl)
      return imageUrl
    }
  }

  getCachedUrl(originalUrl: string): string | undefined {
    return this.cache.get(originalUrl)
  }

  getCacheMap(): Map<string, string> {
    return new Map(this.cache)
  }

  getCacheSize(): number {
    return this.cache.size
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
}

export async function loadImageCache(): Promise<Map<string, string>> {
  const cache = new ImageCache()
  await cache.initialize()
  return cache.getCacheMap()
}
