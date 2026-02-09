import { Elysia, t } from 'elysia'
import { jobService } from './service'
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
import Job from '@/models/job'

/** 定时任务管理控制器（管理端） */
export const jobAdminController = new Elysia({
  prefix: '/job',
  tags: ['管理 - 定时任务'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(operLogPlugin())

  // 列表
  .get(
    '/',
    async (ctx) => {
      const result = await jobService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(Job.getSchema(), '定时任务列表') },
      detail: {
        summary: '获取任务列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:list'] } },
      },
    },
  )

  // 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await jobService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('任务')
      return R.ok(data)
    },
    {
      params: idParams({ label: '任务ID' }),
      response: { 200: SuccessResponse(Job.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取任务详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:read'] } },
      },
    },
  )

  // 创建
  .post(
    '/',
    async (ctx) => {
      const result = await jobService.create(ctx.body, ctx)
      if (!result) return R.forbidden('无权操作')
      return R.ok(result, '创建成功')
    },
    {
      body: Job.getSchema({ exclude: ['id'], required: ['name', 'handler', 'cron'] }),
      response: { 200: MessageResponse },
      detail: {
        summary: '创建任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:create'] } },
        operLog: { title: '定时任务', type: 'create' },
      },
    },
  )

  // 更新
  .put(
    '/:id',
    async (ctx) => {
      const r = await jobService.update(ctx.params.id, ctx.body, ctx)
      if (!r) return R.forbidden('无权操作该记录')
      return R.success('更新成功')
    },
    {
      params: idParams({ label: '任务ID' }),
      body: Job.getSchema({ exclude: ['id'], partial: true }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '更新任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:update'] } },
        operLog: { title: '定时任务', type: 'update' },
      },
    },
  )

  // 删除
  .delete(
    '/:id',
    async (ctx) => {
      const ok = await jobService.delete(ctx.params.id, ctx)
      if (!ok) return R.forbidden('无权操作该记录')
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '任务ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:delete'] } },
        operLog: { title: '定时任务', type: 'delete' },
      },
    },
  )

  // 执行任务
  .post(
    '/:id/run',
    async (ctx) => {
      const result = await jobService.executeJob(ctx.params.id)
      if (!result.success) return R.fail(result.error || '执行失败')
      return R.success('执行成功')
    },
    {
      params: idParams({ label: '任务ID' }),
      response: { 200: MessageResponse },
      detail: {
        summary: '执行任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:run'] } },
        operLog: { title: '定时任务', type: 'other' },
      },
    },
  )

  // 启用任务
  .post(
    '/:id/enable',
    async (ctx) => {
      await jobService.enable(ctx.params.id)
      return R.success('已启用')
    },
    {
      params: idParams({ label: '任务ID' }),
      response: { 200: MessageResponse },
      detail: {
        summary: '启用任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:update'] } },
      },
    },
  )

  // 禁用任务
  .post(
    '/:id/disable',
    async (ctx) => {
      await jobService.disable(ctx.params.id)
      return R.success('已禁用')
    },
    {
      params: idParams({ label: '任务ID' }),
      response: { 200: MessageResponse },
      detail: {
        summary: '禁用任务',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:update'] } },
      },
    },
  )

  // 获取已注册的handlers
  .get(
    '/handlers',
    (ctx) => {
      return R.ok(jobService.getHandlerNames())
    },
    {
      response: { 200: SuccessResponse(t.Array(t.String())) },
      detail: {
        summary: '获取已注册处理函数',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['job:admin:list'] } },
      },
    },
  )
