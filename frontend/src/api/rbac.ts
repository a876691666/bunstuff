import { http } from '@/utils'
import type { MenuTree, RbacCacheStatus } from '@/types'

/** 角色权限信息 */
export interface RolePermissionInfo {
  id: number
  name: string
  code: string
  resource: string | null
}

/** 角色链信息 */
export interface RoleChainItem {
  id: number
  name: string
  code: string
  parentId: number | null
}

/** 角色树节点 */
export interface RoleTreeNode {
  id: number
  name: string
  code: string
  parentId: number | null
  permissions: string[]
  children?: RoleTreeNode[]
}

/** 数据权限规则 */
export interface ScopeRule {
  id: number
  tableName: string
  ruleName: string
  ssql: string
  description: string | null
}

/** 用户权限信息 */
export interface UserPermissionInfo {
  userId: number
  roleId: number
  roleName: string
  roleCode: string
  permissionCodes: string[]
  menus: MenuTree[]
  scopes: Record<string, ScopeRule[]>
}

/** 管理端 RBAC API（路径前缀: /api/admin/rbac） */
export const rbacAdminApi = {
  // ============ 角色相关 ============

  /** 获取角色树 */
  getRoleTree: () => http.get<RoleTreeNode[]>('/admin/rbac/roles/tree'),

  /** 获取角色父级链 */
  getRoleChain: (roleId: number) => http.get<RoleChainItem[]>(`/admin/rbac/roles/${roleId}/chain`),

  /** 获取子角色ID列表 */
  getChildRoleIds: (roleId: number) => http.get<number[]>(`/admin/rbac/roles/${roleId}/children`),

  // ============ 角色权限相关 ============

  /** 获取角色权限列表 */
  getRolePermissions: (roleId: number) =>
    http.get<RolePermissionInfo[]>(`/admin/rbac/roles/${roleId}/permissions`),

  /** 检查角色是否拥有指定权限 */
  checkPermission: (roleId: number, permissionCode: string) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check`, {
      permissionCode,
    }),

  /** 检查角色是否拥有任一权限 */
  checkAnyPermission: (roleId: number, permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check-any`, {
      permissionCodes,
    }),

  /** 检查角色是否拥有所有权限 */
  checkAllPermissions: (roleId: number, permissionCodes: string[]) =>
    http.post<{ hasPermission: boolean }>(`/admin/rbac/roles/${roleId}/permissions/check-all`, {
      permissionCodes,
    }),

  // ============ 角色菜单相关 ============

  /** 获取角色菜单列表 */
  getRoleMenus: (roleId: number) => http.get<MenuTree[]>(`/admin/rbac/roles/${roleId}/menus`),

  /** 获取角色菜单树 */
  getRoleMenuTree: (roleId: number) =>
    http.get<MenuTree[]>(`/admin/rbac/roles/${roleId}/menus/tree`),

  // ============ 角色数据权限相关 ============

  /** 获取角色数据权限 */
  getRoleScopes: (roleId: number) =>
    http.get<Record<string, ScopeRule[]>>(`/admin/rbac/roles/${roleId}/scopes`),

  /** 获取角色对指定表的数据权限 */
  getRoleScopesForTable: (roleId: number, tableName: string) =>
    http.get<ScopeRule[]>(`/admin/rbac/roles/${roleId}/scopes/table`, { tableName }),

  /** 获取SSQL过滤规则 */
  getRoleSsqlRules: (roleId: number, tableName: string) =>
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
    http.get<ScopeRule[]>(`/admin/rbac/users/${userId}/scopes/table`, { tableName }),

  // ============ 缓存管理 ============

  /** 获取缓存状态 */
  getCacheStatus: () =>
    http.get<{
      roleCount: number
      permissionCount: number
      menuCount: number
      scopeCount: number
      lastUpdated: string
    }>('/admin/rbac/cache/status'),

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
