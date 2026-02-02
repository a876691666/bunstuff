import { http } from '@/utils'
import type { User, CreateUserRequest, UpdateUserRequest, PageParams } from '@/types'

export interface UserQueryParams extends PageParams {
  username?: string
  nickname?: string
  status?: number
  roleId?: number
  [key: string]: unknown
}

/** 管理端用户 API（路径前缀: /api/admin/users） */
export const userApi = {
  /** 获取用户列表 */
  list: (params?: UserQueryParams) =>
    http.getPage<User>('/admin/users', params as Record<string, unknown>),

  /** 获取用户详情 */
  get: (id: number) => http.get<User>(`/admin/users/${id}`),

  /** 创建用户 */
  create: (data: CreateUserRequest) => http.post<User>('/admin/users', data),

  /** 更新用户 */
  update: (id: number, data: UpdateUserRequest) => http.put<User>(`/admin/users/${id}`, data),

  /** 删除用户 */
  delete: (id: number) => http.delete(`/admin/users/${id}`),
}
