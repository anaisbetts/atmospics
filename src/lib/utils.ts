import Mux from '@mux/mux-node'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function createMuxClient() {
  const muxTokenId = process.env.MUX_TOKEN_ID
  const muxTokenSecret = process.env.MUX_TOKEN_SECRET

  if (!muxTokenId || !muxTokenSecret) {
    throw new Error(
      'MUX_TOKEN_ID and MUX_TOKEN_SECRET environment variables are required'
    )
  }

  return new Mux({
    tokenId: muxTokenId,
    tokenSecret: muxTokenSecret,
  })
}
