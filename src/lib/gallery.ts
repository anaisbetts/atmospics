import { unstable_cache } from 'next/cache'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

import { loadImageCache } from './image-cache'
import { ContentManifest } from './types'
import { fetchContentManifest, loadFullContentManifest } from './uploader'

const GALLERY_REVALIDATE_SECONDS = 300
export const GALLERY_CACHE_TAG = 'gallery'

interface GalleryData {
  manifest: ContentManifest
  imageCache: Map<string, string>
}

export async function loadGallery(): Promise<GalleryData> {
  const { manifest, imageCache } = await getCachedGallery()
  return { manifest, imageCache: new Map(Object.entries(imageCache)) }
}

// unstable_cache round-trips results through JSON, so the image cache crosses
// the boundary as a plain object rather than a Map
const getCachedGallery = unstable_cache(
  async () => {
    // Build only reads; the Bluesky refresh and rehosting run at request time
    const manifest = isBuildPhase()
      ? await fetchContentManifest()
      : await loadFullContentManifest()
    const imageCache = await loadImageCache()
    return { manifest, imageCache: Object.fromEntries(imageCache) }
  },
  ['gallery'],
  { revalidate: GALLERY_REVALIDATE_SECONDS, tags: [GALLERY_CACHE_TAG] }
)

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD
}
