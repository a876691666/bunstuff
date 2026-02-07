/**
 * RBAC 服务
 *
 * 所有查询都通过缓存进行，提供高性能的权限查询
 */

import type { Row } from '@/packages/orm'
import User from '@/models/users'
import Menu from '@/models/menu'
import PermissionScope from '@/models/permission-scope'
import { rbacCache, type CachedRole, type CachedPermission } from './cache'

/** 用户权限信息 */
export interface UserPermissionInfo {
  /** 用户ID */
  userId: number
  /** 角色信息 */
  role: CachedRole | null
  /** 角色链（从当前角色到根角色） */
  roleChain: CachedRole[]
  /** 权限列表 */
  permissions: CachedPermission[]
  /** 权限编码集合 */
  permissionCodes: Set<string>
  /** 菜单列表 */
  menus: Row<typeof Menu>[]
  /** 菜单树 */
  menuTree: MenuTreeNode[]
  /** 数据过滤规则（按表名分组） */
  scopes: Map<string, Row<typeof PermissionScope>[]>
}

/** 菜单树节点 */
export interface MenuTreeNode extends Row<typeof Menu> {
  children: MenuTreeNode[]
}

/** RBAC 服务 - 基于缓存的高性能权限查询 */
export class RbacService {
  // ============ 初始化 ============

  /** 初始化 RBAC 服务（加载缓存） */
  async init(): Promise<void> {
    await rbacCache.init()
  }

  // ============ 角色相关 ============

  /** 获取角色 */
  getRole(roleId: number): CachedRole | undefined {
    return rbacCache.getRole(roleId)
  }

  /** 通过编码获取角色 */
  getRoleByCode(code: string): CachedRole | undefined {
    return rbacCache.getRoleByCode(code)
  }

  /** 获取角色的完整父级链（从当前角色到根角色） */
  getRoleChain(roleId: number): CachedRole[] {
    const role = rbacCache.getRole(roleId)
    if (!role) return []
    return [role, ...rbacCache.getRoleAncestors(roleId)]
  }

  /** 获取角色的所有子角色ID（递归） */
  getChildRoleIds(roleId: number): number[] {
    const role = rbacCache.getRole(roleId)
    return role?.descendantIds || []
  }

  /** 获取角色树 */
  getRoleTree(): (CachedRole & { children: any[] })[] {
    const roles = rbacCache.getAllRoles()
    return this.buildTree(roles)
  }

  // ============ 权限相关 ============

  /** 获取角色的所有权限ID */
  getRolePermissionIds(roleId: number): number[] {
    const role = rbacCache.getRole(roleId)
    return role?.allPermissionIds || []
  }

  /** 获取角色的所有权限 */
  getRolePermissions(roleId: number): CachedPermission[] {
    return rbacCache.getRolePermissions(roleId)
  }

  /** 检查角色是否拥有指定权限 */
  hasPermission(roleId: number, permissionCode: string): boolean {
    return rbacCache.roleHasPermission(roleId, permissionCode)
  }

  /** 检查角色是否拥有任一权限 */
  hasAnyPermission(roleId: number, permissionCodes: string[]): boolean {
    return rbacCache.roleHasAnyPermission(roleId, permissionCodes)
  }

  /** 检查角色是否拥有所有权限 */
  hasAllPermissions(roleId: number, permissionCodes: string[]): boolean {
    return rbacCache.roleHasAllPermissions(roleId, permissionCodes)
  }

  // ============ 菜单相关 ============

  /** 获取角色的所有菜单ID */
  getRoleMenuIds(roleId: number): number[] {
    const role = rbacCache.getRole(roleId)
    return role?.allMenuIds || []
  }

  /** 获取角色的所有菜单 */
  getRoleMenus(roleId: number): MenuRow[] {
    return rbacCache.getRoleMenus(roleId)
  }

  /** 获取角色的菜单树 */
  getRoleMenuTree(roleId: number): MenuTreeNode[] {
    const menus = this.getRoleMenus(roleId)
    return this.buildMenuTree(menus)
  }

  // ============ 数据权限相关 ============

  /** 获取权限的数据过滤规则 */
  getPermissionScopes(permissionId: number): PermissionScopeRow[] {
    const perm = rbacCache.getPermission(permissionId)
    return perm?.scopes || []
  }

  /** 获取角色的所有数据过滤规则（按表名分组） */
  getRoleScopes(roleId: number): Map<string, PermissionScopeRow[]> {
    return rbacCache.getRoleScopes(roleId)
  }

  /** 获取角色对指定表的数据过滤规则 */
  getRoleScopesForTable(roleId: number, tableName: string): PermissionScopeRow[] {
    const scopes = this.getRoleScopes(roleId)
    return scopes.get(tableName) || []
  }

  /** 获取角色对指定表的 SSQL 过滤表达式列表 */
  getRoleSsqlRules(roleId: number, tableName: string): string[] {
    return rbacCache.getRoleSsqlRules(roleId, tableName)
  }

  // ============ 用户相关 ============

  /** 获取用户的完整权限信息 */
  async getUserPermissionInfo(userId: number): Promise<UserPermissionInfo | null> {
    const user = await User.findOne({ where: `id = ${userId}` })
    if (!user) return null

    const roleId = user.roleId
    const role = rbacCache.getRole(roleId) || null
    const roleChain = this.getRoleChain(roleId)
    const permissions = this.getRolePermissions(roleId)
    const permissionCodes = new Set(permissions.map((p) => p.code))
    const menus = this.getRoleMenus(roleId)
    const menuTree = this.buildMenuTree(menus)
    const scopes = this.getRoleScopes(roleId)

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

  /** 检查用户是否拥有指定权限 */
  async userHasPermission(userId: number, permissionCode: string): Promise<boolean> {
    const user = await User.findOne({ where: `id = ${userId}` })
    if (!user) return false
    return this.hasPermission(user.roleId, permissionCode)
  }

  /** 检查用户是否拥有任一权限 */
  async userHasAnyPermission(userId: number, permissionCodes: string[]): Promise<boolean> {
    const user = await User.findOne({ where: `id = ${userId}` })
    if (!user) return false
    return this.hasAnyPermission(user.roleId, permissionCodes)
  }

  /** 获取用户的菜单树 */
  async getUserMenuTree(userId: number): Promise<MenuTreeNode[]> {
    const user = await User.findOne({ where: `id = ${userId}` })
    if (!user) return []
    return this.getRoleMenuTree(user.roleId)
  }

  /** 获取用户对指定表的数据过滤规则 */
  async getUserScopesForTable(userId: number, tableName: string): Promise<PermissionScopeRow[]> {
    const user = await User.findOne({ where: `id = ${userId}` })
    if (!user) return []
    return this.getRoleScopesForTable(user.roleId, tableName)
  }

  // ============ 缓存管理 ============

  /** 获取缓存状态 */
  getCacheStatus() {
    return rbacCache.getStatus()
  }

  /** 重新加载缓存 */
  async reloadCache(): Promise<void> {
    await rbacCache.reload()
  }

  // ============ 工具方法 ============

  /** 构建树形结构 */
  private buildTree<T extends { id: number; parentId: number | null }>(
    items: T[],
    parentId: number | null = null,
  ): (T & { children: any[] })[] {
    return items
      .filter((item) => item.parentId === parentId)
      .map((item) => ({
        ...item,
        children: this.buildTree(items, item.id),
      }))
  }

  /** 构建菜单树 */
  private buildMenuTree(menus: MenuRow[]): MenuTreeNode[] {
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
}

export const rbacService = new RbacService()
