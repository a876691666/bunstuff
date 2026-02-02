/**
 * 通知公告插件 - 提供通知发布和已读标记能力
 */

import { Elysia } from 'elysia'
import { noticeService, noticeSSE } from './service'
import type { NoticeInsert } from '@/models/notice'

/** 通知公告上下文 */
export interface NoticeContext {
  /** 发布通知 */
  publishNotice: (data: Omit<NoticeInsert, 'createBy'>, createBy: number) => Promise<any>
  /** 标记用户已阅 */
  markAsRead: (noticeId: number, userId: number) => Promise<any>
  /** 获取用户未读数量 */
  getUnreadCount: (userId: number) => Promise<number>
  /** 发送SSE消息给指定用户 */
  sendToUser: (userId: number, event: string, data: any) => void
}

/**
 * 通知公告插件
 *
 * @example
 * ```ts
 * app
 *   .use(noticePlugin())
 *   .post("/system/broadcast", async ({ notice }) => {
 *     await notice.publishNotice({
 *       title: "系统维护通知",
 *       content: "系统将于今晚22:00进行维护",
 *       type: "1",
 *       status: 1,
 *     }, 1);
 *     return { success: true };
 *   })
 * ```
 */
export function noticePlugin() {
  return new Elysia({ name: 'notice-plugin' }).derive({ as: 'global' }, () => {
    const notice: NoticeContext = {
      publishNotice: async (data, createBy) => {
        return await noticeService.create({ ...data, status: 1 }, createBy)
      },
      markAsRead: (noticeId, userId) => noticeService.markAsRead(noticeId, userId),
      getUnreadCount: (userId) => noticeService.getUnreadCount(userId),
      sendToUser: (userId, event, data) => noticeSSE.sendToUser(userId, event, data),
    }
    return { notice }
  })
}
