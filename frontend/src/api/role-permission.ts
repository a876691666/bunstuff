import { http } from '@/utils'
import type { RolePermission, PageParams } from '@/types'

export interface RolePermissionQueryParams extends PageParams {
  roleId?: number
  permissionId?: number
  permissionScopeId?: number
  [key: string]: unknown
}

/** 管理端角色权限 API（路径前缀: /api/admin/role-permission） */
export const rolePermissionApi = {
  /** 获取角色权限关联列表 */
  list: (params?: RolePermissionQueryParams) =>
    http.getPage<RolePermission>('/admin/role-permission', params as Record<string, unknown>),

  /** 获取角色的权限ID列表 */
  getPermissionIds: (roleId: number) =>
    http.get<number[]>(`/admin/role-permission/role/${roleId}/permissions`),

  /** 获取角色权限关联详情 */
  get: (id: number) => http.get<RolePermission>(`/admin/role-permission/${id}`),

  /** 创建角色权限关联 */
  create: (data: { roleId: number; permissionId: number; permissionScopeId?: number }) =>
    http.post<RolePermission>('/admin/role-permission', data),

  /** 批量设置角色权限 */
  batchSet: (roleId: number, permissionIds: number[]) =>
    http.post<RolePermission[]>('/admin/role-permission/batch', { roleId, permissionIds }),

  /** 删除角色权限关联 */
  delete: (id: number) => http.delete(`/admin/role-permission/${id}`),
}
