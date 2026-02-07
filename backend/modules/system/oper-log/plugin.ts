/**
 * 操作日志插件 - 提供操作日志自动记录能力
 *
 * 支持两种使用方式：
 * 1. 自动记录：通过路由配置 detail.operLog 自动记录
 * 2. 手动记录：在路由中调用 operLog.log()
 */

import { Elysia } from 'elysia'
import { operLogService, type OperType } from './service'

/** 操作日志上下文 */
export interface OperLogContext {
  /** 手动记录操作日志 */
  log: (data: {
    title: string
    type?: OperType
    status?: 0 | 1
    errorMsg?: string | null
  }) => Promise<any>
}

// 扩展 Elysia 的 DocumentDecoration 类型，支持 operLog 配置
declare module 'elysia' {
  interface DocumentDecoration {
    operLog?: {
      /** 模块标题 */
      title: string
      /** 操作类型 */
      type?: OperType
      /** 是否跳过记录（默认 false） */
      skip?: boolean
    }
  }
}

/**
 * 操作日志插件
 *
 * @example
 * ```ts
 * // 方式1: 自动记录（推荐）
 * app
 *   .use(authPlugin())
 *   .use(operLogPlugin())
 *   .post("/users", async ({ body }) => {
 *     const user = await userService.create(body);
 *     return R.ok(user);
 *   }, {
 *     detail: {
 *       operLog: { title: "用户管理", type: "create" }
 *     }
 *   })
 *
 * // 方式2: 手动记录
 * app.post("/users/:id/reset-password", async ({ operLog }) => {
 *   await operLog.log({ title: "重置密码", type: "update" });
 *   return R.success();
 * })
 * ```
 */
export function operLogPlugin() {
  const routerHooksMap = new Map<string, any>()

  return new Elysia({ name: 'oper-log-plugin' })
    .on('start', (app) => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route: any) => {
        routerHooksMap.set(`${route.method}:::${route.path}`, route.hooks || {})
      })
    })
    .derive({ as: 'global' }, (ctx) => {
      const startTime = Date.now()

      const operLog: OperLogContext = {
        log: async (data) => {
          // 从请求上下文中获取信息
          const request = ctx.request
          const userId = (ctx as any).userId ?? null
          const username = (ctx as any).session?.username ?? ''
          const ip = ctx.server?.requestIP(request)

          return operLogService.log({
            ...data,
            method: request.method,
            url: new URL(request.url).pathname,
            ip: ip ? `${ip.address}:${ip.port}` : null,
            userId,
            username,
            costTime: Date.now() - startTime,
          })
        },
      }

      return { operLog, __operLogStartTime: startTime }
    })
    .onAfterHandle({ as: 'global' }, async (ctx) => {
      // 通过 routerHooksMap 获取路由配置
      const hooks = routerHooksMap.get(`${ctx.request.method}:::${(ctx as any).route}`) || {}
      const operLogConfig = hooks?.detail?.operLog

      if (!operLogConfig || operLogConfig.skip) {
        return
      }

      // 自动记录成功的操作
      const request = ctx.request
      const userId = (ctx as any).userId ?? null
      const username = (ctx as any).session?.username ?? ''
      const ip = ctx.server?.requestIP(request)
      const startTime = (ctx as any).__operLogStartTime ?? Date.now()

      await operLogService.log({
        title: operLogConfig.title,
        type: operLogConfig.type ?? 'other',
        method: request.method,
        url: new URL(request.url).pathname,
        ip: ip ? `${ip.address}:${ip.port}` : null,
        status: 1,
        userId,
        username,
        costTime: Date.now() - startTime,
      })
    })
    .onError({ as: 'global' }, async (ctx) => {
      // 通过 routerHooksMap 获取路由配置
      const hooks = routerHooksMap.get(`${ctx.request.method}:::${(ctx as any).route}`) || {}
      const operLogConfig = hooks?.detail?.operLog

      if (!operLogConfig || operLogConfig.skip) {
        return
      }

      // 自动记录失败的操作
      const request = ctx.request
      const userId = (ctx as any).userId ?? null
      const username = (ctx as any).session?.username ?? ''
      const ip = ctx.server?.requestIP(request)
      const startTime = (ctx as any).__operLogStartTime ?? Date.now()
      const error = (ctx as any).error

      await operLogService.log({
        title: operLogConfig.title,
        type: operLogConfig.type ?? 'other',
        method: request.method,
        url: new URL(request.url).pathname,
        ip: ip ? `${ip.address}:${ip.port}` : null,
        status: 0,
        errorMsg: error?.message || String(error),
        userId,
        username,
        costTime: Date.now() - startTime,
      })
    })
}
