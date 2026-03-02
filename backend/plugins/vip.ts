/**
 * VIP 插件 - VIP 等级和资源限制校验中间件
 * 从 modules/vip/main/plugin.ts 迁移
 *
 * 默认不启用，通过路由配置 vip.scope 来启用 VIP 检查
 */

import { Elysia } from 'elysia'
import * as vipService from '@/services/vip'

/** VIP Scope 配置 */
export interface VipScope {
  /** 需要的 VIP 等级代码（精确匹配或更高等级） */
  vipTier?: string
  /** 是否需要任意有效 VIP */
  required?: boolean
}

// 扩展 Elysia 的 DocumentDecoration 类型，支持 vip.scope 配置
declare module 'elysia' {
  interface DocumentDecoration {
    /** VIP 配置 */
    vip?: {
      scope?: VipScope
    }
  }
}

/** VIP 上下文 */
export interface VipContext {
  /** 用户 VIP 等级 ID */
  vipTierId: number | null
  /** VIP 等级代码 */
  vipTierCode: string | null
  /** VIP 绑定状态 */
  bindingStatus: number
  /** 是否是有效 VIP */
  isValidVip: boolean
  /** 检查是否可以使用指定资源 */
  canUseResource: (resourceKey: string, amount?: number) => Promise<boolean>
  /** 增加资源使用量 */
  incrementResource: (resourceKey: string, amount?: number) => Promise<void>
  /** 减少资源使用量 */
  decrementResource: (resourceKey: string, amount?: number) => Promise<void>
  /** 获取资源使用情况 */
  getResourceUsage: (resourceKey: string) => Promise<{
    currentUsage: number
    limitValue: number
    available: number
    canUse: boolean
  }>
}

/**
 * VIP 插件
 *
 * @example
 * ```ts
 * app
 *   .use(authPlugin())
 *   .use(vipPlugin())
 *   .get("/pro-feature", ({ vip }) => {
 *     // vip 包含 VIP 上下文
 *   }, {
 *     detail: { vip: { scope: { vipTier: "pro" } } }
 *   })
 * ```
 */
export function vipPlugin() {
  const app = new Elysia({ name: 'vip-plugin' })
  const routerHooksMap = new Map<string, any>()

  app
    .on('start', () => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route: any) => {
        routerHooksMap.set(`${route.method}:::${route.path}`, route.hooks || {})
      })
    })
    .derive({ as: 'global' }, async ({ request, route, ...ctx }) => {
      const userId = (ctx as any).userId as number | null

      const defaultVipContext: VipContext = {
        vipTierId: null,
        vipTierCode: null,
        bindingStatus: 0,
        isValidVip: false,
        canUseResource: async () => false,
        incrementResource: async () => {},
        decrementResource: async () => {},
        getResourceUsage: async () => ({
          currentUsage: 0,
          limitValue: 0,
          available: 0,
          canUse: false,
        }),
      }

      if (!userId) {
        return { vip: defaultVipContext }
      }

      const userVip = await vipService.getUserVip(userId)

      if (!userVip || userVip.bindingStatus !== 1) {
        return { vip: defaultVipContext }
      }

      if (userVip.expireTime && new Date(userVip.expireTime) < new Date()) {
        return { vip: defaultVipContext }
      }

      const vipContext: VipContext = {
        vipTierId: userVip.vipTierId,
        vipTierCode: userVip.vipTier?.code ?? null,
        bindingStatus: userVip.bindingStatus,
        isValidVip: true,
        canUseResource: async (resourceKey: string, amount: number = 1) => {
          const result = await vipService.checkResourceUsage(userId, resourceKey, amount)
          return result.canUse
        },
        incrementResource: async (resourceKey: string, amount: number = 1) => {
          await vipService.incrementResourceUsage(userId, resourceKey, amount)
        },
        decrementResource: async (resourceKey: string, amount: number = 1) => {
          await vipService.decrementResourceUsage(userId, resourceKey, amount)
        },
        getResourceUsage: async (resourceKey: string) => {
          return await vipService.checkResourceUsage(userId, resourceKey)
        },
      }

      return { vip: vipContext }
    })
    .onBeforeHandle({ as: 'global' }, async ({ set, request, route, ...ctx }) => {
      const userId = (ctx as any).userId as number | null
      const vip = (ctx as any).vip as VipContext

      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.vip || {}
      const vipScope = routeConfig?.scope as VipScope | undefined

      if (!vipScope) return

      if (!userId) {
        set.status = 401
        return { code: 401, message: '未登录' }
      }

      if (vipScope.required && !vip.isValidVip) {
        set.status = 403
        return { code: 403, message: '需要有效的 VIP' }
      }

      if (vipScope.vipTier) {
        const requiredTier = await vipService.findTierByCode(vipScope.vipTier)
        if (!requiredTier) {
          set.status = 500
          return { code: 500, message: 'VIP 等级配置错误' }
        }

        if (!vip.isValidVip || vip.vipTierCode !== vipScope.vipTier) {
          set.status = 403
          return {
            code: 403,
            message: `需要 ${requiredTier.name} VIP`,
            required: vipScope.vipTier,
            current: vip.vipTierCode,
          }
        }
      }
    })

  return app
}

export default vipPlugin
