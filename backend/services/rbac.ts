/**
 * RBAC 服务 - 基于缓存的高性能权限查询
 * 从 modules/rbac/main/service.ts 迁移
 */

import type { Row } from '@/packages/orm'
import { model } from '@/core/model'
import * as rbacCache from '@/services/rbac-cache'
import type { CachedRole, CachedPermission } from '@/services/rbac-cache'

const User = model.users
const Menu = model.menu
const PermissionScope = model.permission_scope

type MenuRow = Row<typeof Menu>
type PermissionScopeRow = Row<typeof PermissionScope>

/** 用户权限信息 */
export interface UserPermissionInfo {
  userId: number
  role: CachedRole | null
  roleChain: CachedRole[]
  permissions: CachedPermission[]
  permissionCodes: Set<string>
  menus: Row<typeof Menu>[]
  menuTree: MenuTreeNode[]
  scopes: Map<string, Row<typeof PermissionScope>[]>
}

/** 菜单树节点 */
export interface MenuTreeNode extends Row<typeof Menu> {
  children: MenuTreeNode[]
}

// ============ 初始化 ============

export async function init(): Promise<void> {
  await rbacCache.init()
}

// ============ 角色相关 ============

export function getRole(roleId: number): CachedRole | undefined {
  return rbacCache.getRole(roleId)
}

export function getRoleByCode(code: string): CachedRole | undefined {
  return rbacCache.getRoleByCode(code)
}

export function getRoleChain(roleId: number): CachedRole[] {
  const role = rbacCache.getRole(roleId)
  if (!role) return []
  return [role, ...rbacCache.getRoleAncestors(roleId)]
}

export function getChildRoleIds(roleId: number): number[] {
  const role = rbacCache.getRole(roleId)
  return role?.descendantIds || []
}

export function getRoleTree(): (CachedRole & { children: any[] })[] {
  const roles = rbacCache.getAllRoles()
  return buildTree(roles)
}

// ============ 权限相关 ============

export function getRolePermissionIds(roleId: number): number[] {
  const role = rbacCache.getRole(roleId)
  return role?.allPermissionIds || []
}

export function getRolePermissions(roleId: number): CachedPermission[] {
  return rbacCache.getRolePermissions(roleId)
}

export function hasPermission(roleId: number, permissionCode: string): boolean {
  return rbacCache.roleHasPermission(roleId, permissionCode)
}

export function hasAnyPermission(roleId: number, permissionCodes: string[]): boolean {
  return rbacCache.roleHasAnyPermission(roleId, permissionCodes)
}

export function hasAllPermissions(roleId: number, permissionCodes: string[]): boolean {
  return rbacCache.roleHasAllPermissions(roleId, permissionCodes)
}

// ============ 菜单相关 ============

export function getRoleMenuIds(roleId: number): number[] {
  const role = rbacCache.getRole(roleId)
  return role?.allMenuIds || []
}

export function getRoleMenus(roleId: number): MenuRow[] {
  return rbacCache.getRoleMenus(roleId)
}

export function getRoleMenuTree(roleId: number): MenuTreeNode[] {
  const menus = getRoleMenus(roleId)
  return buildMenuTree(menus)
}

// ============ 数据权限相关 ============

export function getPermissionScopes(permissionId: number): PermissionScopeRow[] {
  const perm = rbacCache.getPermission(permissionId)
  return perm?.scopes || []
}

export function getRoleScopes(roleId: number): Map<string, PermissionScopeRow[]> {
  return rbacCache.getRoleScopes(roleId)
}

export function getRoleScopesByPermissions(
  roleId: number,
  permissionCodes: string[],
): Map<string, PermissionScopeRow[]> {
  return rbacCache.getRoleScopesByPermissions(roleId, permissionCodes)
}

export function getRoleScopesForTable(roleId: number, tableName: string): PermissionScopeRow[] {
  const scopes = getRoleScopes(roleId)
  return scopes.get(tableName) || []
}

export function getRoleSsqlRules(roleId: number, tableName: string): string[] {
  return rbacCache.getRoleSsqlRules(roleId, tableName)
}

// ============ 用户相关 ============

export async function getUserPermissionInfo(userId: number): Promise<UserPermissionInfo | null> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return null

  const roleId = user.roleId
  const role = rbacCache.getRole(roleId) || null
  const roleChain = getRoleChain(roleId)
  const permissions = getRolePermissions(roleId)
  const permissionCodes = new Set(permissions.map((p) => p.code))
  const menus = getRoleMenus(roleId)
  const menuTree = buildMenuTree(menus)
  const scopes = getRoleScopes(roleId)

  return {
    userId,
    role,
    roleChain,
    permissions,
    permissionCodes,
    menus,
    menuTree,
    scopes,
  }
}

export async function userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return false
  return hasPermission(user.roleId, permissionCode)
}

export async function userHasAnyPermission(
  userId: number,
  permissionCodes: string[],
): Promise<boolean> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return false
  return hasAnyPermission(user.roleId, permissionCodes)
}

export async function getUserMenuTree(userId: number): Promise<MenuTreeNode[]> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return []
  return getRoleMenuTree(user.roleId)
}

export async function getUserScopesForTable(
  userId: number,
  tableName: string,
): Promise<PermissionScopeRow[]> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return []
  return getRoleScopesForTable(user.roleId, tableName)
}

// ============ 缓存管理 ============

export function getCacheStatus() {
  return rbacCache.getStatus()
}

export async function reloadCache(): Promise<void> {
  await rbacCache.reload()
}

// ============ 工具方法 ============

function buildTree<T extends Record<string, any>>(
  items: T[],
  parentId: number | null = null,
): (T & { children: any[] })[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }))
}

function buildMenuTree(menus: MenuRow[]): MenuTreeNode[] {
  const menuMap = new Map<number, MenuTreeNode>()

  for (const menu of menus) {
    menuMap.set(menu.id, { ...menu, children: [] })
  }

  const roots: MenuTreeNode[] = []

  for (const menu of menus) {
    const node = menuMap.get(menu.id)!
    if (menu.parentId === null || !menuMap.has(menu.parentId)) {
      roots.push(node)
    } else {
      const parent = menuMap.get(menu.parentId)!
      parent.children.push(node)
    }
  }

  const sortNodes = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
    nodes.sort((a, b) => a.sort - b.sort)
    for (const node of nodes) {
      if (node.children.length > 0) {
        sortNodes(node.children)
      }
    }
    return nodes
  }

  return sortNodes(roots)
}
