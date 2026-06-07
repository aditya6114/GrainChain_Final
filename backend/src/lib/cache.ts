import { redis } from './redis'

// Cache-aside helper: check cache → miss → you fetch from DB → store in cache
//
// Why a generic helper instead of putting Redis calls in each repository?
// Same reason we have a repository layer — one place for caching logic.
// If we switch from Redis to Memcached tomorrow, we change only this file.

export const cache = {

  // Get a cached value, parsed from JSON
  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  },

  // Store a value with a TTL (time-to-live) in seconds.
  // After TTL expires, Redis automatically deletes the key.
  // This ensures stale data eventually disappears even if we
  // forget to invalidate manually.
  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  },

  // Delete a specific key — called when data changes (invalidation)
  async del(key: string): Promise<void> {
    await redis.del(key)
  },

  // Delete all keys matching a pattern — e.g. 'donations:geo:*'
  // Used when a new donation is created and ALL geo caches might be stale.
  //
  // SCAN is used instead of KEYS because KEYS blocks Redis on large datasets.
  // SCAN iterates incrementally — production safe.
  async delPattern(pattern: string): Promise<void> {
    let cursor = '0'
    do {
      const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } while (cursor !== '0')
  },
}
