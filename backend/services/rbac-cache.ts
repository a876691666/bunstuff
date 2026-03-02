/**
 * RBAC 缓存管理器
 * 从 modules/rbac/main/cache.ts 迁移
 */

import type { Row } from '@/packages/orm'
import { model } from '@/core/model'

const Role = model.role
const Permission = model.permission
const PermissionScope = model.permission_scope
const RolePermission = model.role_permission
const RoleMenu = model.role_menu
const Menu = model.menu

type PermissionScopeRow = Row<typeof PermissionScope>

// ============ 缓存数据结构 ============

export interface CachedRole extends Row<typeof Role> {
  childIds: number[]
  descendantIds: number[]
  ancestorIds: number[]
  permissionIds: number[]
  allPermissionIds: number[]
  menuIds: number[]
  allMenuIds: number[]
}

export interface CachedPermission extends Row<typeof Permission> {
  scopes: Row<typeof PermissionScope>[]
}

interface CacheState {
  initialized: boolean
  lastUpdated: Date | null
  roles: Map<number, CachedRole>
  roleCodeIndex: Map<string, number>
  permissions: Map<number, CachedPermission>
  permissionCodeIndex: Map<string, number>
  menus: Map<number, Row<typeof Menu>>
  scopesByTable: Map<string, Row<typeof PermissionScope>[]>
}

// ============ 内部状态 ============

const state: CacheState = {
  initialized: false,
  lastUpdated: null,
  roles: new Map(),
  roleCodeIndex: new Map(),
  permissions: new Map(),
  permissionCodeIndex: new Map(),
  menus: new Map(),
  scopesByTable: new Map(),
}

function ensureInitialized(): void {
  if (!state.initialized) {
    throw new Error('[RbacCache] 缓存未初始化，请先调用 init()')
  }
}

// ============ 初始化 ============

export async function init(): Promise<void> {
  await reload()
}

export async function reload(): Promise<void> {
  console.log('[RbacCache] 开始加载缓存...')
  const startTime = Date.now()

  const [roles, permissions, scopes, rolePermissions, roleMenus, menus] = await Promise.all([
    Role.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] }),
    Permission.findMany({}),
    PermissionScope.findMany({}),
    RolePermission.findMany({}),
    RoleMenu.findMany({}),
    Menu.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] }),
  ])

  const rolePermissionMap = new Map<number, number[]>()
  const roleMenuMap = new Map<number, number[]>()
  const permissionScopeMap = new Map<number, PermissionScopeRow[]>()

  for (const rp of rolePermissions) {
    const ids = rolePermissionMap.get(rp.roleId) || []
    ids.push(rp.permissionId)
    rolePermissionMap.set(rp.roleId, ids)
  }

  for (const rm of roleMenus) {
    const ids = roleMenuMap.get(rm.roleId) || []
    ids.push(rm.menuId)
    roleMenuMap.set(rm.roleId, ids)
  }

  for (const scope of scopes) {
    const list = permissionScopeMap.get(scope.permissionId) || []
    list.push(scope)
    permissionScopeMap.set(scope.permissionId, list)
  }

  const roleMap = new Map<number, Row<typeof Role>>()
  const childrenMap = new Map<number, number[]>()

  for (const role of roles) {
    roleMap.set(role.id, role)
    if (role.parentId !== null) {
      const children = childrenMap.get(role.parentId) || []
      children.push(role.id)
      childrenMap.set(role.parentId, children)
    }
  }

  const getAncestorIds = (roleId: number): number[] => {
    const ancestors: number[] = []
    let current = roleMap.get(roleId)
    while (current?.parentId !== null && current?.parentId !== undefined) {
      ancestors.push(current.parentId)
      current = roleMap.get(current.parentId)
    }
    return ancestors
  }

  const getDescendantIds = (roleId: number): number[] => {
    const descendants: number[] = []
    const queue = childrenMap.get(roleId) || []
    const visited = new Set<number>()
    while (queue.length > 0) {
      const id = queue.shift()!
      if (visited.has(id)) continue
      visited.add(id)
      descendants.push(id)
      const children = childrenMap.get(id) || []
      queue.push(...children)
    }
    return descendants
  }

  state.roles.clear()
  state.roleCodeIndex.clear()
  state.permissions.clear()
  state.permissionCodeIndex.clear()
  state.menus.clear()
  state.scopesByTable.clear()

  const getDescendantPermissionIds = (roleId: number): number[] => {
    const result = new Set<number>()
    const selfPermIds = rolePermissionMap.get(roleId) || []
    selfPermIds.forEach((id) => result.add(id))
    const descendants = getDescendantIds(roleId)
    for (const descId of descendants) {
      const descPermIds = rolePermissionMap.get(descId) || []
      descPermIds.forEach((id) => result.add(id))
    }
    return Array.from(result)
  }

  const getDescendantMenuIds = (roleId: number): number[] => {
    const result = new Set<number>()
    const selfMenuIds = roleMenuMap.get(roleId) || []
    selfMenuIds.forEach((id) => result.add(id))
    const descendants = getDescendantIds(roleId)
    for (const descId of descendants) {
      const descMenuIds = roleMenuMap.get(descId) || []
      descMenuIds.forEach((id) => result.add(id))
    }
    return Array.from(result)
  }

  for (const role of roles) {
    const ancestorIds = getAncestorIds(role.id)
    const permissionIds = rolePermissionMap.get(role.id) || []
    const menuIds = roleMenuMap.get(role.id) || []
    const allPermissionIds = getDescendantPermissionIds(role.id)
    const allMenuIds = getDescendantMenuIds(role.id)

    const cachedRole: CachedRole = {
      ...role,
      childIds: childrenMap.get(role.id) || [],
      descendantIds: getDescendantIds(role.id),
      ancestorIds,
      permissionIds,
      allPermissionIds,
      menuIds,
      allMenuIds,
    }

    state.roles.set(role.id, cachedRole)
    state.roleCodeIndex.set(role.code, role.id)
  }

  for (const perm of permissions) {
    const cachedPerm: CachedPermission = {
      ...perm,
      scopes: permissionScopeMap.get(perm.id) || [],
    }
    state.permissions.set(perm.id, cachedPerm)
    state.permissionCodeIndex.set(perm.code, perm.id)
  }

  for (const menu of menus) {
    state.menus.set(menu.id, menu)
  }

  for (const scope of scopes) {
    const list = state.scopesByTable.get(scope.tableName) || []
    list.push(scope)
    state.scopesByTable.set(scope.tableName, list)
  }

  state.initialized = true
  state.lastUpdated = new Date()

  const elapsed = Date.now() - startTime
  console.log(`[RbacCache] 缓存加载完成，耗时 ${elapsed}ms`)
  console.log(
    `[RbacCache] 角色: ${roles.length}, 权限: ${permissions.length}, 菜单: ${menus.length}`,
  )
}

