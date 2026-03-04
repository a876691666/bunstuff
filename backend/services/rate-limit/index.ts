export { rateLimitCache, rateLimitCounter } from './cache'
export { autoBlock } from './blacklist'

import { rateLimitCache, rateLimitCounter } from './cache'

export async function init() {
  await rateLimitCache.init()
}

export function getStats() {
  return {
    rules: rateLimitCache.getRules().length,
    counters: rateLimitCounter.getStats(),
  }
}
