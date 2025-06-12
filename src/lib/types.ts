import { DateTime } from "luxon";

export interface ImageContent {
  type: "video" | "image";
  cdnUrl: string;
}

export interface Post {
  images: ImageContent[];
  text: string;
  createdAt: string;
}

export interface FeedBuilder {
  extractPosts(since?: DateTime): Promise<Post[]>;
}
