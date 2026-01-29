/**
 * Auth 插件 - 全局认证中间件
 * 
 * 默认启用，可通过路由配置禁用
 */

import { Elysia } from "elysia";
import { authService } from "./service";
import type { Session } from "./session";
import { rbacService, type UserPermissionInfo } from "../rbac/service";

/** Auth 配置选项 */
export interface AuthPluginOptions {
  /** 从请求中提取 token 的方式，默认从 Authorization header 提取 */
  extractToken?: (request: Request) => string | null;
  /** 无需认证的路径 (支持通配符) */
  excludePaths?: string[];
}

/** 默认排除路径 */
const DEFAULT_EXCLUDE_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/health",
  "/",
];

/** 从请求中提取 token */
function defaultExtractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/** 检查路径是否匹配排除规则 */
function isPathExcluded(path: string, excludePaths: string[]): boolean {
  for (const pattern of excludePaths) {
    if (pattern === path) return true;
    // 简单的通配符匹配
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      if (path.startsWith(prefix)) return true;
    }
  }
  return false;
}

/**
 * Auth 插件
 * 
 * 在路由中使用 `skipAuth: true` 可以跳过认证检查
 * 
 * @example
 * ```ts
 * app
 *   .use(authPlugin())
 *   .get("/public", () => "public", { detail: { skipAuth: true } })
 *   .get("/private", ({ store }) => `user: ${store.userId}`)
 * ```
 */
export function authPlugin(options: AuthPluginOptions = {}) {
  const extractToken = options.extractToken ?? defaultExtractToken;
  const excludePaths = [
    ...DEFAULT_EXCLUDE_PATHS,
    ...(options.excludePaths ?? []),
  ];

  return new Elysia({ name: "auth-plugin" })
    .derive(async ({ request }) => {
      // 提取 token 并验证
      const token = extractToken(request);
      const session = token ? authService.verifyToken(token) : null;

      // 获取完整的 RBAC 信息
      let rbac: UserPermissionInfo | null = null;
      if (session?.userId) {
        rbac = await rbacService.getUserPermissionInfo(session.userId);
      }

      return {
        session,
        userId: session?.userId ?? null,
        roleId: session?.roleId ?? null,
        rbac,
      };
    })
    .onBeforeHandle(({ request, session, set, path, route }) => {
      // 获取路由配置
      const routeConfig = (route as any)?.hooks?.detail;
      const skipAuth = routeConfig?.skipAuth === true;

      // 检查是否需要跳过认证
      if (skipAuth || isPathExcluded(path, excludePaths)) {
        return; // 跳过认证检查
      }

      // 需要认证但未登录
      if (!session) {
        set.status = 401;
        return {
          code: 401,
          message: "未登录或登录已过期",
        };
      }
    });
}

export default authPlugin;