// ============ 查询 API ============

export function getRole(roleId: number): CachedRole | undefined {
  ensureInitialized()
  return state.roles.get(roleId)
}

export function getRoleByCode(code: string): CachedRole | undefined {
  ensureInitialized()
  const roleId = state.roleCodeIndex.get(code)
  return roleId !== undefined ? state.roles.get(roleId) : undefined
}

export function getAllRoles(): CachedRole[] {
  ensureInitialized()
  return Array.from(state.roles.values())
}

export function getPermission(permissionId: number): CachedPermission | undefined {
  ensureInitialized()
  return state.permissions.get(permissionId)
}

export function getPermissionByCode(code: string): CachedPermission | undefined {
  ensureInitialized()
  const permId = state.permissionCodeIndex.get(code)
  return permId !== undefined ? state.permissions.get(permId) : undefined
}

export function getAllPermissions(): CachedPermission[] {
  ensureInitialized()
  return Array.from(state.permissions.values())
}

export function getMenu(menuId: number): Row<typeof Menu> | undefined {
  ensureInitialized()
  return state.menus.get(menuId)
}

export function getAllMenus(): Row<typeof Menu>[] {
  ensureInitialized()
  return Array.from(state.menus.values())
}

export function getScopesByTable(tableName: string): Row<typeof PermissionScope>[] {
  ensureInitialized()
  return state.scopesByTable.get(tableName) || []
}

// ============ 角色相关查询 ============

export function getRoleAncestors(roleId: number): CachedRole[] {
  const role = getRole(roleId)
  if (!role) return []
  return role.ancestorIds.map((id) => state.roles.get(id)!).filter(Boolean)
}

export function getRolePermissions(roleId: number): CachedPermission[] {
  const role = getRole(roleId)
  if (!role) return []
  return role.allPermissionIds.map((id) => state.permissions.get(id)!).filter(Boolean)
}

export function getRolePermissionCodes(roleId: number): Set<string> {
  const permissions = getRolePermissions(roleId)
  return new Set(permissions.map((p) => p.code))
}

export function roleHasPermission(roleId: number, permissionCode: string): boolean {
  const codes = getRolePermissionCodes(roleId)
  return codes.has(permissionCode)
}

export function roleHasAnyPermission(roleId: number, permissionCodes: string[]): boolean {
  const codes = getRolePermissionCodes(roleId)
  return permissionCodes.some((code) => codes.has(code))
}

export function roleHasAllPermissions(roleId: number, permissionCodes: string[]): boolean {
  const codes = getRolePermissionCodes(roleId)
  return permissionCodes.every((code) => codes.has(code))
}

export function getRoleMenus(roleId: number): Row<typeof Menu>[] {
  const role = getRole(roleId)
  if (!role) return []
  return role.allMenuIds
    .map((id) => state.menus.get(id)!)
    .filter((m) => m && m.status === 1)
    .sort((a, b) => a.sort - b.sort)
}

export function getRoleScopes(roleId: number): Map<string, Row<typeof PermissionScope>[]> {
  const permissions = getRolePermissions(roleId)
  const scopeMap = new Map<string, Row<typeof PermissionScope>[]>()
  for (const perm of permissions) {
    for (const scope of perm.scopes) {
      const list = scopeMap.get(scope.tableName) || []
      list.push(scope)
      scopeMap.set(scope.tableName, list)
    }
  }
  return scopeMap
}

export function getRoleScopesByPermissions(
  roleId: number,
  permissionCodes: string[],
): Map<string, Row<typeof PermissionScope>[]> {
  const permissions = getRolePermissions(roleId)
  const codeSet = new Set(permissionCodes)
  const scopeMap = new Map<string, Row<typeof PermissionScope>[]>()
  for (const perm of permissions) {
    if (!codeSet.has(perm.code)) continue
    for (const scope of perm.scopes) {
      const list = scopeMap.get(scope.tableName) || []
      list.push(scope)
      scopeMap.set(scope.tableName, list)
    }
  }
  return scopeMap
}

export function getRoleSsqlRules(roleId: number, tableName: string): string[] {
  const scopes = getRoleScopes(roleId)
  const tableScopes = scopes.get(tableName) || []
  return tableScopes.map((s) => s.ssqlRule)
}

// ============ 状态查询 ============

export function getStatus() {
  return {
    initialized: state.initialized,
    lastUpdated: state.lastUpdated?.toISOString() ?? '',
    roleCount: state.roles.size,
    permissionCount: state.permissions.size,
    menuCount: state.menus.size,
    scopeCount: state.scopesByTable.size,
  }
}
