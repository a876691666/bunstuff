import { http } from '@/utils'
import type {
  VipTier,
  VipResourceLimit,
  UserVip,
  UserResourceUsageInfo,
  ResourceCheckResult,
  CreateVipTierRequest,
  UpdateVipTierRequest,
  CreateVipResourceLimitRequest,
  UpdateVipResourceLimitRequest,
  PageParams,
} from '@/types'

export interface VipTierQueryParams extends PageParams {
  name?: string
  code?: string
  [key: string]: unknown
}

export interface VipResourceLimitQueryParams extends PageParams {
  resourceKey?: string
  [key: string]: unknown
}

export interface UserVipQueryParams extends PageParams {
  userId?: number
  [key: string]: unknown
}

/** 管理端 VIP API（路径前缀: /api/admin/vip） */
export const vipApi = {
  // ============ VIP 等级管理 ============

  /** 获取 VIP 等级列表 */
  listTiers: (params?: VipTierQueryParams) =>
    http.getPage<VipTier>('/admin/vip/tier', params as Record<string, unknown>),

  /** 获取 VIP 等级详情 */
  getTier: (id: number) => http.get<VipTier>(`/admin/vip/tier/${id}`),

  /** 创建 VIP 等级 */
  createTier: (data: CreateVipTierRequest) => http.post<VipTier>('/admin/vip/tier', data),

  /** 更新 VIP 等级 */
  updateTier: (id: number, data: UpdateVipTierRequest) =>
    http.put<VipTier>(`/admin/vip/tier/${id}`, data),

  /** 删除 VIP 等级 */
  deleteTier: (id: number) => http.delete(`/admin/vip/tier/${id}`),

  // ============ VIP 资源限制管理 ============

  /** 获取 VIP 等级的资源限制列表 */
  getResourceLimits: (tierId: number) =>
    http.get<VipResourceLimit[]>(`/admin/vip/tier/${tierId}/resource-limits`),

  /** 创建资源限制 */
  createResourceLimit: (data: CreateVipResourceLimitRequest) =>
    http.post<VipResourceLimit>('/admin/vip/resource-limit', data),

  /** 更新资源限制 */
  updateResourceLimit: (id: number, data: UpdateVipResourceLimitRequest) =>
    http.put<VipResourceLimit>(`/admin/vip/resource-limit/${id}`, data),

  /** 删除资源限制 */
  deleteResourceLimit: (id: number) => http.delete(`/admin/vip/resource-limit/${id}`),

  // ============ 用户 VIP 管理 ============

  /** 获取用户 VIP 列表 */
  listUserVips: (params?: UserVipQueryParams) =>
    http.getPage<UserVip>('/admin/vip/user-vips', params as Record<string, unknown>),

  /** 获取用户 VIP 信息 */
  getUserVip: (userId: number) => http.get<UserVip>(`/admin/vip/user/${userId}`),

  /** 升级用户 VIP（需确认） */
  upgradeUserVip: (userId: number, vipTierCode: string, expireTime?: string) =>
    http.post<UserVip>('/admin/vip/upgrade', { userId, vipTierCode, expireTime }),

  /** 直接升级用户 VIP */
  upgradeUserVipDirect: (userId: number, vipTierCode: string, expireTime?: string) =>
    http.post<UserVip>('/admin/vip/upgrade-direct', { userId, vipTierCode, expireTime }),

  /** 确认 VIP 绑定 */
  confirmVipBinding: (userVipId: number, confirm: boolean) =>
    http.post<UserVip>('/admin/vip/confirm-binding', { userVipId, confirm }),

  /** 取消用户 VIP */
  cancelUserVip: (userId: number) => http.post(`/admin/vip/cancel/${userId}`),

  // ============ 资源使用管理 ============

  /** 检查资源使用 */
  checkResource: (userId: number, resourceKey: string, amount?: number) =>
    http.post<ResourceCheckResult>('/admin/vip/resource/check', {
      userId,
      resourceKey,
      amount: amount || 1,
    }),

  /** 增加资源使用 */
  incrementResource: (userId: number, resourceKey: string, amount?: number) =>
    http.post<ResourceCheckResult>('/admin/vip/resource/increment', {
      userId,
      resourceKey,
      amount: amount || 1,
    }),

  /** 获取用户资源使用情况 */
  getUserResourceUsage: (userId: number) =>
    http.get<UserResourceUsageInfo[]>(`/admin/vip/resource/usage/${userId}`),
}
