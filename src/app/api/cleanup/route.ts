import { NextResponse } from 'next/server'

import { cleanupUnusedBlobs } from '@/lib/uploader'

export async function POST() {
  try {
    await cleanupUnusedBlobs()
    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
    })
  } catch (error) {
    console.error('Failed to cleanup unused blobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup unused blobs' },
      { status: 500 }
    )
  }
}
