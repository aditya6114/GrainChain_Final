import IORedis from 'ioredis'
import { env } from '../types/env.schema'

// IORedis client shared by caching and BullMQ.
// maxRetriesPerRequest: null is required by BullMQ.

export const redis = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
})
