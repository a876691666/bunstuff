/**
 * RBAC 插件 - 权限检查中间件
 * 从 modules/rbac/main/plugin.ts 迁移
 */

import { Elysia } from 'elysia'
import type { Row } from '@/packages/orm'
import { model } from '@/core/model'
import * as rbacService from '@/services/rbac'

const PermissionScope = model.permission_scope

type PermissionScopeRow = Row<typeof PermissionScope>

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
  scopes: Map<string, Row<typeof PermissionScope>[]>
  getSsqlRules(tableName: string): string[]
  getScopes(tableName: string): Row<typeof PermissionScope>[]
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
    .derive({ as: 'global' }, ({ request, route, ...ctx }) => {
      const roleId = (ctx as any).roleId as number | null

      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      if (!scope || !roleId || !scope.permissions?.length) {
        return { dataScope: null as DataScope | null }
      }

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
      const roleId = (ctx as any).roleId as number | null

      const hooks = routerHooksMap.get(`${request.method}:::${route}`) || {}
      const routeConfig = hooks?.detail?.rbac || {}
      const scope = routeConfig?.scope as RbacScope | undefined

      if (!scope) return

      if (!roleId) {
        set.status = 401
        return { code: 401, message: '未登录' }
      }

      if (scope.roles && scope.roles.length > 0) {
        const role = rbacService.getRole(roleId)
        if (!role || !scope.roles.includes(role.code)) {
          set.status = 403
          return { code: 403, message: '无权访问：角色不匹配' }
        }
      }

      if (scope.permissions && scope.permissions.length > 0) {
        const hasAll = rbacService.hasAllPermissions(roleId, scope.permissions)
        if (!hasAll) {
          set.status = 403
          return { code: 403, message: '无权访问：缺少权限', required: scope.permissions }
        }
      }
    })

  return app
}

export default rbacPlugin
