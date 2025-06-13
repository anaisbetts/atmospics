import type { Meta, StoryObj } from '@storybook/react'
import ImageGrid from '../components/image-grid'
import { ContentManifest } from '../lib/types'

const meta: Meta<typeof ImageGrid> = {
  title: 'Components/ImageGrid',
  component: ImageGrid,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '100vw',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '20px',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const sampleManifest: ContentManifest = {
  createdAt: '2025-06-13T00:00:00Z',
  hash: 'sample-hash',
  posts: [
    {
      id: '1',
      text: 'Sample post with single image',
      createdAt: '2025-06-13T00:00:00Z',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-1.jpg',
          altText: 'Sample image 1',
          width: 800,
          height: 600,
        },
      ],
    },
    {
      id: '2',
      text: 'Sample post with multiple images',
      createdAt: '2025-06-13T01:00:00Z',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-2.png',
          altText: 'Sample image 2',
          width: 800,
          height: 600,
        },
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-3.webp',
          altText: 'Sample image 3',
          width: 800,
          height: 600,
        },
      ],
    },
    {
      id: '3',
      text: 'Another single image post',
      createdAt: '2025-06-13T02:00:00Z',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-3.webp',
          altText: 'Sample image 4',
          width: 800,
          height: 600,
        },
      ],
    },
  ],
}

const emptyManifest: ContentManifest = {
  createdAt: '2025-06-13T00:00:00Z',
  hash: 'empty-hash',
  posts: [],
}

const manifestWithoutImages: ContentManifest = {
  createdAt: '2025-06-13T00:00:00Z',
  hash: 'no-images-hash',
  posts: [
    {
      id: '1',
      text: 'Post without images',
      createdAt: '2025-06-13T00:00:00Z',
      images: [],
    },
  ],
}

export const Default: Story = {
  args: {
    manifest: sampleManifest,
  },
}

export const Empty: Story = {
  args: {
    manifest: emptyManifest,
  },
}

export const NoImages: Story = {
  args: {
    manifest: manifestWithoutImages,
  },
}

export const SingleImage: Story = {
  args: {
    manifest: {
      ...sampleManifest,
      posts: [sampleManifest.posts[0]], // Only first post
    },
  },
}
