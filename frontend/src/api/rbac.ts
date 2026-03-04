import { http } from '@/utils'
import type { MenuTree } from '@/types'

/** 角色信息（来自 /admin/rbac/roles） */
export interface RbacRole {
  id: string
  name: string
  status: number
  sort: number
  description: string | null
}

/** 数据权限规则 */
export interface ScopeRule {
  table: string
  permission: string
  rule: string
}

/** 用户权限信息 */
export interface UserPermissionInfo {
  userId: number
  permissionCodes: string[]
  menus: MenuTree[]
  scopes: ScopeRule[]
}

/** RBAC 缓存状态（与后端 Casbin 版一致） */
export interface RbacCacheStatus {
  initialized: boolean
  roleCount: number
  localMenuCount: number
  policyCount: number
  permCount: number
  scopeCount: number
  moduleCount: number
  permissionDefCount: number
  lastUpdated: string
}

/** 管理端 RBAC API（路径前缀: /api/admin/rbac） */
export const rbacAdminApi = {
  // ============ 角色相关 ============

  /** 获取角色列表（扁平列表） */
  getRoles: () => http.get<RbacRole[]>('/admin/rbac/roles'),

  // ============ 角色权限相关 ============

  /** 获取角色权限编码列表 */
  getRolePermissions: (roleId: string) =>
    http.get<string[]>(`/admin/rbac/roles/${roleId}/permissions`),

  /** 检查角色是否拥有指定权限 */
  checkPermission: (roleId: string, permissionCode: string) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check`, {
      permissionCode,
    }),

  /** 检查角色是否拥有任一权限 */
  checkAnyPermission: (roleId: string, permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check-any`, {
      permissionCodes,
    }),

  /** 检查角色是否拥有所有权限 */
  checkAllPermissions: (roleId: string, permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check-all`, {
      permissionCodes,
    }),

  // ============ 角色菜单相关 ============

  /** 获取角色菜单列表（平铺） */
  getRoleMenus: (roleId: string) => http.get<MenuTree[]>(`/admin/rbac/roles/${roleId}/menus`),

  /** 获取角色菜单树 */
  getRoleMenuTree: (roleId: string) =>
    http.get<MenuTree[]>(`/admin/rbac/roles/${roleId}/menus/tree`),

  // ============ 角色数据权限相关 ============

  /** 获取角色数据权限规则列表 */
  getRoleScopes: (roleId: string) => http.get<ScopeRule[]>(`/admin/rbac/roles/${roleId}/scopes`),

  /** 获取角色SSQL过滤规则 */
  getRoleSsqlRules: (roleId: string, tableName: string) =>
    http.get<string[]>(`/admin/rbac/roles/${roleId}/scopes/ssql`, { tableName }),

  // ============ 用户相关 ============

  /** 获取用户权限信息 */
  getUserPermissionInfo: (userId: number) =>
    http.get<UserPermissionInfo>(`/admin/rbac/users/${userId}/info`),

  /** 检查用户是否拥有指定权限 */
  checkUserPermission: (userId: number, permissionCode: string) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/users/${userId}/permissions/check`, {
      permissionCode,
    }),

  /** 检查用户是否拥有任一权限 */
  checkUserAnyPermission: (userId: number, permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/users/${userId}/permissions/check-any`, {
      permissionCodes,
    }),

  /** 获取用户菜单树 */
  getUserMenuTree: (userId: number) =>
    http.get<MenuTree[]>(`/admin/rbac/users/${userId}/menus/tree`),

  /** 获取用户对指定表的数据权限 */
  getUserScopesForTable: (userId: number, tableName: string) =>
    http.get<string[]>(`/admin/rbac/users/${userId}/scopes/table`, { tableName }),

  // ============ 缓存管理 ============

  /** 获取缓存状态 */
  getCacheStatus: () => http.get<RbacCacheStatus>('/admin/rbac/cache/status'),

  /** 刷新缓存 */
  reloadCache: () => http.post<void>('/admin/rbac/cache/reload'),
}

/** 客户端 RBAC API */
export const rbacApi = {
  /** 获取当前用户权限编码列表 */
  getMyPermissions: () => http.get<string[]>('/rbac/my/permissions'),

  /** 获取当前用户菜单树 */
  getMyMenuTree: () => http.get<MenuTree[]>('/rbac/my/menus/tree'),

  /** 检查当前用户是否拥有指定权限 */
  checkMyPermission: (permissionCode: string) =>
    http.post<{ hasPermission: boolean }>('/rbac/my/permissions/check', { permissionCode }),

  /** 检查当前用户是否拥有任一权限 */
  checkMyAnyPermission: (permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>('/rbac/my/permissions/check-any', { permissionCodes }),
}
