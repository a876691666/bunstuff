import { Elysia } from 'elysia'
import * as loginLogService from '@/services/login-log'
import type { LoginAction } from '@/services/login-log'

/** 登录日志上下文 */
export interface LoginLogContext {
  /** 记录登录日志 */
  logLogin: (data: {
    userId?: number | null
    username: string
    ip?: string | null
    userAgent?: string | null
    status: 0 | 1
    action: LoginAction
    msg?: string | null
  }) => Promise<any>
}

/**
 * 登录日志插件
 *
 * @example
 * ```ts
 * app
 *   .use(loginLogPlugin())
 *   .post("/login", async ({ loginLog, body, request }) => {
 *     await loginLog.logLogin({
 *       userId: result.user?.id,
 *       username: body.username,
 *       ip: request.headers.get("x-forwarded-for"),
 *       userAgent: request.headers.get("user-agent"),
 *       status: result.success ? 1 : 0,
 *       action: "login",
 *       msg: result.message,
 *     });
 *   })
 * ```
 */
export function loginLogPlugin() {
  return new Elysia({ name: 'login-log-plugin' }).derive({ as: 'global' }, () => {
    const loginLog: LoginLogContext = {
      logLogin: (data) => loginLogService.log(data),
    }
    return { loginLog }
  })
}
