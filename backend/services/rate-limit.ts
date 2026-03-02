/**
 * 限流服务
 * 从 modules/system/rate-limit/service.ts 迁移
 */

import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const RateLimitRule = model.rate_limit_rule
const IpBlacklist = model.ip_blacklist

// ============ 限流规则缓存 ============

function createRateLimitCache() {
  let rules: any[] = []
  const blacklist = new Map<string, { expireAt: Date | null; status: number }>()
  let initialized = false

  return {
    async init() {
      if (initialized) return
      await this.reloadRules()
      await this.reloadBlacklist()
      initialized = true
    },

    async reloadRules() {
      const allRules = await RateLimitRule.findMany({
        where: `status = 1`,
        orderBy: [{ column: 'priority', order: 'ASC' }],
      })
      rules = allRules
    },

    async reloadBlacklist() {
      blacklist.clear()
      const allBlacklist = await IpBlacklist.findMany({ where: `status = 1` })
      for (const item of allBlacklist) {
        blacklist.set(item.ip, {
          expireAt: item.expireAt,
          status: item.status,
        })
      }
    },

    getRules(): any[] {
      return rules
    },

    isBlacklisted(ip: string): boolean {
      const entry = blacklist.get(ip)
      if (!entry || entry.status !== 1) return false
      if (entry.expireAt && new Date() > new Date(entry.expireAt)) {
        blacklist.delete(ip)
        return false
      }
      return true
    },

    addToBlacklist(ip: string, expireAt: Date | null) {
      blacklist.set(ip, { expireAt, status: 1 })
    },

    removeFromBlacklist(ip: string) {
      blacklist.delete(ip)
    },
  }
}

export const rateLimitCache = createRateLimitCache()

// ============ 内存计数器 ============

function createRateLimitCounter() {
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

  return {
    checkTimeWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
      const now = Date.now()
      const entry = windowCounters.get(key)

      if (!entry || now - entry.windowStart > windowSeconds * 1000) {
        windowCounters.set(key, { count: 1, windowStart: now })
        return true
      }

      if (entry.count >= maxRequests) return false
      entry.count++
      return true
    },

    checkConcurrent(key: string, maxConcurrent: number): boolean {
      const current = concurrentCounters.get(key) || 0
      if (current >= maxConcurrent) return false
      concurrentCounters.set(key, current + 1)
      return true
    },

    releaseConcurrent(key: string) {
      const current = concurrentCounters.get(key) || 0
      if (current > 0) {
        concurrentCounters.set(key, current - 1)
      }
    },

    checkSlidingWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
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
    },

    incrementBlacklistTrigger(ip: string, ruleId: number): number {
      const key = `${ip}:${ruleId}`
      const count = (blacklistTriggerCounters.get(key) || 0) + 1
      blacklistTriggerCounters.set(key, count)
      return count
    },

    getStats() {
      return {
        windowCounters: windowCounters.size,
        concurrentCounters: concurrentCounters.size,
        blacklistTriggerCounters: blacklistTriggerCounters.size,
      }
    },

    destroy() {
      if (cleanupInterval) {
        clearInterval(cleanupInterval)
        cleanupInterval = null
      }
    },
  }
}

export const rateLimitCounter = createRateLimitCounter()

// ============ 限流规则 CRUD ============

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return RateLimitRule.page({
    where: buildWhere(RateLimitRule.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return RateLimitRule.findOne({ where: buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx) })
}

export async function findByCode(code: string) {
  return RateLimitRule.findOne({ where: `code = '${code}'` })
}

export async function create(data: Insert<typeof RateLimitRule>, ctx?: CrudContext) {
  if (!checkCreateScope(RateLimitRule.tableName, data as Record<string, any>, ctx)) return null
  const result = await RateLimitRule.create(data)
  if (result) await rateLimitCache.reloadRules()
  return result
}

export async function update(id: number, data: Update<typeof RateLimitRule>, ctx?: CrudContext) {
  const w = buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await RateLimitRule.updateMany(w, data)
  if (n === 0) return null
  const result = await RateLimitRule.getOne(id as any)
  if (result) await rateLimitCache.reloadRules()
  return result
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(RateLimitRule.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await RateLimitRule.deleteMany(w)) > 0
  if (ok) await rateLimitCache.reloadRules()
  return ok
}

export async function initCache() {
  await rateLimitCache.init()
}

export function getStats() {
  return {
    rules: rateLimitCache.getRules().length,
    counters: rateLimitCounter.getStats(),
  }
}

// ============ IP 黑名单 CRUD ============

export async function findAllBlacklist(query: PageQuery, ctx?: CrudContext) {
  return IpBlacklist.page({
    where: buildWhere(IpBlacklist.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

export async function findBlacklistById(id: number, ctx?: CrudContext) {
  return IpBlacklist.findOne({ where: buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx) })
}

export async function findByIp(ip: string) {
  return IpBlacklist.findOne({ where: `ip = '${ip}' && status = 1` })
}

export async function createBlacklist(data: Insert<typeof IpBlacklist>, ctx?: CrudContext) {
  if (!checkCreateScope(IpBlacklist.tableName, data as Record<string, any>, ctx)) return null
  const result = await IpBlacklist.create(data)
  if (result) await rateLimitCache.reloadBlacklist()
  return result
}

export async function updateBlacklist(
  id: number,
  data: Update<typeof IpBlacklist>,
  ctx?: CrudContext,
) {
  const w = buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await IpBlacklist.updateMany(w, data)
  if (n === 0) return null
  const result = await IpBlacklist.getOne(id as any)
  if (result) await rateLimitCache.reloadBlacklist()
  return result
}

export async function removeBlacklist(id: number, ctx?: CrudContext) {
  const w = buildWhere(IpBlacklist.tableName, `id = ${id}`, ctx)
  if (!w) return false
  const ok = (await IpBlacklist.deleteMany(w)) > 0
  if (ok) await rateLimitCache.reloadBlacklist()
  return ok
}

export async function unblock(id: number) {
  const item = await IpBlacklist.findOne({ where: `id = ${id}` })
  if (!item) return null
  const result = await IpBlacklist.update(id, { status: 0 })
  rateLimitCache.removeFromBlacklist(item.ip)
  return result
}

export async function autoBlock(ip: string, ruleId: number, triggerCount: number, reason: string) {
  const existing = await findByIp(ip)
  if (existing) {
    await IpBlacklist.update(existing.id, { triggerCount })
    return existing
  }
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const result = await IpBlacklist.create({
    ip,
    reason,
    source: 'auto',
    ruleId,
    triggerCount,
    expireAt,
    status: 1,
  })
  rateLimitCache.addToBlacklist(ip, expireAt)
  return result
}

/** Schema 代理 */
export const getRuleSchema: (typeof RateLimitRule)['getSchema'] =
  RateLimitRule.getSchema.bind(RateLimitRule)
export const getBlacklistSchema: (typeof IpBlacklist)['getSchema'] =
  IpBlacklist.getSchema.bind(IpBlacklist)
