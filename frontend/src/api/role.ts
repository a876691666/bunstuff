import { http } from '@/utils'
import type {
  Role,
  RoleTree,
  CreateRoleRequest,
  UpdateRoleRequest,
  PageParams,
} from '@/types'

export interface RoleQueryParams extends PageParams {
  name?: string
  code?: string
  status?: number
  [key: string]: unknown
}

/** 管理端角色 API（路径前缀: /api/admin/role） */
export const roleApi = {
  /** 获取角色列表 */
  list: (params?: RoleQueryParams) => http.getPage<Role>('/admin/role', params as Record<string, unknown>),

  /** 获取角色树 */
  tree: () => http.get<RoleTree[]>('/admin/role/tree'),

  /** 获取角色详情 */
  get: (id: number) => http.get<Role>(`/admin/role/${id}`),

  /** 创建角色 */
  create: (data: CreateRoleRequest) => http.post<Role>('/admin/role', data),

  /** 更新角色 */
  update: (id: number, data: UpdateRoleRequest) => http.put<Role>(`/admin/role/${id}`, data),

  /** 删除角色 */
  delete: (id: number) => http.delete(`/admin/role/${id}`),
}
