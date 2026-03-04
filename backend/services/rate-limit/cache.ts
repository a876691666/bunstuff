import { model } from '@/core/model'

const RateLimitRule = model.rate_limit_rule
const IpBlacklist = model.ip_blacklist

// ============ 限流规则缓存 ============

let rules: any[] = []
const blacklist = new Map<string, { expireAt: Date | null; status: number }>()
let cacheInitialized = false

async function initCache() {
  if (cacheInitialized) return
  await reloadRules()
  await reloadBlacklist()
  cacheInitialized = true
}

async function reloadRules() {
  const allRules = await RateLimitRule.findMany({
    where: `status = 1`,
    orderBy: [{ column: 'priority', order: 'ASC' }],
  })
  rules = allRules
}

async function reloadBlacklist() {
  blacklist.clear()
  const allBlacklist = await IpBlacklist.findMany({ where: `status = 1` })
  for (const item of allBlacklist) {
    blacklist.set(item.ip, {
      expireAt: item.expireAt,
      status: item.status,
    })
  }
}

function getRules(): any[] {
  return rules
}

function isBlacklisted(ip: string): boolean {
  const entry = blacklist.get(ip)
  if (!entry || entry.status !== 1) return false
  if (entry.expireAt && new Date() > new Date(entry.expireAt)) {
    blacklist.delete(ip)
    return false
  }
  return true
}

function addToBlacklist(ip: string, expireAt: Date | null) {
  blacklist.set(ip, { expireAt, status: 1 })
}

function removeFromBlacklist(ip: string) {
  blacklist.delete(ip)
}

export const rateLimitCache = {
  init: initCache,
  reloadRules,
  reloadBlacklist,
  getRules,
  isBlacklisted,
  addToBlacklist,
  removeFromBlacklist,
}

// ============ 内存计数器 ============

const windowCounters = new Map<string, { count: number; windowStart: number }>()
const concurrentCounters = new Map<string, number>()
const blacklistTriggerCounters = new Map<string, number>()
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function cleanup() {
  const now = Date.now()
  for (const [key, entry] of windowCounters) {
    if (now - entry.windowStart > 600_000) {
      windowCounters.delete(key)
    }
  }
  for (const [key, count] of concurrentCounters) {
    if (count <= 0) concurrentCounters.delete(key)
  }
}

// 启动清理定时器
cleanupInterval = setInterval(() => cleanup(), 60_000)

function checkTimeWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
  const now = Date.now()
  const entry = windowCounters.get(key)

  if (!entry || now - entry.windowStart > windowSeconds * 1000) {
    windowCounters.set(key, { count: 1, windowStart: now })
    return true
  }

  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

function checkConcurrent(key: string, maxConcurrent: number): boolean {
  const current = concurrentCounters.get(key) || 0
  if (current >= maxConcurrent) return false
  concurrentCounters.set(key, current + 1)
  return true
}

function releaseConcurrent(key: string) {
  const current = concurrentCounters.get(key) || 0
  if (current > 0) {
    concurrentCounters.set(key, current - 1)
  }
}

function checkSlidingWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const currentWindowKey = `${key}:current`
  const prevWindowKey = `${key}:prev`

  const currentEntry = windowCounters.get(currentWindowKey)
  const prevEntry = windowCounters.get(prevWindowKey)

  if (!currentEntry || now - currentEntry.windowStart > windowMs) {
    if (currentEntry) {
      windowCounters.set(prevWindowKey, { ...currentEntry })
    }
    windowCounters.set(currentWindowKey, { count: 1, windowStart: now })
    return true
  }

  const elapsed = now - currentEntry.windowStart
  const weight = 1 - elapsed / windowMs
  const prevCount = prevEntry ? prevEntry.count * weight : 0
  const estimatedCount = prevCount + currentEntry.count

  if (estimatedCount >= maxRequests) return false
  currentEntry.count++
  return true
}

function incrementBlacklistTrigger(ip: string, ruleId: number): number {
  const key = `${ip}:${ruleId}`
  const count = (blacklistTriggerCounters.get(key) || 0) + 1
  blacklistTriggerCounters.set(key, count)
  return count
}

function getCounterStats() {
  return {
    windowCounters: windowCounters.size,
    concurrentCounters: concurrentCounters.size,
    blacklistTriggerCounters: blacklistTriggerCounters.size,
  }
}

function destroyCounter() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
}

export const rateLimitCounter = {
  checkTimeWindow,
  checkConcurrent,
  releaseConcurrent,
  checkSlidingWindow,
  incrementBlacklistTrigger,
  getStats: getCounterStats,
  destroy: destroyCounter,
}
