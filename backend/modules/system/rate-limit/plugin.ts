import { Elysia } from 'elysia'
import {
  rateLimitCache,
  rateLimitCounter,
  ipBlacklistService,
} from './service'
import { sessionStore } from '@/modules/auth'
import { rbacCache } from '@/modules/rbac'

/** 白名单 IP，不走限流 */
const WHITELISTED_IPS = new Set(['127.0.0.1', 'localhost', '::1', '::ffff:127.0.0.1'])

/** 白名单角色编码，不走限流 */
const BYPASS_ROLE_CODES = new Set(['super-admin'])

export interface RateLimitContext {
  /** 获取当前请求的IP */
  getClientIp: () => string
  /** 获取限流统计 */
  getRateLimitStats: () => any
}

/**
 * 路径匹配（支持通配符）
 * /api/auth/login 匹配 /api/auth/login  (精确)
 * /api/admin/**    匹配 /api/admin/xxx   (前缀)
 * /api/admin/*     匹配 /api/admin/xxx   (单层)
 */
function matchPath(pattern: string, path: string): boolean {
  if (pattern === path) return true
  if (pattern === '/**' || pattern === '*') return true

  // 转换为正则
  const regexStr = pattern
    .replace(/\*\*/g, '___DOUBLE_STAR___')
    .replace(/\*/g, '[^/]+')
    .replace(/___DOUBLE_STAR___/g, '.*')

  return new RegExp(`^${regexStr}$`).test(path)
}

/**
 * 方法匹配
 */
function matchMethod(ruleMethod: string, requestMethod: string): boolean {
  if (ruleMethod === '*') return true
  const methods = ruleMethod.split(',').map((m) => m.trim().toUpperCase())
  return methods.includes(requestMethod.toUpperCase())
}

/**
 * 提取客户端 IP
 */
function extractClientIp(request: Request, server?: any): string {
  // 优先从 X-Forwarded-For / X-Real-IP 获取
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1'
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  // Bun 的 server.requestIP
  if (server?.requestIP) {
    try {
      const addr = server.requestIP(request)
      if (addr?.address) return addr.address
    } catch {}
  }

  return '127.0.0.1'
}

/**
 * 限流插件 - 作为全局中间件使用
 *
 * 工作流程:
 * 1. 检查IP黑名单
 * 2. 匹配限流规则（按优先级排序）
 * 3. 根据规则的限流模式执行检查
 * 4. 触发阈值时自动封禁IP
 */
export function rateLimitPlugin() {
  return new Elysia({ name: 'rate-limit-plugin' })
    .onBeforeHandle({ as: 'global' }, async ({ request, set }) => {
      const url = new URL(request.url)
      const path = url.pathname
      const method = request.method
      const ip = extractClientIp(request)

      // 0. 白名单 IP 直接放行
      if (WHITELISTED_IPS.has(ip)) return

      // 0.1 白名单角色直接放行（从 Bearer token 解析 session）
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const session = sessionStore.verify(token)
        if (session) {
          const role = rbacCache.getRole(session.roleId)
          if (role && BYPASS_ROLE_CODES.has(role.code)) return
        }
      }

      // 1. 检查IP黑名单
      if (rateLimitCache.isBlacklisted(ip)) {
        set.status = 403
        return {
          code: 403,
          message: '您的IP已被封禁，如需解封请联系管理员',
        }
      }

      // 2. 匹配限流规则
      const rules = rateLimitCache.getRules()
      for (const rule of rules) {
        if (!matchPath(rule.pathPattern, path)) continue
        if (!matchMethod(rule.method, method)) continue

        // 构建限流 key
        let dimensionKey: string
        switch (rule.dimension) {
          case 'ip':
            dimensionKey = ip
            break
          case 'user':
            // 用户维度需要 userId，从 header 或 session 获取
            dimensionKey = request.headers.get('x-user-id') || ip
            break
          case 'global':
            dimensionKey = 'global'
            break
          default:
            dimensionKey = ip
        }

        const ruleKey = `${rule.code}:${dimensionKey}`
        let allowed = true

        // 3. 根据模式检查
        switch (rule.mode) {
          case 'time_window':
            allowed = rateLimitCounter.checkTimeWindow(
              ruleKey,
              rule.windowSeconds,
              rule.maxRequests,
            )
            break
          case 'concurrent':
            allowed = rateLimitCounter.checkConcurrent(ruleKey, rule.maxConcurrent)
            break
          case 'sliding_window':
            allowed = rateLimitCounter.checkSlidingWindow(
              ruleKey,
              rule.windowSeconds,
              rule.maxRequests,
            )
            break
        }

        if (!allowed) {
          // 4. 检查是否需要自动封禁
          if (rule.blacklistThreshold > 0) {
            const triggerCount = rateLimitCounter.incrementBlacklistTrigger(ip, rule.id)
            if (triggerCount >= rule.blacklistThreshold) {
              // 异步封禁，不阻塞响应
              ipBlacklistService
                .autoBlock(
                  ip,
                  rule.id,
                  triggerCount,
                  `自动封禁: 触发限流规则[${rule.name}] ${triggerCount}次`,
                )
                .catch(console.error)
            }
          }

          set.status = rule.responseCode || 429
          return {
            code: rule.responseCode || 429,
            message: rule.responseMessage || '请求过于频繁，请稍后再试',
          }
        }
      }
    })
    .onAfterHandle({ as: 'global' }, ({ request }) => {
      // 释放并发计数（请求完成后）
      const url = new URL(request.url)
      const path = url.pathname
      const method = request.method
      const ip = extractClientIp(request)

      const rules = rateLimitCache.getRules()
      for (const rule of rules) {
        if (rule.mode !== 'concurrent') continue
        if (!matchPath(rule.pathPattern, path)) continue
        if (!matchMethod(rule.method, method)) continue

        let dimensionKey: string
        switch (rule.dimension) {
          case 'ip':
            dimensionKey = ip
            break
          case 'user':
            dimensionKey = request.headers.get('x-user-id') || ip
            break
          case 'global':
            dimensionKey = 'global'
            break
          default:
            dimensionKey = ip
        }

        const ruleKey = `${rule.code}:${dimensionKey}`
        rateLimitCounter.releaseConcurrent(ruleKey)
      }
    })
    .derive({ as: 'global' }, ({ request }) => {
      const rateLimit: RateLimitContext = {
        getClientIp: () => extractClientIp(request),
        getRateLimitStats: () => ({
          rules: rateLimitCache.getRules().length,
          counters: rateLimitCounter.getStats(),
        }),
      }
      return { rateLimit }
    })
}
