import { http } from '@/utils'
import type { CrudTable, CreateCrudTableRequest, UpdateCrudTableRequest, PageParams } from '@/types'

export interface CrudTableQueryParams extends PageParams {
  tableName?: string
  displayName?: string
  status?: number
  [key: string]: unknown
}

/** CRUD 表配置管理 API（管理端） */
export const crudTableApi = {
  /** 获取表配置列表 */
  list: (params?: CrudTableQueryParams) =>
    http.getPage<CrudTable>('/admin/crud-table', params as Record<string, unknown>),

  /** 获取表配置详情 */
  get: (id: number) => http.get<CrudTable>(`/admin/crud-table/${id}`),

  /** 创建表配置 */
  create: (data: CreateCrudTableRequest) => http.post<CrudTable>('/admin/crud-table', data),

  /** 更新表配置 */
  update: (id: number, data: UpdateCrudTableRequest) =>
    http.put<CrudTable>(`/admin/crud-table/${id}`, data),

  /** 删除表配置 */
  delete: (id: number) => http.delete(`/admin/crud-table/${id}`),
}

/** 通用 CRUD 通配 API */
export const crudApi = {
  /** 获取已注册表列表 */
  listTables: () => http.get<string[]>('/crud'),

  /** 通用分页列表 */
  list: (tableName: string, params?: Record<string, unknown>) =>
    http.getPage<Record<string, unknown>>(`/crud/${tableName}`, params),

  /** 通用详情 */
  get: (tableName: string, id: number) =>
    http.get<Record<string, unknown>>(`/crud/${tableName}/${id}`),

  /** 通用创建 */
  create: (tableName: string, data: Record<string, unknown>) =>
    http.post<Record<string, unknown>>(`/crud/${tableName}`, data),

  /** 通用更新 */
  update: (tableName: string, id: number, data: Record<string, unknown>) =>
    http.put<Record<string, unknown>>(`/crud/${tableName}/${id}`, data),

  /** 通用删除 */
  delete: (tableName: string, id: number) =>
    http.delete(`/crud/${tableName}/${id}`),
}
