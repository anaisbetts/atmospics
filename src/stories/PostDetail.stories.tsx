import type { Meta, StoryObj } from '@storybook/react'
import PostDetail from '../components/post-detail'
import { Post } from '../lib/types'

const meta: Meta<typeof PostDetail> = {
  title: 'Components/PostDetail',
  component: PostDetail,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-100 p-8">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    onLike: () => console.log('Post liked'),
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Sample post data
const baseSamplePost: Post = {
  id: '1',
  text: 'Sometimes dressing up is nice',
  createdAt: '2024-12-12T10:30:00Z',
  likeCount: 39,
  hash: 'sample-hash-1',
  images: [
    {
      type: 'image',
      cdnUrl: '/src/stories/assets/sample-1.jpg',
      altText: 'Woman in black dress taking selfie',
      width: 1080,
      height: 1080,
    },
  ],
  comments: [
    {
      username: 'anizocani',
      text: 'Sometimes dressing up is nice',
      profilePicture: '/profile-1.jpg',
      createdAt: '2024-12-12T10:30:00Z',
      hash: 'comment-hash-1',
    },
    {
      username: 'quencodemonkey',
      text: '🔥🔥🔥🔥🔥🔥🔥🔥🤩',
      profilePicture: '/profile-2.jpg',
      createdAt: '2024-12-12T11:15:00Z',
      hash: 'comment-hash-2',
    },
    {
      username: 'kcwatkins',
      text: '🔥🔥🔥🔥🔥🔥',
      profilePicture: '/profile-1.jpg',
      createdAt: '2024-12-12T11:45:00Z',
      hash: 'comment-hash-3',
    },
    {
      username: 'aphrobitey',
      text: '🔥🔥🔥 Looking good!',
      profilePicture: '/profile-2.jpg',
      createdAt: '2024-12-12T12:00:00Z',
      hash: 'comment-hash-4',
    },
  ],
}

export const Default: Story = {
  args: {
    post: baseSamplePost,
  },
}

export const MultipleImages: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '2',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-1.jpg',
          altText: 'Woman in black dress taking selfie',
          width: 1080,
          height: 1080,
        },
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-2.png',
          altText: 'Sample image 2',
          width: 1080,
          height: 1080,
        },
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-3.webp',
          altText: 'Sample image 3',
          width: 1080,
          height: 1080,
        },
      ],
    },
  },
}

export const WithLongText: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '3',
      text: "Today was such an amazing day! I spent the morning exploring the city, found this incredible café with the most amazing coffee, and then had lunch with some friends. The weather was perfect, and I felt so grateful for all the beautiful moments throughout the day. Sometimes it's the simple things that make life so wonderful.",
      comments: [
        ...baseSamplePost.comments!,
        {
          username: 'sarah_j',
          text: "This sounds like such a perfect day! That café sounds amazing - you'll have to tell me where it is next time we catch up.",
          profilePicture: '/profile-1.jpg',
          createdAt: '2024-12-12T13:30:00Z',
          hash: 'comment-hash-5',
        },
      ],
    },
  },
}

export const NoComments: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '4',
      text: 'Just posted this and waiting for the first comment!',
      comments: [
        {
          username: 'anizocani',
          text: 'Just posted this and waiting for the first comment!',
          profilePicture: '/profile-1.jpg',
          createdAt: '2024-12-12T10:30:00Z',
          hash: 'comment-hash-author',
        },
      ],
      likeCount: 0,
    },
  },
}

export const HighLikes: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '5',
      likeCount: 1247,
      comments: [
        ...baseSamplePost.comments!,
        {
          username: 'alex_photo',
          text: 'Absolutely stunning! The lighting in this photo is incredible.',
          profilePicture: '/profile-2.jpg',
          createdAt: '2024-12-12T14:00:00Z',
          hash: 'comment-hash-6',
        },
        {
          username: 'emma_styles',
          text: "Where did you get that dress? It's gorgeous! 😍",
          profilePicture: '/profile-1.jpg',
          createdAt: '2024-12-12T14:15:00Z',
          hash: 'comment-hash-7',
        },
      ],
    },
  },
}

export const MixedMedia: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '6',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-1.jpg',
          altText: 'Sample photo',
          width: 800,
          height: 600,
        },
        {
          type: 'video',
          cdnUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
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
      ],
    },
  },
}

export const TwoImages: Story = {
  args: {
    post: {
      ...baseSamplePost,
      id: '7',
      images: [
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-1.jpg',
          altText: 'First image',
          width: 800,
          height: 600,
        },
        {
          type: 'image',
          cdnUrl: '/src/stories/assets/sample-2.png',
          altText: 'Second image',
          width: 600,
          height: 800,
        },
      ],
    },
  },
}
