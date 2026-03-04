import { Elysia } from 'elysia'
import * as configService from '@/services/sys-config'
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
import { configPlugin } from '@/plugins/config'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({ tags: ['管理 - 参数配置'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(configPlugin())
  .use(operLogPlugin())
  .get(
    '/',
    async (ctx) => {
      const result = await configService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(configService.getSchema(), '参数配置列表') },
      detail: {
        summary: '获取参数配置列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await configService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('参数配置')
      return R.ok(data)
    },
    {
      params: idParams({ label: '参数配置ID' }),
      response: { 200: SuccessResponse(configService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取参数配置详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const existing = await configService.findByKey(ctx.body.key)
      if (existing) return R.badRequest('参数键名已存在')
      const data = await configService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: configService.getSchema({ exclude: ['id'], required: ['name', 'key', 'value'] }),
      response: { 200: SuccessResponse(configService.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '创建参数配置',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:create'] } },
        operLog: { title: '参数配置', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const existing = await configService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('参数配置')
      if (ctx.body.key && ctx.body.key !== existing.key) {
        const keyExists = await configService.findByKey(ctx.body.key)
        if (keyExists) return R.badRequest('参数键名已存在')
      }
      const data = await configService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '参数配置ID' }),
      body: configService.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(configService.getSchema()),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新参数配置',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:update'] } },
        operLog: { title: '参数配置', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await configService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('参数配置')
      if (existing.isBuiltin === 1) return R.badRequest('系统内置参数不可删除')
      await configService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '参数配置ID' }),
      response: { 200: MessageResponse, 400: ErrorResponse, 404: ErrorResponse },
      detail: {
        summary: '删除参数配置',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:delete'] } },
        operLog: { title: '参数配置', type: 'delete' },
      },
    },
  )

  .post(
    '/refresh-cache',
    async () => {
      await configService.init()
      return R.success('缓存刷新成功')
    },
    {
      response: { 200: MessageResponse },
      detail: {
        summary: '刷新参数配置缓存',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:update'] } },
        operLog: { title: '参数配置', type: 'other' },
      },
    },
  )
