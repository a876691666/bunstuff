import { http } from '@/utils'
import type { RoleMenu, PageParams } from '@/types'

export interface RoleMenuQueryParams extends PageParams {
  roleId?: number
  menuId?: number
  [key: string]: unknown
}

/** 管理端角色菜单 API（路径前缀: /api/admin/role-menu） */
export const roleMenuApi = {
  /** 获取角色菜单关联列表 */
  list: (params?: RoleMenuQueryParams) =>
    http.getPage<RoleMenu>('/admin/role-menu', params as Record<string, unknown>),

  /** 获取角色的菜单ID列表 */
  getMenuIds: (roleId: number) => http.get<number[]>(`/admin/role-menu/role/${roleId}/menus`),

  /** 获取角色菜单关联详情 */
  get: (id: number) => http.get<RoleMenu>(`/admin/role-menu/${id}`),

  /** 创建角色菜单关联 */
  create: (data: { roleId: number; menuId: number }) =>
    http.post<RoleMenu>('/admin/role-menu', data),

  /** 批量设置角色菜单 */
  batchSet: (roleId: number, menuIds: number[]) =>
    http.post<RoleMenu[]>('/admin/role-menu/batch', { roleId, menuIds }),

  /** 删除角色菜单关联 */
  delete: (id: number) => http.delete(`/admin/role-menu/${id}`),
}
