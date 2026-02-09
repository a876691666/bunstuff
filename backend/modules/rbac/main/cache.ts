/**
 * RBAC 缓存管理器
 *
 * 设计原则：
 * 1. 完备性：缓存所有 RBAC 相关数据（角色、权限、菜单、关联关系）
 * 2. 简洁性：单一数据源，统一的缓存结构
 * 3. 易用性：提供简单的 API 进行查询和更新
 * 4. 一致性：任何数据变更自动触发缓存更新
 *
 * 权限继承模式：向上汇聚
 * - 父角色权限 = 自身权限 ∪ 所有子角色权限
 * - 越靠近根节点的角色，权限越多
 */

import { where } from '@pkg/ssql'
import type { Row } from '@/packages/orm'
import Role from '@/models/role'
import Permission from '@/models/permission'
import PermissionScope from '@/models/permission-scope'
import RolePermission from '@/models/role-permission'
import RoleMenu from '@/models/role-menu'
import Menu from '@/models/menu'

type PermissionScopeRow = Row<typeof PermissionScope>

// ============ 缓存数据结构 ============

/** 角色缓存数据 */
export interface CachedRole extends Row<typeof Role> {
  /** 直接子角色ID列表 */
  childIds: number[]
  /** 所有后代角色ID列表（递归） */
  descendantIds: number[]
  /** 祖先角色ID链（从父到根） */
  ancestorIds: number[]
  /** 直接权限ID列表（该角色自身配置的权限） */
  permissionIds: number[]
  /** 汇聚的所有权限ID列表（自身 + 所有后代角色的权限） */
  allPermissionIds: number[]
  /** 直接菜单ID列表（该角色自身配置的菜单） */
  menuIds: number[]
  /** 汇聚的所有菜单ID列表（自身 + 所有后代角色的菜单） */
  allMenuIds: number[]
}

/** 权限缓存数据 */
export interface CachedPermission extends Row<typeof Permission> {
  /** 关联的数据过滤规则 */
  scopes: Row<typeof PermissionScope>[]
}

/** 缓存状态 */
interface CacheState {
  /** 是否已初始化 */
  initialized: boolean
  /** 最后更新时间 */
  lastUpdated: Date | null
  /** 角色缓存 (roleId -> CachedRole) */
  roles: Map<number, CachedRole>
  /** 角色编码索引 (code -> roleId) */
  roleCodeIndex: Map<string, number>
  /** 权限缓存 (permissionId -> CachedPermission) */
  permissions: Map<number, CachedPermission>
  /** 权限编码索引 (code -> permissionId) */
  permissionCodeIndex: Map<string, number>
  /** 菜单缓存 (menuId -> Row<typeof Menu>) */
  menus: Map<number, Row<typeof Menu>>
  /** 数据过滤规则缓存 (tableName -> scopes[]) */
  scopesByTable: Map<string, Row<typeof PermissionScope>[]>
}

/** 缓存管理器 */
class RbacCache {
  private state: CacheState = {
    initialized: false,
    lastUpdated: null,
    roles: new Map(),
    roleCodeIndex: new Map(),
    permissions: new Map(),
    permissionCodeIndex: new Map(),
    menus: new Map(),
    scopesByTable: new Map(),
  }

  // ============ 初始化 ============

  /** 初始化缓存（加载所有数据） */
  async init(): Promise<void> {
    await this.reload()
  }

