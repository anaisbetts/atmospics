import { BlueskyFeedBuilder } from '../bluesky'

describe('BlueskyFeedBuilder', () => {
  it('should fetch posts from BSKY_TARGET', async () => {
    if (process.env.CI) {
      console.warn('Skipping remote tests in CI environment')
      return
    }

    const target = process.env.BSKY_TARGET
    expect(target).toBeDefined()

    const feedBuilder = new BlueskyFeedBuilder(target!)
    const manifest = await feedBuilder.extractPosts()

    expect(manifest).toHaveProperty('createdAt')
    expect(manifest).toHaveProperty('hash')
    expect(manifest).toHaveProperty('posts')
    expect(Array.isArray(manifest.posts)).toBe(true)
    expect(manifest.posts.length).toBeGreaterThanOrEqual(0)

    if (manifest.posts.length > 0) {
      const post = manifest.posts[0]
      expect(post).toHaveProperty('text')
      expect(post).toHaveProperty('images')
      expect(post).toHaveProperty('createdAt')
      expect(Array.isArray(post.images)).toBe(true)
    }
  }, 30000)
})
