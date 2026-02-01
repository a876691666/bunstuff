import { http } from '@/utils'
import type {
  PermissionScope,
  CreatePermissionScopeRequest,
  UpdatePermissionScopeRequest,
  PageParams,
} from '@/types'

export interface PermissionScopeQueryParams extends PageParams {
  permissionId?: number
  name?: string
  tableName?: string
  [key: string]: unknown
}

/** 管理端数据权限 API（路径前缀: /api/admin/permission-scope） */
export const permissionScopeApi = {
  /** 获取数据权限列表 */
  list: (params?: PermissionScopeQueryParams) =>
    http.getPage<PermissionScope>('/admin/permission-scope', params as Record<string, unknown>),

  /** 获取数据权限详情 */
  get: (id: number) => http.get<PermissionScope>(`/admin/permission-scope/${id}`),

  /** 创建数据权限 */
  create: (data: CreatePermissionScopeRequest) =>
    http.post<PermissionScope>('/admin/permission-scope', data),

  /** 更新数据权限 */
  update: (id: number, data: UpdatePermissionScopeRequest) =>
    http.put<PermissionScope>(`/admin/permission-scope/${id}`, data),

  /** 删除数据权限 */
  delete: (id: number) => http.delete(`/admin/permission-scope/${id}`),
}
