import { Elysia } from 'elysia'
import * as noticeService from '@/services/notice'
import { idParams, query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { noticePlugin } from '@/plugins/notice'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(noticePlugin())
  .use(operLogPlugin())
  .get(
    '/',
    async (ctx) => {
      const result = await noticeService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(noticeService.getSchema(), '通知公告列表') },
      detail: {
        summary: '获取通知公告列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await noticeService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('通知公告')
      return R.ok(data)
    },
    {
      params: idParams({ label: '通知公告ID' }),
      response: { 200: SuccessResponse(noticeService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取通知公告详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const data = await noticeService.create({ ...ctx.body, createBy: ctx.userId! }, ctx)
      if (!data) return R.forbidden('无权创建')
      return R.ok(data, '创建成功')
    },
    {
      body: noticeService.getSchema({
        exclude: ['id', 'createBy'],
        timestamps: false,
        required: ['title', 'content'],
      }),
      response: { 200: SuccessResponse(noticeService.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '创建通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:create'] } },
        operLog: { title: '通知公告', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const data = await noticeService.update(ctx.params.id, ctx.body, ctx)
      if (!data) return R.forbidden('无权更新或通知公告不存在')
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '通知公告ID' }),
      body: noticeService.getSchema({ exclude: ['id', 'createBy'], partial: true }),
      response: {
        200: SuccessResponse(noticeService.getSchema()),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:update'] } },
        operLog: { title: '通知公告', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const ok = await noticeService.remove(ctx.params.id, ctx)
      if (!ok) return R.forbidden('无权删除或通知公告不存在')
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '通知公告ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除通知公告',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['notice:admin:delete'] } },
        operLog: { title: '通知公告', type: 'delete' },
      },
    },
  )
