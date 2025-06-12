'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'

import { Post } from '@/lib/types'

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
  const src = post.images[0].cdnUrl
  const alt = ''

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
        <Image
          src={src}
          alt={alt}
          width={0}
          height={0}
          sizes="100vw"
          className="object-contain"
          style={{
            width: 'auto',
            height: '100%',
            maxWidth: '100%',
          }}
        />
      </div>
    </dialog>
  )
}
