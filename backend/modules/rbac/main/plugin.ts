/**
 * RBAC 插件 - 权限检查中间件
 *
 * 默认不启用，通过路由配置 rbac.scope 来启用权限检查
 */

import { Elysia } from 'elysia'
import type { Row } from '@/packages/orm'
import PermissionScope from '@/models/permission-scope'
import { rbacService } from './service'

type PermissionScopeRow = Row<typeof PermissionScope>

/** RBAC Scope 配置 */
export interface RbacScope {
  /** 需要的权限编码（必须全部满足） */
  permissions?: string[]
  /** 需要的角色编码 */
  roles?: string[]
}

// 扩展 Elysia 的 DocumentDecoration 类型，支持 rbac.scope 配置
declare module 'elysia' {
  interface DocumentDecoration {
    rbac?: {
      scope?: RbacScope
    }
  }
}

/** 数据权限上下文 */
export interface DataScope {
  /** 按表名分组的数据过滤规则 */
  scopes: Map<string, Row<typeof PermissionScope>[]>
  /** 获取指定表的 SSQL 过滤规则 */
  getSsqlRules(tableName: string): string[]
  /** 获取指定表的过滤规则 */
  getScopes(tableName: string): Row<typeof PermissionScope>[]
}

/**
 * RBAC 插件
 *
 * 在路由中使用 `rbac.scope` 配置来启用权限检查
 * 配置了 permissions 后，会自动注入相关的 dataScope 数据权限
 *
 * @example
 * ```ts
 * app
 *   .use(authPlugin())
 *   .use(rbacPlugin())
 *   // 需要权限（必须全部满足）
 *   .get("/users", ({ dataScope }) => {
 *     // dataScope 包含该权限关联的数据过滤规则
 *     const rules = dataScope?.getSsqlRules("users");
 *     // ...
 *   }, {
 *     detail: { rbac: { scope: { permissions: ["user:read"] } } }
 *   })
 *   // 需要特定角色
 *   .delete("/users/:id", () => {...}, {
 *     detail: { rbac: { scope: { roles: ["admin", "super-admin"] } } }
 *   })
 * ```
 */
export function rbacPlugin() {
  const app = new Elysia({ name: 'rbac-plugin' })
  const routerHooksMap = new Map<string, any>()

  app
    .on('start', () => {
      // @ts-ignore
      app.getGlobalRoutes().forEach((route) => {
        routerHooksMap.set(`${route.method}:::${route.path}`, route.hooks || {})
      })
    })
    .derive({ as: 'global' }, ({ request, route, ...ctx }) => {
      // 从 derive 中获取 roleId (由 authPlugin 注入)
      const roleId = (ctx as any).roleId as number | null

      // 获取路由配置
      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      // 没有配置 scope 或未登录，不注入 dataScope
      if (!scope || !roleId || !scope.permissions?.length) {
        return { dataScope: null as DataScope | null }
      }

      // 获取角色的数据权限（仅限路由配置的权限）
      const permissionCodes = scope.permissions!
      const scopes = rbacService.getRoleScopesByPermissions(roleId, permissionCodes)

      const dataScope: DataScope = {
        scopes,
        getSsqlRules(tableName: string): string[] {
          return scopes.get(tableName)?.map((s) => s.ssqlRule) || []
        },
        getScopes(tableName: string): PermissionScopeRow[] {
          return scopes.get(tableName) || []
        },
      }

      return { dataScope }
    })
    .onBeforeHandle({ as: 'global' }, ({ set, request, route, ...ctx }) => {
      // 从 derive 中获取 roleId (由 authPlugin 注入)
      const roleId = (ctx as any).roleId as number | null

      // 获取路由配置
      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      // 没有配置 scope，跳过权限检查
      if (!scope) {
        return
      }

      // 未登录时无法检查权限
      if (!roleId) {
        set.status = 401
        return {
          code: 401,
          message: '未登录',
        }
      }

      // 检查角色
      if (scope.roles && scope.roles.length > 0) {
        const role = rbacService.getRole(roleId)
        if (!role || !scope.roles.includes(role.code)) {
          set.status = 403
          return {
            code: 403,
            message: '无权访问：角色不匹配',
          }
        }
      }

      // 检查权限（必须全部满足）
      if (scope.permissions && scope.permissions.length > 0) {
        const hasAll = rbacService.hasAllPermissions(roleId, scope.permissions)
        if (!hasAll) {
          set.status = 403
          return {
            code: 403,
            message: '无权访问：缺少权限',
            required: scope.permissions,
          }
        }
      }
    })

  return app
}

export default rbacPlugin
