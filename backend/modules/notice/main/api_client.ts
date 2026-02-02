import { Elysia, t } from 'elysia'
import { noticeService, noticeSSE } from './service'
import { NoticeWithReadSchema, noticeIdParams } from './model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { vipPlugin } from '@/modules/vip'
import { noticePlugin } from './plugin'

/** 通知公告客户端控制器 */
export const noticeController = new Elysia({ prefix: '/notice', tags: ['客户端 - 通知公告'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(noticePlugin())
  /** 获取我的通知列表 */
  .get(
    '/my',
    async ({ userId, query }) => {
      if (!userId) return R.unauthorized()
      const result = await noticeService.findAllForUser(userId, query)
      return R.page(result)
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ description: '页码', default: 1 })),
        pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10 })),
      }),
      response: { 200: PagedResponse(NoticeWithReadSchema, '我的通知列表'), 401: ErrorResponse },
      detail: {
        summary: '获取我的通知列表',
        description: '获取当前用户的通知列表，包含已读状态',
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** 获取未读数量 */
  .get(
    '/unread-count',
    async ({ userId }) => {
      if (!userId) return R.unauthorized()
      const count = await noticeService.getUnreadCount(userId)
      return R.ok({ count })
    },
    {
      response: { 200: SuccessResponse(t.Object({ count: t.Number() })), 401: ErrorResponse },
      detail: {
        summary: '获取未读通知数量',
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** 标记通知已读 */
  .post(
    '/:id/read',
    async ({ params, userId }) => {
      if (!userId) return R.unauthorized()
      await noticeService.markAsRead(params.id, userId)
      return R.success('标记成功')
    },
    {
      params: noticeIdParams,
      response: { 200: MessageResponse, 401: ErrorResponse },
      detail: {
        summary: '标记通知已读',
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** 全部标记已读 */
  .post(
    '/read-all',
    async ({ userId }) => {
      if (!userId) return R.unauthorized()
      const result = await noticeService.markAllAsRead(userId)
      return R.ok(result, '全部标记成功')
    },
    {
      response: { 200: SuccessResponse(t.Object({ count: t.Number() })), 401: ErrorResponse },
      detail: {
        summary: '全部标记已读',
        security: [{ bearerAuth: [] }],
      },
    },
  )

  /** SSE 实时通知 */
  .get(
    '/sse',
    async ({ userId }) => {
      if (!userId) {
        return new Response('Unauthorized', { status: 401 })
      }

      const stream = new ReadableStream({
        start(controller) {
          // 添加连接
          noticeSSE.addConnection(userId, controller)

          // 发送初始连接成功消息
          const initMessage = `data: ${JSON.stringify({ type: 'connected' })}\n\n`
          controller.enqueue(new TextEncoder().encode(initMessage))
        },
        cancel(controller) {
          // 移除连接
          noticeSSE.removeConnection(userId, controller)
        },
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    },
    {
      detail: {
        summary: 'SSE 实时通知',
        description: '建立 SSE 连接，实时接收新的通知公告',
        security: [{ bearerAuth: [] }],
      },
    },
  )
