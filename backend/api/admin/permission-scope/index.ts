import { Elysia } from 'elysia'
import * as permissionScopeService from '@/services/permission-scope'
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

export default new Elysia({ tags: ['管理 - 数据权限'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  .get(
    '/',
    async (ctx) => {
      const result = await permissionScopeService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(permissionScopeService.getSchema(), '数据过滤规则列表分页数据'),
      },
      detail: {
        summary: '获取数据过滤规则列表',
        description: '分页获取数据过滤规则列表\n\n🔐 **所需权限**: `permission-scope:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission-scope:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await permissionScopeService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('数据过滤规则')
      return R.ok(data)
    },
    {
      params: idParams({ label: '数据过滤规则ID' }),
      response: {
        200: SuccessResponse(permissionScopeService.getSchema(), '数据过滤规则详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取数据过滤规则详情',
        description:
          '根据ID获取数据过滤规则详细信息\n\n🔐 **所需权限**: `permission-scope:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission-scope:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const data = await permissionScopeService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: permissionScopeService.getSchema({
        exclude: ['id'],
        timestamps: false,
        required: ['permissionId', 'name', 'tableName', 'ssqlRule'],
      }),
      response: {
        200: SuccessResponse(
          permissionScopeService.getSchema({ timestamps: false }),
          '新创建的数据过滤规则信息',
        ),
      },
      detail: {
        summary: '创建数据过滤规则',
        description: '创建新的数据过滤规则\n\n🔐 **所需权限**: `permission-scope:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission-scope:admin:create'] } },
        operLog: { title: '数据权限', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const existing = await permissionScopeService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('数据过滤规则')
      const data = await permissionScopeService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '数据过滤规则ID' }),
      body: permissionScopeService.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(permissionScopeService.getSchema(), '更新后的数据过滤规则信息'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新数据过滤规则',
        description:
          '更新指定数据过滤规则的信息\n\n🔐 **所需权限**: `permission-scope:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission-scope:admin:update'] } },
        operLog: { title: '数据权限', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await permissionScopeService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('数据过滤规则')
      await permissionScopeService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '数据过滤规则ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除数据过滤规则',
        description: '删除指定数据过滤规则\n\n🔐 **所需权限**: `permission-scope:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission-scope:admin:delete'] } },
        operLog: { title: '数据权限', type: 'delete' },
      },
    },
  )
