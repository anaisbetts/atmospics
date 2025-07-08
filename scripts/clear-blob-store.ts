import { setTimeout } from 'node:timers/promises'
import { BlobServiceRateLimited, del, list } from '@vercel/blob'

export default async function main(): Promise<number> {
  try {
    let cursor: string | undefined
    let totalDeleted = 0

    // Batch size to respect rate limits (conservative approach)
    const BATCH_SIZE = 100 // Conservative batch size
    const DELAY_MS = 1000 // 1 second delay between batches

    do {
      const listResult = await list({
        cursor,
        limit: BATCH_SIZE,
      })

      if (listResult.blobs.length > 0) {
        const batchUrls = listResult.blobs.map((blob) => blob.url)

        // Retry logic with exponential backoff
        let retries = 0
        const maxRetries = 3

        while (retries <= maxRetries) {
          try {
            await del(batchUrls)
            totalDeleted += listResult.blobs.length
            console.log(
              `Deleted ${listResult.blobs.length} blobs (${totalDeleted} total)`
            )
            break // Success, exit retry loop
          } catch (error) {
            retries++

            if (retries > maxRetries) {
              console.error(
                `Failed to delete batch after ${maxRetries} retries:`,
                error
              )
              throw error // Re-throw after max retries
            }

            // Exponential backoff: wait longer with each retry
            let backoffDelay = 2 ** retries * 1000

            if (error instanceof BlobServiceRateLimited) {
              backoffDelay = error.retryAfter * 1000
            }

            console.warn(
              `Retry ${retries}/${maxRetries} after ${backoffDelay}ms delay`
            )

            await setTimeout(backoffDelay)
          }

          await setTimeout(DELAY_MS)
        }
      }

      cursor = listResult.cursor
    } while (cursor)

    console.log(`All blobs were deleted. Total: ${totalDeleted}`)
    return 0
  } catch (error) {
    console.error('An error occurred:', error)
    return 1
  }
}

main()
  .then((exitCode) => {
    process.exit(exitCode)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
