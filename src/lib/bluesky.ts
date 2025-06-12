import { FeedBuilder, Post } from "./types";

class BlueskyFeedBuilder implements FeedBuilder {
  extractPosts(): Promise<Post[]> {
    throw new Error("Method not implemented.");
  }
}
