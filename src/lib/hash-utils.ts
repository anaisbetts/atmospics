// Browser-compatible hash utilities using Web Crypto API

/**
 * Generate SHA-256 hash using Web Crypto API (browser-compatible)
 */
export async function createSHA256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate random UUID using Web Crypto API (browser-compatible)
 */
export function generateUUID(): string {
  return crypto.randomUUID()
}

/**
 * Hash utility class that accumulates data and generates final hash
 */
export class HashBuilder {
  private data: string[] = []

  update(value: string): this {
    this.data.push(value)
    return this
  }

  async digest(): Promise<string> {
    const combined = this.data.join('')
    return createSHA256Hash(combined)
  }
}
