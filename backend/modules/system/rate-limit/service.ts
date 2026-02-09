import type { Insert, Update } from '@/packages/orm'
import RateLimitRule from '@/models/rate-limit-rule'
import IpBlacklist from '@/models/ip-blacklist'
import { CrudService, type CrudContext } from '@/modules/crud-service'

/** 限流规则缓存（内存中维护，避免每次请求查库） */
class RateLimitCache {
  private rules: any[] = []
  private blacklist = new Map<string, { expireAt: Date | null; status: number }>()
  private initialized = false

  async init() {
    if (this.initialized) return
    await this.reloadRules()
    await this.reloadBlacklist()
    this.initialized = true
  }

  async reloadRules() {
    const allRules = await RateLimitRule.findMany({
      where: `status = 1`,
      orderBy: [{ column: 'priority', order: 'ASC' }],
    })
    this.rules = allRules
  }

  async reloadBlacklist() {
    this.blacklist.clear()
    const allBlacklist = await IpBlacklist.findMany({ where: `status = 1` })
    for (const item of allBlacklist) {
      this.blacklist.set(item.ip, {
        expireAt: item.expireAt,
        status: item.status,
      })
    }
  }

  getRules(): any[] {
    return this.rules
  }

  isBlacklisted(ip: string): boolean {
    const entry = this.blacklist.get(ip)
    if (!entry || entry.status !== 1) return false
    // 检查是否过期
    if (entry.expireAt && new Date() > new Date(entry.expireAt)) {
      this.blacklist.delete(ip)
      return false
    }
    return true
  }

  addToBlacklist(ip: string, expireAt: Date | null) {
    this.blacklist.set(ip, { expireAt, status: 1 })
  }

  removeFromBlacklist(ip: string) {
    this.blacklist.delete(ip)
  }
}

export const rateLimitCache = new RateLimitCache()

/**
 * 内存计数器 - 用于限流计数
 * 使用 Map + 自动过期清理
 */
class RateLimitCounter {
  /** 时间窗口计数: key -> { count, windowStart } */
  private windowCounters = new Map<string, { count: number; windowStart: number }>()
  /** 并发计数: key -> count */
  private concurrentCounters = new Map<string, number>()
  /** 黑名单触发计数: ip:ruleId -> count */
  private blacklistTriggerCounters = new Map<string, number>()

