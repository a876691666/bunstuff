import { http } from '@/utils'
import type {
  Permission,
  CreatePermissionRequest,
  UpdatePermissionRequest,
  PageParams,
} from '@/types'

export interface PermissionQueryParams extends PageParams {
  name?: string
  code?: string
  resource?: string
  [key: string]: unknown
}

/** 管理端权限 API（路径前缀: /api/admin/permission） */
export const permissionApi = {
  /** 获取权限列表 */
  list: (params?: PermissionQueryParams) =>
    http.getPage<Permission>('/admin/permission', params as Record<string, unknown>),

  /** 获取权限详情 */
  get: (id: number) => http.get<Permission>(`/admin/permission/${id}`),

  /** 创建权限 */
  create: (data: CreatePermissionRequest) => http.post<Permission>('/admin/permission', data),

  /** 更新权限 */
  update: (id: number, data: UpdatePermissionRequest) =>
    http.put<Permission>(`/admin/permission/${id}`, data),

  /** 删除权限 */
  delete: (id: number) => http.delete(`/admin/permission/${id}`),
}
