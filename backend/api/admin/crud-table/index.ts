/**
 * CRUD 表配置管理控制器（管理端）
 * 从 modules/crud/main/api_admin.ts 迁移
 */

import { Elysia } from 'elysia'
import * as crudTableService from '@/services/crud-table'
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
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({ tags: ['管理 - CRUD表配置'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(operLogPlugin())

  // 列表
  .get(
    '/',
    async (ctx) => {
      const result = await crudTableService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(crudTableService.getSchema(), 'CRUD表配置列表') },
      detail: {
        summary: '获取CRUD表配置列表',
        description: '分页获取CRUD表配置列表\n\n🔐 **所需权限**: `crud:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:list'] } },
      },
    },
  )

  // 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await crudTableService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('CRUD表配置')
      return R.ok(data)
    },
    {
      params: idParams({ label: 'CRUD表配置ID' }),
      response: { 200: SuccessResponse(crudTableService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取CRUD表配置详情',
        description: '根据ID获取CRUD表配置详情\n\n🔐 **所需权限**: `crud:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:read'] } },
      },
    },
  )

  // 创建
  .post(
    '/',
    async (ctx) => {
      // 检查表名唯一性
      const existing = await crudTableService.findByTableName(ctx.body.tableName)
      if (existing) return R.badRequest('表名已存在')

      const data = await crudTableService.create({ ...ctx.body, createBy: ctx.userId! }, ctx)
      if (!data) return R.forbidden('无权创建')
      return R.ok(data, '创建成功')
    },
    {
      body: crudTableService.getSchema({
        exclude: ['id', 'createBy'],
        timestamps: false,
        required: ['tableName', 'displayName'],
      }),
      response: { 200: SuccessResponse(crudTableService.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '创建CRUD表配置',
        description: '创建新的CRUD表配置\n\n🔐 **所需权限**: `crud:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:create'] } },
        operLog: { title: 'CRUD表配置', type: 'create' },
      },
    },
  )

  // 更新
  .put(
    '/:id',
    async (ctx) => {
      const data = await crudTableService.update(ctx.params.id, ctx.body, ctx)
      if (!data) return R.forbidden('无权更新或CRUD表配置不存在')
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: 'CRUD表配置ID' }),
      body: crudTableService.getSchema({ exclude: ['id', 'createBy'], partial: true }),
      response: {
        200: SuccessResponse(crudTableService.getSchema()),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新CRUD表配置',
        description: '更新CRUD表配置信息\n\n🔐 **所需权限**: `crud:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:update'] } },
        operLog: { title: 'CRUD表配置', type: 'update' },
      },
    },
  )

  // 删除
  .delete(
    '/:id',
    async (ctx) => {
      const ok = await crudTableService.remove(ctx.params.id, ctx)
      if (!ok) return R.forbidden('无权删除或CRUD表配置不存在')
      return R.success('删除成功')
    },
    {
      params: idParams({ label: 'CRUD表配置ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除CRUD表配置',
        description: '删除CRUD表配置\n\n🔐 **所需权限**: `crud:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:delete'] } },
        operLog: { title: 'CRUD表配置', type: 'delete' },
      },
    },
  )
