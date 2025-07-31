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

export function resolveImageUrl(
  originalUrl: string,
  imageCache?: Map<string, string>
): string {
  return imageCache?.get(originalUrl) || originalUrl
}

export function fixUnicodeDoubleEncoding(str: string) {
  // First, convert the Unicode escape sequences to actual characters
  const withActualBytes = str.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16))
  })

  // Now we have the raw UTF-8 bytes as a string
  // We need to decode this as UTF-8
  const bytes = []
  for (let i = 0; i < withActualBytes.length; i++) {
    bytes.push(withActualBytes.charCodeAt(i))
  }

  // Create a Uint8Array and decode as UTF-8
  const uint8Array = new Uint8Array(bytes)
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(uint8Array)
}