  /** 重新加载所有缓存数据 */
  async reload(): Promise<void> {
    console.log('[RbacCache] 开始加载缓存...')
    const startTime = Date.now()

    // 1. 加载原始数据
    const [roles, permissions, scopes, rolePermissions, roleMenus, menus] = await Promise.all([
      Role.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] }),
      Permission.findMany({}),
      PermissionScope.findMany({}),
      RolePermission.findMany({}),
      RoleMenu.findMany({}),
      Menu.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] }),
    ])

    // 2. 构建索引
    const rolePermissionMap = new Map<number, number[]>() // roleId -> permissionIds
    const roleMenuMap = new Map<number, number[]>() // roleId -> menuIds
    const permissionScopeMap = new Map<number, PermissionScopeRow[]>() // permissionId -> scopes

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

    // 3. 构建角色树关系
    const roleMap = new Map<number, Row<typeof Role>>()
    const childrenMap = new Map<number, number[]>() // parentId -> childIds

    for (const role of roles) {
      roleMap.set(role.id, role)
      if (role.parentId !== null) {
        const children = childrenMap.get(role.parentId) || []
        children.push(role.id)
        childrenMap.set(role.parentId, children)
      }
    }

    // 4. 计算每个角色的祖先和后代
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

    // 5. 构建缓存数据
    this.state.roles.clear()
    this.state.roleCodeIndex.clear()
    this.state.permissions.clear()
    this.state.permissionCodeIndex.clear()
    this.state.menus.clear()
    this.state.scopesByTable.clear()

    // 缓存角色 - 向上汇聚模式
    // 需要从叶子节点开始处理，确保子角色先被处理

    // 获取所有角色的后代权限和菜单（递归汇聚）
    const getDescendantPermissionIds = (roleId: number): number[] => {
      const result = new Set<number>()
      // 自身权限
      const selfPermIds = rolePermissionMap.get(roleId) || []
      selfPermIds.forEach((id) => result.add(id))
      // 所有后代的权限
      const descendants = getDescendantIds(roleId)
      for (const descId of descendants) {
        const descPermIds = rolePermissionMap.get(descId) || []
        descPermIds.forEach((id) => result.add(id))
      }
      return Array.from(result)
    }

    const getDescendantMenuIds = (roleId: number): number[] => {
      const result = new Set<number>()
      // 自身菜单
      const selfMenuIds = roleMenuMap.get(roleId) || []
      selfMenuIds.forEach((id) => result.add(id))
      // 所有后代的菜单
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

      // 计算汇聚的权限（自身 + 所有后代角色的权限）
      const allPermissionIds = getDescendantPermissionIds(role.id)

      // 计算汇聚的菜单（自身 + 所有后代角色的菜单）
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

      this.state.roles.set(role.id, cachedRole)
      this.state.roleCodeIndex.set(role.code, role.id)
    }

    // 缓存权限
    for (const perm of permissions) {
      const cachedPerm: CachedPermission = {
        ...perm,
        scopes: permissionScopeMap.get(perm.id) || [],
      }
      this.state.permissions.set(perm.id, cachedPerm)
      this.state.permissionCodeIndex.set(perm.code, perm.id)
    }

    // 缓存菜单
    for (const menu of menus) {
      this.state.menus.set(menu.id, menu)
    }

    // 按表名缓存数据过滤规则
    for (const scope of scopes) {
      const list = this.state.scopesByTable.get(scope.tableName) || []
      list.push(scope)
      this.state.scopesByTable.set(scope.tableName, list)
    }

    this.state.initialized = true
    this.state.lastUpdated = new Date()

    const elapsed = Date.now() - startTime
    console.log(`[RbacCache] 缓存加载完成，耗时 ${elapsed}ms`)
    console.log(
      `[RbacCache] 角色: ${roles.length}, 权限: ${permissions.length}, 菜单: ${menus.length}`,
    )
  }

  /** 确保缓存已初始化 */
  private ensureInitialized(): void {
    if (!this.state.initialized) {
      throw new Error('[RbacCache] 缓存未初始化，请先调用 init()')
    }
  }

  // ============ 查询 API ============

  /** 获取角色 */
  getRole(roleId: number): CachedRole | undefined {
    this.ensureInitialized()
    return this.state.roles.get(roleId)
  }

  /** 通过编码获取角色 */
  getRoleByCode(code: string): CachedRole | undefined {
    this.ensureInitialized()
    const roleId = this.state.roleCodeIndex.get(code)
    return roleId !== undefined ? this.state.roles.get(roleId) : undefined
  }

  /** 获取所有角色 */
  getAllRoles(): CachedRole[] {
    this.ensureInitialized()
    return Array.from(this.state.roles.values())
  }

  /** 获取权限 */
  getPermission(permissionId: number): CachedPermission | undefined {
    this.ensureInitialized()
    return this.state.permissions.get(permissionId)
  }

  /** 通过编码获取权限 */
  getPermissionByCode(code: string): CachedPermission | undefined {
    this.ensureInitialized()
    const permId = this.state.permissionCodeIndex.get(code)
    return permId !== undefined ? this.state.permissions.get(permId) : undefined
  }

  /** 获取所有权限 */
  getAllPermissions(): CachedPermission[] {
    this.ensureInitialized()
    return Array.from(this.state.permissions.values())
  }

  /** 获取菜单 */
  getMenu(menuId: number): Row<typeof Menu> | undefined {
    this.ensureInitialized()
    return this.state.menus.get(menuId)
  }

  /** 获取所有菜单 */
  getAllMenus(): Row<typeof Menu>[] {
    this.ensureInitialized()
    return Array.from(this.state.menus.values())
  }

  /** 获取表的数据过滤规则 */
  getScopesByTable(tableName: string): Row<typeof PermissionScope>[] {
    this.ensureInitialized()
    return this.state.scopesByTable.get(tableName) || []
  }

  // ============ 角色相关查询 ============

  /** 获取角色的祖先链 */
  getRoleAncestors(roleId: number): CachedRole[] {
    const role = this.getRole(roleId)
    if (!role) return []
    return role.ancestorIds.map((id) => this.state.roles.get(id)!).filter(Boolean)
  }

  /** 获取角色的所有权限 */
  getRolePermissions(roleId: number): CachedPermission[] {
    const role = this.getRole(roleId)
    if (!role) return []
    return role.allPermissionIds.map((id) => this.state.permissions.get(id)!).filter(Boolean)
  }

  /** 获取角色的权限编码集合 */
  getRolePermissionCodes(roleId: number): Set<string> {
    const permissions = this.getRolePermissions(roleId)
    return new Set(permissions.map((p) => p.code))
  }

  /** 检查角色是否有权限 */
  roleHasPermission(roleId: number, permissionCode: string): boolean {
    const codes = this.getRolePermissionCodes(roleId)
    return codes.has(permissionCode)
  }

  /** 检查角色是否有任一权限 */
  roleHasAnyPermission(roleId: number, permissionCodes: string[]): boolean {
    const codes = this.getRolePermissionCodes(roleId)
    return permissionCodes.some((code) => codes.has(code))
  }

  /** 检查角色是否有所有权限 */
  roleHasAllPermissions(roleId: number, permissionCodes: string[]): boolean {
    const codes = this.getRolePermissionCodes(roleId)
    return permissionCodes.every((code) => codes.has(code))
  }

  /** 获取角色的所有菜单 */
  getRoleMenus(roleId: number): Row<typeof Menu>[] {
    const role = this.getRole(roleId)
    if (!role) return []
    return role.allMenuIds
      .map((id) => this.state.menus.get(id)!)
      .filter((m) => m && m.status === 1)
      .sort((a, b) => a.sort - b.sort)
  }

  /** 获取角色的数据过滤规则（按表名分组） */
  getRoleScopes(roleId: number): Map<string, Row<typeof PermissionScope>[]> {
    const permissions = this.getRolePermissions(roleId)
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

  /** 获取角色中指定权限编码的数据过滤规则（按表名分组） */
  getRoleScopesByPermissions(roleId: number, permissionCodes: string[]): Map<string, Row<typeof PermissionScope>[]> {
    const permissions = this.getRolePermissions(roleId)
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

  /** 获取角色对指定表的 SSQL 规则 */
  getRoleSsqlRules(roleId: number, tableName: string): string[] {
    const scopes = this.getRoleScopes(roleId)
    const tableScopes = scopes.get(tableName) || []
    return tableScopes.map((s) => s.ssqlRule)
  }

  // ============ 缓存更新 API ============

  /** 标记需要更新（下次查询前会重新加载） */
  invalidate(): void {
    // 简单策略：直接重新加载
    this.reload()
  }

  /** 更新角色相关数据 */
  async invalidateRoles(): Promise<void> {
    await this.reload()
  }

  /** 更新权限相关数据 */
  async invalidatePermissions(): Promise<void> {
    await this.reload()
  }

  /** 更新菜单相关数据 */
  async invalidateMenus(): Promise<void> {
    await this.reload()
  }

  // ============ 状态查询 ============

  /** 获取缓存状态 */
  getStatus() {
    return {
      initialized: this.state.initialized,
      lastUpdated: this.state.lastUpdated?.toISOString() ?? '',
      roleCount: this.state.roles.size,
      permissionCount: this.state.permissions.size,
      menuCount: this.state.menus.size,
      scopeCount: this.state.scopesByTable.size,
    }
  }
}

// 单例导出
export const rbacCache = new RbacCache()