  /** 清理周期 */
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor() {
    // 每分钟清理过期的计数器
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000)
  }

  /**
   * 检查并递增时间窗口计数
   * @returns true 表示允许通过，false 表示被限流
   */
  checkTimeWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
    const now = Date.now()
    const entry = this.windowCounters.get(key)

    if (!entry || now - entry.windowStart > windowSeconds * 1000) {
      // 新窗口
      this.windowCounters.set(key, { count: 1, windowStart: now })
      return true
    }

    if (entry.count >= maxRequests) {
      return false
    }

    entry.count++
    return true
  }

  /**
   * 检查并发限制
   * @returns true 表示允许通过，false 表示被限流
   */
  checkConcurrent(key: string, maxConcurrent: number): boolean {
    const current = this.concurrentCounters.get(key) || 0
    if (current >= maxConcurrent) return false
    this.concurrentCounters.set(key, current + 1)
    return true
  }

  /** 释放并发计数 */
  releaseConcurrent(key: string) {
    const current = this.concurrentCounters.get(key) || 0
    if (current > 0) {
      this.concurrentCounters.set(key, current - 1)
    }
  }

  /**
   * 滑动窗口限流（使用固定窗口近似实现）
   * 通过对比当前窗口和上一窗口的计数做加权计算
   */
  checkSlidingWindow(key: string, windowSeconds: number, maxRequests: number): boolean {
    const now = Date.now()
    const windowMs = windowSeconds * 1000
    const currentWindowKey = `${key}:current`
    const prevWindowKey = `${key}:prev`

    const currentEntry = this.windowCounters.get(currentWindowKey)
    const prevEntry = this.windowCounters.get(prevWindowKey)

    if (!currentEntry || now - currentEntry.windowStart > windowMs) {
      // 当前窗口过期，轮转
      if (currentEntry) {
        this.windowCounters.set(prevWindowKey, { ...currentEntry })
      }
      this.windowCounters.set(currentWindowKey, { count: 1, windowStart: now })
      return true
    }

    // 计算加权请求数
    const elapsed = now - currentEntry.windowStart
    const weight = 1 - elapsed / windowMs
    const prevCount = prevEntry ? prevEntry.count * weight : 0
    const estimatedCount = prevCount + currentEntry.count

    if (estimatedCount >= maxRequests) {
      return false
    }

    currentEntry.count++
    return true
  }

  /** 增加黑名单触发计数，返回当前计数 */
  incrementBlacklistTrigger(ip: string, ruleId: number): number {
    const key = `${ip}:${ruleId}`
    const count = (this.blacklistTriggerCounters.get(key) || 0) + 1
    this.blacklistTriggerCounters.set(key, count)
    return count
  }

  /** 获取限流统计信息 */
  getStats() {
    return {
      windowCounters: this.windowCounters.size,
      concurrentCounters: this.concurrentCounters.size,
      blacklistTriggerCounters: this.blacklistTriggerCounters.size,
    }
  }

  /** 清理过期的计数器 */
  private cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.windowCounters) {
      // 清理超过10分钟未更新的窗口
      if (now - entry.windowStart > 600_000) {
        this.windowCounters.delete(key)
      }
    }
    // 清理并发为0的计数
    for (const [key, count] of this.concurrentCounters) {
      if (count <= 0) this.concurrentCounters.delete(key)
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

export const rateLimitCounter = new RateLimitCounter()

// ===================== Service =====================

export class RateLimitRuleService extends CrudService<typeof RateLimitRule.schema> {
  constructor() {
    super(RateLimitRule)
  }

  async findByCode(code: string) {
    return await this.model.findOne({ where: `code = '${code}'` })
  }

  override async create(data: Insert<typeof RateLimitRule>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rateLimitCache.reloadRules()
    return result
  }

  override async update(id: number, data: Update<typeof RateLimitRule>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rateLimitCache.reloadRules()
    return result
  }

  override async delete(id: number, ctx?: CrudContext) {
    const ok = await super.delete(id, ctx)
    if (ok) await rateLimitCache.reloadRules()
    return ok
  }

  async initCache() {
    await rateLimitCache.init()
  }

  /** 获取限流统计 */
  getStats() {
    return {
      rules: rateLimitCache.getRules().length,
      counters: rateLimitCounter.getStats(),
    }
  }
}

export const rateLimitRuleService = new RateLimitRuleService()

export class IpBlacklistService extends CrudService<typeof IpBlacklist.schema> {
  constructor() {
    super(IpBlacklist)
  }

  async findByIp(ip: string) {
    return await this.model.findOne({ where: `ip = '${ip}' && status = 1` })
  }

  override async create(data: Insert<typeof IpBlacklist>, ctx?: CrudContext) {
    const result = await super.create(data, ctx)
    if (result) await rateLimitCache.reloadBlacklist()
    return result
  }

  override async update(id: number, data: Update<typeof IpBlacklist>, ctx?: CrudContext) {
    const result = await super.update(id, data, ctx)
    if (result) await rateLimitCache.reloadBlacklist()
    return result
  }

  override async delete(id: number, ctx?: CrudContext) {
    const ok = await super.delete(id, ctx)
    if (ok) await rateLimitCache.reloadBlacklist()
    return ok
  }

  /** 解封IP */
  async unblock(id: number) {
    const item = await this.model.findOne({ where: `id = ${id}` })
    if (!item) return null
    const result = await this.model.update(id, { status: 0 })
    rateLimitCache.removeFromBlacklist(item.ip)
    return result
  }

  /** 自动封禁IP */
  async autoBlock(ip: string, ruleId: number, triggerCount: number, reason: string) {
    const existing = await this.findByIp(ip)
    if (existing) {
      await this.model.update(existing.id, { triggerCount })
      return existing
    }
    const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const result = await this.model.create({
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
}

export const ipBlacklistService = new IpBlacklistService()
