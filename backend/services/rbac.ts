import { type ResolvedMenu } from '@/core/policy'
import { model } from '@/core/model'
import * as casbin from '@/services/casbin'
import * as rbacCache from '@/services/rbac-cache'
import type { CachedRole } from '@/services/rbac-cache'

const User = model.users

type MenuRow = ResolvedMenu

/** 用户权限信息（简化版，无继承） */
export interface UserPermissionInfo {
  userId: number
  role: CachedRole | null
  permissionCodes: string[]
  menus: MenuRow[]
  menuTree: MenuTreeNode[]
  scopes: Array<{ table: string; permission: string; rule: string }>
}

/** 菜单树节点 */
export interface MenuTreeNode extends ResolvedMenu {
  children: MenuTreeNode[]
}

// ============ 初始化 ============

export async function init(): Promise<void> {
  await rbacCache.init()
}

// ============ 角色相关 ============

export function getRole(roleId: string): CachedRole | undefined {
  return rbacCache.getRole(roleId)
}

export function getRoleByCode(code: string): CachedRole | undefined {
  return rbacCache.getRoleByCode(code)
}

export function getAllRoles(): CachedRole[] {
  return rbacCache.getAllRoles()
}

// ============ 权限相关 (委托 Casbin) ============

export async function hasPermission(roleCode: string, permissionCode: string): Promise<boolean> {
  return casbin.enforce(roleCode, permissionCode)
}

export async function hasAnyPermission(
  roleCode: string,
  permissionCodes: string[],
): Promise<boolean> {
  return casbin.hasAnyPermission(roleCode, permissionCodes)
}

export async function hasAllPermissions(
  roleCode: string,
  permissionCodes: string[],
): Promise<boolean> {
  return casbin.hasAllPermissions(roleCode, permissionCodes)
}

export async function getRolePermissionCodes(roleCode: string): Promise<string[]> {
  return casbin.getRolePermissionCodes(roleCode)
}

// ============ 菜单相关 ============

export async function getRoleMenus(roleCode: string): Promise<MenuRow[]> {
  return rbacCache.getRoleMenus(roleCode)
}

export async function getRoleMenuTree(roleCode: string): Promise<MenuTreeNode[]> {
  const menus = await getRoleMenus(roleCode)
  return buildMenuTree(menus)
}

// ============ 数据权限相关 (委托 Casbin) ============

export async function getRoleScopes(roleCode: string): Promise<Array<{ table: string; permission: string; rule: string }>> {
  return casbin.getRoleScopes(roleCode)
}

export async function getRoleSsqlRules(roleCode: string, tableName: string, permCode?: string): Promise<string[]> {
  return casbin.getRoleSsqlRules(roleCode, tableName, permCode)
}

// ============ 用户相关 ============

export async function getUserPermissionInfo(userId: number): Promise<UserPermissionInfo | null> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return null

  const role = rbacCache.getRole(user.roleId) || null
  if (!role) return { userId, role: null, permissionCodes: [], menus: [], menuTree: [], scopes: [] }

  const permissionCodes = await casbin.getRolePermissionCodes(user.roleId)
  const menus = await rbacCache.getRoleMenus(user.roleId)
  const menuTree = buildMenuTree(menus)
  const scopes = await casbin.getRoleScopes(user.roleId)

  return { userId, role, permissionCodes, menus, menuTree, scopes }
}

export async function userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return false
  if (!rbacCache.getRole(user.roleId)) return false
  return casbin.enforce(user.roleId, permissionCode)
}

export async function userHasAnyPermission(
  userId: number,
  permissionCodes: string[],
): Promise<boolean> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return false
  if (!rbacCache.getRole(user.roleId)) return false
  return casbin.hasAnyPermission(user.roleId, permissionCodes)
}

export async function getUserMenuTree(userId: number): Promise<MenuTreeNode[]> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return []
  if (!rbacCache.getRole(user.roleId)) return []
  return getRoleMenuTree(user.roleId)
}

export async function getUserScopesForTable(
  userId: number,
  tableName: string,
  permCode?: string,
): Promise<string[]> {
  const user = await User.findOne({ where: `id = ${userId}` })
  if (!user) return []
  if (!rbacCache.getRole(user.roleId)) return []
  return casbin.getRoleSsqlRules(user.roleId, tableName, permCode)
}

// ============ 缓存管理 ============

export async function getCacheStatus() {
  return rbacCache.getStatus()
}

export async function reloadCache(): Promise<void> {
  await rbacCache.reload()
}

// ============ 工具方法 ============

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

  // 递归过滤掉没有子菜单的目录节点（type === 1）
  const filterEmptyDirs = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
    return nodes
      .map((node) => ({
        ...node,
        children: filterEmptyDirs(node.children),
      }))
      .filter((node) => node.type !== 1 || node.children.length > 0)
  }

  return filterEmptyDirs(sortNodes(roots))
}
