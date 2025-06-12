import { NextResponse } from 'next/server'

import { deleteContentManifest } from '@/lib/uploader'

export async function POST() {
  try {
    await deleteContentManifest()
    return NextResponse.json({
      success: true,
      message: 'Content manifest deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete content manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete content manifest' },
      { status: 500 }
    )
  }
}
