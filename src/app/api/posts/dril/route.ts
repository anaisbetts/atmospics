import AtpAgent, { AtpSessionData } from "@atproto/api";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Cache for storing the posts with timestamp
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPosts: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cachedPosts && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({ posts: cachedPosts });
    }

    // Get session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("bsky-session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value) as AtpSessionData;

    // Initialize BlueSky agent with session
    const agent = new AtpAgent({
      service: "https://bsky.social",
    });

    // Resume session
    await agent.resumeSession(session);

    // First, resolve dril's profile to get their DID
    const profileResponse = await agent.getProfile({
      actor: "dril.bsky.social",
    });

    if (!profileResponse.success) {
      return NextResponse.json(
        { error: "Could not find dril.bsky.social profile" },
        { status: 404 }
      );
    }

    const drilDid = profileResponse.data.did;

    // Fetch dril's posts
    const postsResponse = await agent.getAuthorFeed({
      actor: drilDid,
      limit: 20,
    });

    if (!postsResponse.success) {
      return NextResponse.json(
        { error: "Failed to fetch posts" },
        { status: 500 }
      );
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

    // Update cache
    cachedPosts = posts;
    lastFetchTime = now;

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching dril posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
