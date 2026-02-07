import { Elysia } from 'elysia'
import { configService } from './service'
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
import { configPlugin } from './plugin'
import { operLogPlugin } from '../oper-log/plugin'
import SysConfig from '@/models/sys-config'

/** 参数配置管理控制器（管理端） */
export const configAdminController = new Elysia({ prefix: '/config', tags: ['管理 - 参数配置'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(configPlugin())
  .use(operLogPlugin())
  .get(
    '/',
    async ({ query }) => {
      const result = await configService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(SysConfig.getSchema(), '参数配置列表') },
      detail: {
        summary: '获取参数配置列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async ({ params }) => {
      const data = await configService.findById(params.id)
      if (!data) return R.notFound('参数配置')
      return R.ok(data)
    },
    {
      params: idParams({ label: '参数配置ID' }),
      response: { 200: SuccessResponse(SysConfig.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取参数配置详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['config:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async ({ body }) => {
      const existing = await configService.findByKey(body.key)
      if (existing) return R.badRequest('参数键名已存在')
      const data = await configService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: SysConfig.getSchema({ exclude: ['id'], required: ['name', 'key', 'value'] }),
      response: { 200: SuccessResponse(SysConfig.getSchema()), 400: ErrorResponse },
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
    async ({ params, body }) => {
      const existing = await configService.findById(params.id)
      if (!existing) return R.notFound('参数配置')
      if (body.key && body.key !== existing.key) {
        const keyExists = await configService.findByKey(body.key)
        if (keyExists) return R.badRequest('参数键名已存在')
      }
      const data = await configService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '参数配置ID' }),
      body: SysConfig.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(SysConfig.getSchema()),
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
    async ({ params }) => {
      const existing = await configService.findById(params.id)
      if (!existing) return R.notFound('参数配置')
      if (existing.isBuiltin === 1) return R.badRequest('系统内置参数不可删除')
      await configService.delete(params.id)
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
