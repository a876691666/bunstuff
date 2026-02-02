import { http } from '@/utils'
import type { Menu, MenuTree, CreateMenuRequest, UpdateMenuRequest, PageParams } from '@/types'

export interface MenuQueryParams extends PageParams {
  name?: string
  status?: number
  type?: number
  [key: string]: unknown
}

/** 管理端菜单 API（路径前缀: /api/admin/menu） */
export const menuApi = {
  /** 获取菜单列表 */
  list: (params?: MenuQueryParams) =>
    http.getPage<Menu>('/admin/menu', params as Record<string, unknown>),

  /** 获取菜单树 */
  tree: () => http.get<MenuTree[]>('/admin/menu/tree'),

  /** 获取菜单详情 */
  get: (id: number) => http.get<Menu>(`/admin/menu/${id}`),

  /** 创建菜单 */
  create: (data: CreateMenuRequest) => http.post<Menu>('/admin/menu', data),

  /** 更新菜单 */
  update: (id: number, data: UpdateMenuRequest) => http.put<Menu>(`/admin/menu/${id}`, data),

  /** 删除菜单 */
  delete: (id: number) => http.delete(`/admin/menu/${id}`),
}
