import { Elysia, t } from 'elysia'
import { jobLogService } from './service'
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
import { operLogPlugin } from '@/modules/system'
import JobLog from '@/models/job-log'

/** 任务日志管理控制器（管理端） */
export const jobLogAdminController = new Elysia({
  prefix: '/job-log',
  tags: ['管理 - 任务日志'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(operLogPlugin())

  // 列表
  .get(
    '/',
    async (ctx) => {
      const result = await jobLogService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(JobLog.getSchema({ timestamps: false }), '任务日志列表') },
      detail: {
        summary: '获取日志列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['jobLog:admin:list'] } },
      },
    },
  )

  // 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await jobLogService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('日志')
      return R.ok(data)
    },
    {
      params: idParams({ label: '日志ID' }),
      response: {
        200: SuccessResponse(JobLog.getSchema({ timestamps: false })),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取日志详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['jobLog:admin:read'] } },
      },
    },
  )

  // 删除
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await jobLogService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('日志')
      await jobLogService.delete(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '日志ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除日志',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['jobLog:admin:delete'] } },
        operLog: { title: '任务日志', type: 'delete' },
      },
    },
  )

  // 清空日志
  .delete(
    '/clear',
    async ({ query }) => {
      await jobLogService.clear(query.jobId)
      return R.success('清空成功')
    },
    {
      query: t.Object({
        jobId: t.Optional(t.Numeric({ description: '任务ID（不传则清空全部）' })),
      }),
      response: { 200: MessageResponse },
      detail: {
        summary: '清空日志',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['jobLog:admin:clear'] } },
        operLog: { title: '任务日志', type: 'other' },
      },
    },
  )
