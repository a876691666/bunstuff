import { Elysia } from 'elysia'
import { noticeService } from './service'
import { idParams, query } from '@/packages/route-model'
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
import Notice from '@/models/notice'

/** 通知公告管理控制器（管理端） */
export const noticeAdminController = new Elysia({ prefix: '/notice', tags: ['管理 - 通知公告'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(noticePlugin())
  .get(
    '/',
    async ({ query }) => {
      const result = await noticeService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(Notice.getSchema(), '通知公告列表') },
      detail: {
        summary: '获取通知公告列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const data = await noticeService.findById(params.id)
      if (!data) return R.notFound('通知公告')
      return R.ok(data)
    },
    {
      params: idParams({ label: '通知公告ID' }),
      response: { 200: SuccessResponse(Notice.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取通知公告详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async ({ body, userId }) => {
      const data = await noticeService.create(body, userId!)
      return R.ok(data, '创建成功')
    },
    {
      body: Notice.getSchema({ exclude: ['id', 'createBy'], required: ['title', 'content'] }),
      response: { 200: SuccessResponse(Notice.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '创建通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:create'] } },
      },
    },
  )

  .put(
    '/:id',
    async ({ params, body }) => {
      const existing = await noticeService.findById(params.id)
      if (!existing) return R.notFound('通知公告')
      const data = await noticeService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '通知公告ID' }),
      body: Notice.getSchema({ exclude: ['id', 'createBy'], partial: true }),
      response: { 200: SuccessResponse(Notice.getSchema()), 400: ErrorResponse, 404: ErrorResponse },
      detail: {
        summary: '更新通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:update'] } },
      },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await noticeService.findById(params.id)
      if (!existing) return R.notFound('通知公告')
      await noticeService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '通知公告ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:delete'] } },
      },
    },
  )

  .post(
    '/:id/publish',
    async ({ params }) => {
      const existing = await noticeService.findById(params.id)
      if (!existing) return R.notFound('通知公告')
      const data = await noticeService.publish(params.id)
      return R.ok(data, '发布成功')
    },
    {
      params: idParams({ label: '通知公告ID' }),
      response: { 200: SuccessResponse(Notice.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '发布通知公告',
        description: '将通知公告状态改为正常并广播给所有在线用户',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:publish'] } },
      },
    },
  )
