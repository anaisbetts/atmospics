import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import ImageDialog from '../components/image-dialog'

const meta: Meta<typeof ImageDialog> = {
  title: 'Components/ImageDialog',
  component: ImageDialog,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Story wrapper to handle dialog state
const DialogWrapper = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="p-8">
      <button
        onClick={() => setIsOpen(true)}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        Open Dialog
      </button>
      <ImageDialog isOpen={isOpen} onClose={() => setIsOpen(false)}>
        {children}
      </ImageDialog>
    </div>
  )
}

export const WithImage: Story = {
  render: () => (
    <DialogWrapper>
      <img
        src="/src/stories/assets/sample-1.jpg"
        alt="Sample content"
        className="h-full max-h-full w-full max-w-full object-contain"
      />
    </DialogWrapper>
  ),
}

export const WithCustomContent: Story = {
  render: () => (
    <DialogWrapper>
      <div className="flex h-full items-center justify-center rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mb-4 font-bold text-2xl">Custom Dialog Content</h2>
          <p className="mb-6 text-gray-600">
            This dialog can contain any React content you want!
          </p>
          <div className="flex gap-4">
            <button className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600">
              Action 1
            </button>
            <button className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600">
              Action 2
            </button>
          </div>
        </div>
      </div>
    </DialogWrapper>
  ),
}

export const WithVideo: Story = {
  render: () => (
    <DialogWrapper>
      <video
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        controls
        className="h-full max-h-full w-full max-w-full"
      />
    </DialogWrapper>
  ),
}

export const WithForm: Story = {
  render: () => (
    <DialogWrapper>
      <div className="mx-auto max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="mb-4 font-bold text-xl">Contact Form</h2>
        <form className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Name
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Email
            </label>
            <input
              type="email"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 text-sm">
              Message
            </label>
            <textarea
              rows={4}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Send Message
          </button>
        </form>
      </div>
    </DialogWrapper>
  ),
}
