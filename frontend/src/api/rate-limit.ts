import { http } from '@/utils'
import type {
  RateLimitRule,
  IpBlacklist,
  CreateRateLimitRuleRequest,
  UpdateRateLimitRuleRequest,
  CreateIpBlacklistRequest,
  UpdateIpBlacklistRequest,
  PageParams,
} from '@/types'

export interface RateLimitRuleQueryParams extends PageParams {
  name?: string
  code?: string
  mode?: string
  status?: number
}

export interface IpBlacklistQueryParams extends PageParams {
  ip?: string
  source?: string
  status?: number
}

/** 限流规则管理 API */
export const rateLimitRuleApi = {
  /** 获取列表 */
  list: (params?: RateLimitRuleQueryParams) =>
    http.getPage<RateLimitRule>('/admin/rate-limit-rule', params as Record<string, unknown>),

  /** 获取详情 */
  get: (id: number) => http.get<RateLimitRule>(`/admin/rate-limit-rule/${id}`),

  /** 创建 */
  create: (data: CreateRateLimitRuleRequest) =>
    http.post<RateLimitRule>('/admin/rate-limit-rule', data),

  /** 更新 */
  update: (id: number, data: UpdateRateLimitRuleRequest) =>
    http.put<RateLimitRule>(`/admin/rate-limit-rule/${id}`, data),

  /** 删除 */
  delete: (id: number) => http.delete(`/admin/rate-limit-rule/${id}`),

  /** 获取统计信息 */
  getStats: () => http.get<{ rules: number; counters: Record<string, number> }>('/admin/rate-limit-rule/stats'),

  /** 重载缓存 */
  reload: () => http.post('/admin/rate-limit-rule/reload'),
}

/** IP黑名单管理 API */
export const ipBlacklistApi = {
  /** 获取列表 */
  list: (params?: IpBlacklistQueryParams) =>
    http.getPage<IpBlacklist>('/admin/ip-blacklist', params as Record<string, unknown>),

  /** 获取详情 */
  get: (id: number) => http.get<IpBlacklist>(`/admin/ip-blacklist/${id}`),

  /** 手动添加 */
  create: (data: CreateIpBlacklistRequest) =>
    http.post<IpBlacklist>('/admin/ip-blacklist', data),

  /** 更新 */
  update: (id: number, data: UpdateIpBlacklistRequest) =>
    http.put<IpBlacklist>(`/admin/ip-blacklist/${id}`, data),

  /** 删除 */
  delete: (id: number) => http.delete(`/admin/ip-blacklist/${id}`),

  /** 解封IP */
  unblock: (id: number) => http.post(`/admin/ip-blacklist/${id}/unblock`),

  /** 重载缓存 */
  reload: () => http.post('/admin/ip-blacklist/reload'),
}
