/**
 * 登录日志插件 - 提供登录日志记录能力
 */

import { Elysia } from "elysia";
import { loginLogService, type LoginAction } from "./service";

/** 登录日志上下文 */
export interface LoginLogContext {
  /** 记录登录日志 */
  logLogin: (data: {
    userId?: number | null;
    username: string;
    ip?: string | null;
    userAgent?: string | null;
    status: 0 | 1;
    action: LoginAction;
    msg?: string | null;
  }) => Promise<any>;
}

/**
 * 登录日志插件
 * 
 * @example
 * ```ts
 * app
 *   .use(loginLogPlugin())
 *   .post("/login", async ({ loginLog, body, request }) => {
 *     const result = await authService.login(body.username, body.password);
 *     await loginLog.logLogin({
 *       userId: result.user?.id,
 *       username: body.username,
 *       ip: request.headers.get("x-forwarded-for"),
 *       userAgent: request.headers.get("user-agent"),
 *       status: result.success ? 1 : 0,
 *       action: "login",
 *       msg: result.message,
 *     });
 *     return result;
 *   })
 * ```
 */
export function loginLogPlugin() {
  return new Elysia({ name: "login-log-plugin" })
    .derive({ as: "global" }, () => {
      const loginLog: LoginLogContext = {
        logLogin: (data) => loginLogService.log(data),
      };
      return { loginLog };
    });
}
