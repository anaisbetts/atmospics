'use client'

import { useEffect, useRef } from 'react'

import { Post } from '@/lib/types'
import { PostCarousel } from './post-carousel'

interface ImageDialogProps {
  post: Post
  isOpen: boolean
  onClose: () => void
}

export default function ImageDialog({
  post,
  isOpen,
  onClose,
}: ImageDialogProps) {

  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isOpen) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isOpen])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClose = () => {
      onClose()
    }

    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="h-screen max-h-none w-screen max-w-none bg-transparent p-0"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
      }}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          width: 'calc(100vw - 128px)',
          height: 'calc(100vh - 128px)',
          margin: '64px',
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75"
        >
          ×
        </button>
        <PostCarousel 
          images={post.images} 
          className="w-full h-full max-h-full"
        />
      </div>
    </dialog>
  )
}
