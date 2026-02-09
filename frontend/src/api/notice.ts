import { http } from '@/utils'
import type {
  Notice,
  NoticeWithRead,
  CreateNoticeRequest,
  UpdateNoticeRequest,
  PageParams,
} from '@/types'

export interface NoticeQueryParams extends PageParams {
  title?: string
  type?: string
  status?: number
}

/** 管理端通知公告 API（路径前缀: /api/admin/notice） */
export const noticeApi = {
  /** 获取公告列表 */
  list: (params?: NoticeQueryParams) =>
    http.getPage<Notice>('/admin/notice', params as Record<string, unknown>),

  /** 获取公告详情 */
  get: (id: number) => http.get<Notice>(`/admin/notice/${id}`),

  /** 创建公告 */
  create: (data: CreateNoticeRequest) => http.post<Notice>('/admin/notice', data),

  /** 更新公告 */
  update: (id: number, data: UpdateNoticeRequest) => http.put<Notice>(`/admin/notice/${id}`, data),

  /** 删除公告 */
  delete: (id: number) => http.delete(`/admin/notice/${id}`),
}

/** 客户端通知公告 API（路径前缀: /api/notice） */
export const noticeClientApi = {
  /** 获取我的通知列表（已发布） */
  list: (params?: NoticeQueryParams) =>
    http.getPage<NoticeWithRead>('/notice/my', params as Record<string, unknown>),

  /** 标记已读 */
  markRead: (id: number) => http.post(`/notice/${id}/read`),

  /** 全部标记已读 */
  markAllRead: () => http.post<{ count: number }>('/notice/read-all'),

  /** 获取未读数量 */
  getUnreadCount: () => http.get<{ count: number }>('/notice/unread-count'),
}
