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
      expect(post).toHaveProperty('id')
      expect(post).toHaveProperty('text')
      expect(post).toHaveProperty('images')
      expect(post).toHaveProperty('createdAt')
      expect(post).toHaveProperty('originalContentLink')
      expect(post).toHaveProperty('likeCount')
      expect(post).toHaveProperty('comments')
      expect(Array.isArray(post.images)).toBe(true)
      expect(Array.isArray(post.comments)).toBe(true)
      expect(typeof post.likeCount).toBe('number')
      expect(typeof post.originalContentLink).toBe('string')
      expect(post.originalContentLink).toMatch(
        /^https:\/\/bsky\.app\/profile\//
      )

      // Check that at least one post has comments
      const postsWithComments = manifest.posts.filter(
        (p) => p.comments && p.comments.length > 0
      )
      expect(postsWithComments.length).toBeGreaterThan(0)

      // If we found a post with comments, validate comment structure
      if (postsWithComments.length > 0) {
        const postWithComments = postsWithComments[0]
        const comment = postWithComments.comments![0]
        expect(comment).toHaveProperty('username')
        expect(comment).toHaveProperty('text')
        expect(comment).toHaveProperty('profilePicture')
        expect(comment).toHaveProperty('originalContentLink')
        expect(comment).toHaveProperty('createdAt')
        expect(typeof comment.username).toBe('string')
        expect(typeof comment.text).toBe('string')
        expect(typeof comment.profilePicture).toBe('string')
        expect(typeof comment.originalContentLink).toBe('string')
        expect(typeof comment.createdAt).toBe('string')
        expect(comment.originalContentLink).toMatch(
          /^https:\/\/bsky\.app\/profile\//
        )
      }
    }
  }, 30000)
})
