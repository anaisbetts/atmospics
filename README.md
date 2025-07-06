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
