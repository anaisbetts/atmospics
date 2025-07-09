# Atmospics

A Next.js application that extracts, caches, and displays content from Bluesky with image rehosting and archival capabilities. The goal is to provide a viable alternative to Instagram that people can actually use for sharing and viewing photos and content.

For most people who don't get much traffic, you can most likely run this on Vercel's free tier without any costs at all, and if you do get traffic, the app is designed to try to save $$ as much as possible

## Setup

1. **Vercel Integrations**: Set up both Vercel Blob Storage and Mux integration in your Vercel dashboard
   - Mux provides $20/month in free credits when set up via Vercel billing integration, which covers basic usage
2. **Environment Variables**: Pull environment variables from Vercel:

   ```bash
   vercel env pull
   ```

3. **Required Environment Variables**:
   - `BSKY_USER` and `BSKY_PASS`: Bluesky authentication credentials
   - `BSKY_TARGET`: Target Bluesky handle to extract content from

## Development

Start the development server with Turbopack:

```bash
bun dev
```

## Other Commands

- **Build**: `bun next-build` (includes TypeScript type checking)
- **Format & Lint**: `bun f` (auto-formats and fixes linting issues)
- **Test**: `bun run test` (auto-formats and fixes linting issues)
- **Storybook**: `bun storybook` (component documentation and development)
- **Code validity check**: `bun f && bun next-build`

## Instagram Importer

To import Instagram content, use:

```bash
bun run scripts/import-instagram-archive.ts ./path/to/instagram/archive
```

## Architecture

The application uses a content manifest system that aggregates social media posts with metadata, images, and comments. Content flows through extraction, image caching, content management, and display stages, with SHA-256 hashing for efficient change detection and merging.

## Environment Variables

### Required Variables

These environment variables must be configured for the application to function:

- **`BSKY_USER`**: Bluesky username/identifier for authentication
- **`BSKY_PASS`**: Bluesky password for authentication
- **`BSKY_TARGET`**: Target Bluesky handle to extract content from (e.g., `@username.bsky.social`)

### Optional Variables (RSS Feed Configuration)

These variables customize the RSS feed output and have sensible defaults:

- **`NEXT_PUBLIC_BASE_URL`**: Base URL for the application (defaults to `https://atmospics.vercel.app`)
- **`RSS_TITLE`**: RSS feed title (defaults to `Atmospics - Social Media Archive`)
- **`RSS_DESCRIPTION`**: RSS feed description (defaults to `A curated collection of social media posts with images and content`)
- **`RSS_MANAGING_EDITOR`**: RSS feed managing editor email (optional)
- **`RSS_WEBMASTER`**: RSS feed webmaster email (optional)

### Platform Variables

These are automatically configured by Vercel when using their integrations:

- **Vercel Blob Storage**: Configured automatically through Vercel's platform
- **Mux Integration**: Video processing tokens (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`) are set up automatically when using Vercel's Mux integration

### Development/Testing

- **`CI`**: Detected automatically in CI environments to skip remote API tests

### RSS Feed Access

Once configured, users can subscribe to the RSS feed at `/api/rss` to receive updates with images when new posts are added.
