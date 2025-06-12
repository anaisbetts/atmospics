import { BlueskyFeedBuilder } from '../bluesky'

describe('BlueskyFeedBuilder', () => {
  it('should fetch posts from BSKY_TARGET', async () => {
    const target = process.env.BSKY_TARGET
    expect(target).toBeDefined()

    const feedBuilder = new BlueskyFeedBuilder(target!)
    const posts = await feedBuilder.extractPosts()

    expect(Array.isArray(posts)).toBe(true)
    expect(posts.length).toBeGreaterThanOrEqual(0)

    if (posts.length > 0) {
      const post = posts[0]
      expect(post).toHaveProperty('text')
      expect(post).toHaveProperty('images')
      expect(post).toHaveProperty('createdAt')
      expect(Array.isArray(post.images)).toBe(true)
    }
  }, 30000)
})
