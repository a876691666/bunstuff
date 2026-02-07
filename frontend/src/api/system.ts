import { http } from '@/utils'
import type {
  DictType,
  DictData,
  SysConfig,
  LoginLog,
  OperLog,
  CreateDictTypeRequest,
  UpdateDictTypeRequest,
  CreateDictDataRequest,
  UpdateDictDataRequest,
  CreateSysConfigRequest,
  UpdateSysConfigRequest,
  PageParams,
} from '@/types'

// ============ 字典类型 API ============

export interface DictTypeQueryParams extends PageParams {
  name?: string
  type?: string
  status?: number
}

export interface DictDataQueryParams extends PageParams {
  dictType?: string
  label?: string
  status?: number
}

export interface SysConfigQueryParams extends PageParams {
  name?: string
  key?: string
}

export interface LoginLogQueryParams extends PageParams {
  username?: string
  ip?: string
  status?: number
  action?: string
  startTime?: string
  endTime?: string
}

/** 管理端字典 API（路径前缀: /api/admin/dict） */
export const dictApi = {
  // ============ 字典类型管理 ============

  /** 获取字典类型列表 */
  listTypes: (params?: DictTypeQueryParams) =>
    http.getPage<DictType>('/admin/dict/type', params as Record<string, unknown>),

  /** 获取字典类型详情 */
  getType: (id: number) => http.get<DictType>(`/admin/dict/type/${id}`),

  /** 创建字典类型 */
  createType: (data: CreateDictTypeRequest) => http.post<DictType>('/admin/dict/type', data),

  /** 更新字典类型 */
  updateType: (id: number, data: UpdateDictTypeRequest) =>
    http.put<DictType>(`/admin/dict/type/${id}`, data),

  /** 删除字典类型 */
  deleteType: (id: number) => http.delete(`/admin/dict/type/${id}`),

  // ============ 字典数据管理 ============

  /** 获取字典数据列表 */
  listData: (params?: DictDataQueryParams) =>
    http.getPage<DictData>('/admin/dict/data', params as Record<string, unknown>),

  /** 获取字典数据详情 */
  getData: (id: number) => http.get<DictData>(`/admin/dict/data/${id}`),

  /** 创建字典数据 */
  createData: (data: CreateDictDataRequest) => http.post<DictData>('/admin/dict/data', data),

  /** 更新字典数据 */
  updateData: (id: number, data: UpdateDictDataRequest) =>
    http.put<DictData>(`/admin/dict/data/${id}`, data),

  /** 删除字典数据 */
  deleteData: (id: number) => http.delete(`/admin/dict/data/${id}`),
}

/** 客户端字典 API（路径前缀: /api/dict） */
export const dictClientApi = {
  /** 获取字典数据 */
  getByType: (type: string) => http.get<DictData[]>(`/dict/type/${type}`),

  /** 批量获取多个字典类型的数据 */
  batchGet: (types: string[]) => http.post<Record<string, DictData[]>>('/dict/batch', { types }),
}

/** 管理端系统配置 API（路径前缀: /api/admin/config） */
export const configApi = {
  /** 获取配置列表 */
  list: (params?: SysConfigQueryParams) =>
    http.getPage<SysConfig>('/admin/config', params as Record<string, unknown>),

  /** 获取配置详情 */
  get: (id: number) => http.get<SysConfig>(`/admin/config/${id}`),

  /** 创建配置 */
  create: (data: CreateSysConfigRequest) => http.post<SysConfig>('/admin/config', data),

  /** 更新配置 */
  update: (id: number, data: UpdateSysConfigRequest) =>
    http.put<SysConfig>(`/admin/config/${id}`, data),

  /** 删除配置 */
  delete: (id: number) => http.delete(`/admin/config/${id}`),
}

/** 客户端配置 API（路径前缀: /api/config） */
export const configClientApi = {
  /** 通过 key 获取配置值 */
  getByKey: (key: string) => http.get<{ key: string; value: string | null }>(`/config/key/${key}`),

  /** 批量获取多个参数值 */
  batchGet: (keys: string[]) => http.post<Record<string, string | null>>('/config/batch', { keys }),
}

/** 管理端登录日志 API（路径前缀: /api/admin/login-log） */
export const loginLogApi = {
  /** 获取登录日志列表 */
  list: (params?: LoginLogQueryParams) =>
    http.getPage<LoginLog>('/admin/login-log', params as Record<string, unknown>),

  /** 获取登录日志详情 */
  get: (id: number) => http.get<LoginLog>(`/admin/login-log/${id}`),

  /** 删除登录日志 */
  delete: (id: number) => http.delete(`/admin/login-log/${id}`),

  /** 清空登录日志 */
  clear: () => http.delete('/admin/login-log/clear'),
}

/** 管理端操作日志 API（路径前缀: /api/admin/oper-log） */
export const operLogApi = {
  /** 获取操作日志列表 */
  list: (params?: PageParams) =>
    http.getPage<OperLog>('/admin/oper-log', params as Record<string, unknown>),

  /** 获取操作日志详情 */
  get: (id: number) => http.get<OperLog>(`/admin/oper-log/${id}`),

  /** 删除操作日志 */
  delete: (id: number) => http.delete(`/admin/oper-log/${id}`),

  /** 清空操作日志 */
  clear: () => http.delete('/admin/oper-log/clear'),
}
