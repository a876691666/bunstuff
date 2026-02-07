import { Elysia } from 'elysia'
import { operLogService } from './service'
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
import OperLog from '@/models/oper-log'

/** 操作日志管理控制器（管理端） */
export const operLogAdminController = new Elysia({
  prefix: '/oper-log',
  tags: ['管理 - 操作日志'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .get(
    '/',
    async ({ query }) => {
      const result = await operLogService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(OperLog.getSchema({ timestamps: false }), '操作日志列表'),
      },
      detail: {
        summary: '获取操作日志列表',
        description: '分页获取操作日志列表，支持筛选\n\n🔐 **所需权限**: `operLog:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['operLog:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const data = await operLogService.findById(params.id)
      if (!data) return R.notFound('操作日志')
      return R.ok(data)
    },
    {
      params: idParams({ label: '操作日志ID' }),
      response: {
        200: SuccessResponse(OperLog.getSchema({ timestamps: false })),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取操作日志详情',
        description: '根据ID获取操作日志详情\n\n🔐 **所需权限**: `operLog:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['operLog:admin:read'] } },
      },
    },
  )

  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await operLogService.findById(params.id)
      if (!existing) return R.notFound('操作日志')
      await operLogService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '操作日志ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除操作日志',
        description: '删除指定操作日志\n\n🔐 **所需权限**: `operLog:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['operLog:admin:delete'] } },
      },
    },
  )

  .delete(
    '/clear',
    async () => {
      await operLogService.clear()
      return R.success('清空成功')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '清空操作日志',
        description: '清空所有操作日志，此操作不可恢复\n\n🔐 **所需权限**: `operLog:admin:clear`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['operLog:admin:clear'] } },
      },
    },
  )
