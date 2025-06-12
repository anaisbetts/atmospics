import AtpAgent from "@atproto/api";
import { unstable_cache } from 'next/cache';

interface Post {
  text: string;
  createdAt: string;
  uri: string;
}

async function createAuthenticatedAgent() {
  const bskyUser = process.env.BSKY_USER;
  const bskyPass = process.env.BSKY_PASS;

  if (!bskyUser || !bskyPass) {
    throw new Error("BSKY_USER and BSKY_PASS environment variables are required");
  }

  const agent = new AtpAgent({
    service: "https://bsky.social",
  });

  await agent.login({
    identifier: bskyUser,
    password: bskyPass,
  });

  return agent;
}

async function fetchPostsWithAgent(agent: AtpAgent, targetHandle: string): Promise<Post[]> {
  // First, resolve target's profile to get their DID
  const profileResponse = await agent.getProfile({
    actor: targetHandle,
  });

  if (!profileResponse.success) {
    throw new Error(`Could not find ${targetHandle} profile`);
  }

  const targetDid = profileResponse.data.did;

  // Fetch target's posts
  const postsResponse = await agent.getAuthorFeed({
    actor: targetDid,
    limit: 20,
  });

  if (!postsResponse.success) {
    throw new Error("Failed to fetch posts");
  }

  // Extract post content
  const posts = postsResponse.data.feed.map((item) => ({
    text:
      (item.post.record as Record<string, string>)?.text || "No text content",
    createdAt:
      (item.post.record as Record<string, string>)?.createdAt ||
      item.post.indexedAt,
    uri: item.post.uri,
  }));

  return posts;
}

const getCachedPosts = unstable_cache(
  async (targetHandle: string) => {
    const agent = await createAuthenticatedAgent();
    return await fetchPostsWithAgent(agent, targetHandle);
  },
  ['bluesky-posts'],
  {
    revalidate: 5 * 60, // 5 minutes
    tags: ['bluesky-posts']
  }
);

async function fetchImagesPosts(): Promise<Post[]> {
  const bskyTarget = process.env.BSKY_TARGET || "dril.bsky.social";
  return await getCachedPosts(bskyTarget);
}

export default async function ImagesPosts() {
  const posts = await fetchImagesPosts();

  return (
    <>
      {posts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No posts found</div>
      ) : (
        <ul className="space-y-4">
          {posts.map((post, index) => (
            <li
              key={post.uri || index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="text-gray-900 whitespace-pre-wrap">
                {post.text}
              </div>
              <div className="text-sm text-gray-500 mt-3">
                {new Date(post.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
