import type { Meta, StoryObj } from '@storybook/react'
import Comment from '../components/comment'

const meta: Meta<typeof Comment> = {
  title: 'Components/Comment',
  component: Comment,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="mx-auto min-h-screen max-w-2xl bg-gray-50 p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
  args: {
    onLike: () => console.log('Like clicked'),
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    id: '1',
    author: {
      name: 'Sarah Johnson',
      username: 'sarahj',
      avatar: '/profile-1.jpg',
    },
    content:
      'This is a great post! Thanks for sharing your thoughts on this topic. I really appreciate the detailed explanation.',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    likes: 12,
    isLiked: false,
  },
}

export const Liked: Story = {
  args: {
    ...Default.args,
    id: '2',
    isLiked: true,
    likes: 15,
  },
}

export const NoAvatar: Story = {
  args: {
    ...Default.args,
    id: '3',
    author: {
      name: 'Michael Chen',
      username: 'mchen',
    },
    content:
      'Great discussion! I have been thinking about this exact issue lately.',
    likes: 3,
  },
}

export const LongContent: Story = {
  args: {
    ...Default.args,
    id: '4',
    author: {
      name: 'Emma Thompson',
      username: 'emmathompson',
      avatar: '/profile-2.jpg',
    },
    content: `This is a much longer comment that spans multiple lines and contains more detailed thoughts and opinions about the topic at hand.

I wanted to share my perspective on this because I think it's really important to consider all the different angles and viewpoints that people might have.

What do you all think about this approach? I'd love to hear your thoughts and feedback!`,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    likes: 8,
    isLiked: true,
  },
}

export const Recent: Story = {
  args: {
    ...Default.args,
    id: '5',
    author: {
      name: 'Alex Rivera',
      username: 'alexr',
      avatar: '/profile-1.jpg',
    },
    content: 'Just saw this and wanted to jump in with my thoughts!',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
    likes: 1,
  },
}

export const NoLikes: Story = {
  args: {
    ...Default.args,
    id: '6',
    author: {
      name: 'Taylor Swift',
      username: 'tswift',
    },
    content: 'First comment on this post!',
    createdAt: new Date().toISOString(), // Just now
    likes: 0,
  },
}
