import { Elysia } from 'elysia'
import * as casbin from '@/services/rbac/casbin'
import * as rbacCache from '@/services/rbac/cache'

/** RBAC Scope 配置 */
export interface RbacScope {
  permissions?: string[]
  roles?: string[]
}

declare module 'elysia' {
  interface DocumentDecoration {
    rbac?: {
      scope?: RbacScope
    }
  }
}

/** 数据权限上下文 */
export interface DataScope {
  /** 所有 scope 条目（原始数据） */
  allScopes: Array<{ table: string; permission: string; rule: string }>
  /** 获取指定表的 SSQL 规则（仅返回匹配当前路由权限的规则） */
  getSsqlRules(tableName: string): string[]
}

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
    .derive({ as: 'global' }, async ({ request, route, ...ctx }) => {
      const roleId = (ctx as any).roleId as string | null

      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      if (!scope || !roleId) {
        return { dataScope: null as DataScope | null }
      }

      // roleId 现在就是角色编码，直接用于 Casbin 查询
      const role = rbacCache.getRole(roleId)
      if (!role) {
        return { dataScope: null as DataScope | null }
      }

      // 从 Casbin 获取该角色的全部数据域规则
      const allScopes = await casbin.getRoleScopes(roleId)
      const routePerms = new Set(scope.permissions || [])

      const dataScope: DataScope = {
        allScopes,
        getSsqlRules(tableName: string): string[] {
          return allScopes
            .filter((s) => s.table === tableName && routePerms.has(s.permission))
            .map((s) => s.rule)
        },
      }

      return { dataScope }
    })
    .onBeforeHandle({ as: 'global' }, async ({ set, request, route, ...ctx }) => {
      const roleId = (ctx as any).roleId as string | null

      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      if (!scope) return

      if (!roleId) {
        set.status = 401
        return { code: 401, message: '未登录' }
      }

      const role = rbacCache.getRole(roleId)
      if (!role) {
        set.status = 403
        return { code: 403, message: '无权访问：角色不存在' }
      }

      // 角色编码匹配（roleId 就是角色编码）
      if (scope.roles && scope.roles.length > 0) {
        if (!scope.roles.includes(roleId)) {
          set.status = 403
          return { code: 403, message: '无权访问：角色不匹配' }
        }
      }

      // 权限检查 (通过 Casbin)
      if (scope.permissions && scope.permissions.length > 0) {
        const hasAll = await casbin.hasAllPermissions(roleId, scope.permissions)
        if (!hasAll) {
          set.status = 403
          return { code: 403, message: '无权访问：缺少权限', required: scope.permissions }
        }
      }
    })

  return app
}

export default rbacPlugin
