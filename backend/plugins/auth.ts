/**
 * Auth 插件 - 全局认证中间件
 *
 * 默认启用，可通过路由配置禁用。
 * 简化版：仅提供 session/userId/roleId/roleCode，不再加载完整权限信息。
 */

import { Elysia } from 'elysia'
import * as session from '../services/session'
import * as rbacCache from '@/services/rbac-cache'

/** Auth 配置选项 */
export interface AuthPluginOptions {
  /** 从请求中提取 token 的方式，默认从 Authorization header 提取 */
  extractToken?: (request: Request) => string | null
  /** 无需认证的路径 (支持通配符) */
  excludePaths?: string[]
}

// 扩展 Elysia 的 DocumentDecoration 类型，支持 scope 配置
declare module 'elysia' {
  interface DocumentDecoration {
    auth?: {
      /**
       * 是否跳过认证检查
       */
      skipAuth?: boolean
    }
  }
}

/** 默认排除路径 */
const DEFAULT_EXCLUDE_PATHS = ['/api/auth/login', '/api/auth/register', '/api/health', '/']

/** 从请求中提取 token */
function defaultExtractToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return null
}

/** 检查路径是否匹配排除规则 */
function isPathExcluded(path: string, excludePaths: string[]): boolean {
  for (const pattern of excludePaths) {
    if (pattern === path) return true
    // 简单的通配符匹配
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1)
      if (path.startsWith(prefix)) return true
    }
  }
  return false
}

/**
 * Auth 插件
 *
 * 在路由中使用 `auth.skipAuth: true` 可以跳过认证检查
 *
 * @example
 * ```ts
 * app
 *   .use(authPlugin())
 *   .get("/public", () => "public", { detail: { auth: { skipAuth: true } } })
 *   .get("/private", ({ userId }) => `user: ${userId}`)
 * ```
 */
export function authPlugin(options: AuthPluginOptions = {}) {
  const extractToken = options.extractToken ?? defaultExtractToken
  const excludePaths = [...DEFAULT_EXCLUDE_PATHS, ...(options.excludePaths ?? [])]
  const routerHooksMap = new Map<any, any>()
  const app = new Elysia({ name: 'auth-plugin' })
    .on('start', (app) => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route) => {
        routerHooksMap.set(`${route.method}:::${route.path}`, route.hooks || {})
      })
    })
    .derive({ as: 'global' }, async (arg) => {
      const { request } = arg
      // 提取 token 并验证
      const token = extractToken(request)
      const sess = token ? session.verify(token) : null

      // 获取角色编码（轻量查询，无需加载完整权限树）
      let roleCode: string | null = null
      if (sess?.roleId) {
        const role = rbacCache.getRole(sess.roleId)
        roleCode = role?.code ?? null
      }

      return {
        session: sess,
        userId: sess?.userId ?? null,
        roleId: sess?.roleId ?? null,
        roleCode,
      }
    })
    .onBeforeHandle({ as: 'global' }, (arg) => {
      const { request, session, set, path, route } = arg
      const hooks = routerHooksMap.get(`${request.method}:::${route}`)
      if (!hooks) return

      // 获取路由配置
      const routeConfig = hooks?.detail?.auth || {}
      const skipAuth = routeConfig?.skipAuth === true

      // 检查是否需要跳过认证
      if (skipAuth || isPathExcluded(path, excludePaths)) {
        return // 跳过认证检查
      }

      // 需要认证但未登录
      if (!session) {
        set.status = 401
        return {
          code: 401,
          message: '未登录或登录已过期',
        }
      }
    })

  return app
}

export default authPlugin
