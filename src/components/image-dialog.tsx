'use client'

import { useEffect, useRef } from 'react'

interface ImageDialogProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function ImageDialog({
  isOpen,
  onClose,
  children,
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
      <div className="relative flex h-full w-full items-center justify-center md:m-16 md:h-[calc(100vh-128px)] md:w-[calc(100vw-128px)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 md:top-4 md:right-4"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  )
}
