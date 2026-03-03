/**
 * RBAC 缓存层
 *
 * 委托 Casbin 服务处理权限/数据域策略，
 * 本地缓存角色对象和菜单对象。
 * 菜单从模块配置（config.ts）收集，不再依赖数据库表。
 * 菜单可见性从角色权限编码自动派生（无需 role_menu 表）。
 */

import { model } from '@/core/model'
import { type ResolvedMenu, collectAllMenus } from '@/core/policy'
import { allConfigs } from '@/_generated/configs.generated'
import * as casbin from '@/services/casbin'
import type { Row } from '@/packages/orm'

const Role = model.role

type MenuRow = ResolvedMenu

// ============ 缓存数据结构 ============

export interface CachedRole extends Row<typeof Role> {
  /** 该角色拥有的权限编码列表 (来自 Casbin) */
  permissionCodes: string[]
}

interface CacheState {
  initialized: boolean
  roles: Map<string, CachedRole>
  menus: Map<number, MenuRow>
}

const state: CacheState = {
  initialized: false,
  roles: new Map(),
  menus: new Map(),
}

function ensureInitialized(): void {
  if (!state.initialized) {
    throw new Error('[RbacCache] 缓存未初始化，请先调用 init()')
  }
}

// ============ 初始化 ============

export async function init(): Promise<void> {
  await casbin.init()
  await loadLocalCache()
}

export async function reload(): Promise<void> {
  await casbin.reload()
  await loadLocalCache()
}

async function loadLocalCache(): Promise<void> {
  const roles = await Role.findMany({ orderBy: [{ column: 'sort', order: 'ASC' }] })
  const menus = collectAllMenus(allConfigs)

  state.roles.clear()
  state.menus.clear()

  for (const role of roles) {
    const permissionCodes = await casbin.getRolePermissionCodes(role.id)
    const cached: CachedRole = { ...role, permissionCodes }
    state.roles.set(role.id, cached)
  }

  for (const menu of menus) {
    state.menus.set(menu.id, menu)
  }

  state.initialized = true
}

// ============ 角色查询 ============

export function getRole(roleId: string): CachedRole | undefined {
  ensureInitialized()
  return state.roles.get(roleId)
}

export function getRoleByCode(code: string): CachedRole | undefined {
  ensureInitialized()
  return state.roles.get(code)
}

export function getAllRoles(): CachedRole[] {
  ensureInitialized()
  return Array.from(state.roles.values())
}

// ============ 菜单查询 ============

export function getMenu(menuId: number): MenuRow | undefined {
  ensureInitialized()
  return state.menus.get(menuId)
}

export function getAllMenus(): MenuRow[] {
  ensureInitialized()
  return Array.from(state.menus.values())
}

/**
 * 获取角色可见的菜单列表。
 * 菜单可见性由角色权限编码自动派生：
 *   - 叶子菜单：permCode 为空或在角色权限中
 *   - 目录菜单：至少有一个可见的子菜单
 */
export async function getRoleMenus(roleCode: string): Promise<MenuRow[]> {
  ensureInitialized()
  const permCodes = new Set(await casbin.getRolePermissionCodes(roleCode))
  const allMenus = getAllMenus().filter((m) => m.status === 1)

  // Step 1: 标记叶子菜单（页面/按钮且有 permCode 且角色拥有该权限，或无 permCode 的页面）
  const visibleIds = new Set<number>()
  for (const menu of allMenus) {
    if (menu.type === 1) continue // 目录不在此处标记，由 Step 2 向上传播决定
    if (menu.permCode && permCodes.has(menu.permCode)) {
      visibleIds.add(menu.id)
    } else if (!menu.permCode && menu.type === 2) {
      // 无权限要求的页面（如控制台），登录即可见
      visibleIds.add(menu.id)
    }
  }

  // Step 2: 向上传播 — 如果子菜单可见，其父目录也可见
  const menuById = new Map(allMenus.map((m) => [m.id, m]))
  for (const id of visibleIds) {
    let menu = menuById.get(id)
    while (menu?.parentId) {
      if (visibleIds.has(menu.parentId)) break
      visibleIds.add(menu.parentId)
      menu = menuById.get(menu.parentId)
    }
  }

  return allMenus.filter((m) => visibleIds.has(m.id)).sort((a, b) => a.sort - b.sort)
}

// ============ 状态 ============

export async function getStatus() {
  const casbinStatus = await casbin.getStatus()
  return {
    ...casbinStatus,
    roleCount: state.roles.size,
    localMenuCount: state.menus.size,
  }
}
