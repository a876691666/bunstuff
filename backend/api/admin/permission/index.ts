import { Elysia } from 'elysia'
import * as permissionService from '@/services/permission'
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
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({ tags: ['管理 - 权限'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  .get(
    '/',
    async (ctx) => {
      const result = await permissionService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(permissionService.getSchema(), '权限列表分页数据') },
      detail: {
        summary: '获取权限列表',
        description: '分页获取权限列表\n\n🔐 **所需权限**: `permission:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await permissionService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('权限')
      return R.ok(data)
    },
    {
      params: idParams({ label: '权限ID' }),
      response: {
        200: SuccessResponse(permissionService.getSchema(), '权限详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取权限详情',
        description: '根据权限ID获取权限详细信息\n\n🔐 **所需权限**: `permission:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const existing = await permissionService.findByCode(ctx.body.code)
      if (existing) return R.badRequest('权限编码已存在')
      const data = await permissionService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: permissionService.getSchema({ exclude: ['id'], required: ['name', 'code'] }),
      response: {
        200: SuccessResponse(permissionService.getSchema(), '新创建的权限信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建权限',
        description: '创建新权限，编码必须唯一\n\n🔐 **所需权限**: `permission:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:create'] } },
        operLog: { title: '权限管理', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const existing = await permissionService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('权限')
      if (ctx.body.code && ctx.body.code !== existing.code) {
        const codeExists = await permissionService.findByCode(ctx.body.code)
        if (codeExists) return R.badRequest('权限编码已存在')
      }
      const data = await permissionService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '权限ID' }),
      body: permissionService.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(permissionService.getSchema(), '更新后的权限信息'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新权限',
        description: '更新指定权限的信息\n\n🔐 **所需权限**: `permission:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:update'] } },
        operLog: { title: '权限管理', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await permissionService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('权限')
      await permissionService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '权限ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除权限',
        description: '删除指定权限\n\n🔐 **所需权限**: `permission:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:delete'] } },
        operLog: { title: '权限管理', type: 'delete' },
      },
    },
  )
