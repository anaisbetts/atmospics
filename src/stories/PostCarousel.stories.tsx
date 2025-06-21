import type { Meta, StoryObj } from '@storybook/react'
import { PostCarousel } from '../components/post-carousel'
import { ImageContent } from '../lib/types'

const meta: Meta<typeof PostCarousel> = {
  title: 'Components/PostCarousel',
  component: PostCarousel,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: '400px',
          height: '500px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

const sampleImages: ImageContent[] = [
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-1.jpg',
    altText: 'Sample landscape photo',
    width: 800,
    height: 600,
  },
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-2.png',
    altText: 'Sample portrait photo',
    width: 600,
    height: 800,
  },
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-3.webp',
    altText: 'Sample square photo',
    width: 800,
    height: 800,
  },
]

const singleImage: ImageContent[] = [
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-1.jpg',
    altText: 'Single sample photo',
    width: 800,
    height: 600,
  },
]

const mixedMediaContent: ImageContent[] = [
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-1.jpg',
    altText: 'Sample photo',
    width: 800,
    height: 600,
  },
  {
    type: 'video',
    cdnUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    altText: 'Sample video',
    width: 1280,
    height: 720,
  },
  {
    type: 'image',
    cdnUrl: '/src/stories/assets/sample-2.png',
    altText: 'Another sample photo',
    width: 600,
    height: 800,
  },
]

export const Default: Story = {
  args: {
    images: sampleImages,
  },
}

export const SingleImage: Story = {
  args: {
    images: singleImage,
  },
}

export const MultipleImages: Story = {
  args: {
    images: sampleImages,
  },
}

export const MixedMedia: Story = {
  args: {
    images: mixedMediaContent,
  },
}

export const TwoImages: Story = {
  args: {
    images: sampleImages.slice(0, 2),
  },
}

export const Empty: Story = {
  args: {
    images: [],
  },
}

export const WithCustomClassName: Story = {
  args: {
    images: sampleImages,
    className: 'border-4 border-blue-500 rounded-lg',
  },
}

export const LargeCarousel: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          width: '800px',
          height: '600px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    images: sampleImages,
  },
}

export const SmallCarousel: Story = {
  decorators: [
    (Story) => (
      <div
        style={{
          width: '200px',
          height: '250px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    images: sampleImages.slice(0, 2),
  },
}
