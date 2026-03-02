/**
 * 通用 CRUD 通配接口（客户端/管理端通用）
 * 从 modules/crud/main/api.ts 迁移
 *
 * 路由: /api/crud/:tableName
 * 为每个已注册到 crudRegistry 的 ORM Model 提供基础的增删改查 API。
 */

import { Elysia, t } from 'elysia'
import { query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { crudRegistry } from '@/services/crud-table'
import { buildWhere, checkCreateScope } from '@/core/crud'

export default new Elysia({ tags: ['通用 - CRUD'] })
  .use(authPlugin())
  .use(rbacPlugin())

  // 查看已注册表列表
  .get(
    '/',
    () => {
      return R.ok(crudRegistry.list())
    },
    {
      response: {
        200: SuccessResponse(t.Array(t.String()), '已注册的表名列表'),
      },
      detail: {
        summary: '获取已注册CRUD表列表',
        description: '获取所有已注册到通配接口的表名\n\n🔐 **所需权限**: `crud:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:list'] } },
      },
    },
  )

  // 分页列表
  .get(
    '/:tableName',
    async (ctx) => {
      const m = crudRegistry.get(ctx.params.tableName)
      if (!m) return R.notFound('CRUD表')
      const result = await m.page({
        where: buildWhere(m.tableName, ctx.query.filter, ctx),
        page: ctx.query.page,
        pageSize: ctx.query.pageSize,
      })
      return R.page(result)
    },
    {
      params: t.Object({ tableName: t.String({ description: '表名' }) }),
      query: query(),
      response: {
        200: PagedResponse(t.Any(), '通用数据列表'),
        404: ErrorResponse,
      },
      detail: {
        summary: '通用CRUD列表查询',
        description:
          '根据表名查询数据列表（分页），自动应用数据权限过滤\n\n🔐 **所需权限**: `crud:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:list'] } },
      },
    },
  )

  // 详情
  .get(
    '/:tableName/:id',
    async (ctx) => {
      const m = crudRegistry.get(ctx.params.tableName)
      if (!m) return R.notFound('CRUD表')
      const data = await m.findOne({ where: buildWhere(m.tableName, `id = ${ctx.params.id}`, ctx) })
      if (!data) return R.notFound('记录')
      return R.ok(data)
    },
    {
      params: t.Object({
        tableName: t.String({ description: '表名' }),
        id: t.Numeric({ description: '记录ID' }),
      }),
      response: {
        200: SuccessResponse(t.Any(), '记录详情'),
        404: ErrorResponse,
      },
      detail: {
        summary: '通用CRUD详情查询',
        description:
          '根据表名和ID查询单条记录，自动应用数据权限过滤\n\n🔐 **所需权限**: `crud:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:read'] } },
      },
    },
  )

  // 创建
  .post(
    '/:tableName',
    async (ctx) => {
      const m = crudRegistry.get(ctx.params.tableName)
      if (!m) return R.notFound('CRUD表')
      try {
        if (!checkCreateScope(m.tableName, ctx.body as Record<string, any>, ctx))
          return R.forbidden('无权创建')
        const data = await m.create(ctx.body as any)
        return R.ok(data, '创建成功')
      } catch (e: any) {
        return R.badRequest(e.message || '创建失败')
      }
    },
    {
      params: t.Object({ tableName: t.String({ description: '表名' }) }),
      body: t.Any({ description: '创建数据（JSON对象）' }),
      response: {
        200: SuccessResponse(t.Any(), '新创建的记录'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '通用CRUD创建',
        description: '在指定表中创建新记录\n\n🔐 **所需权限**: `crud:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:create'] } },
      },
    },
  )

  // 更新
  .put(
    '/:tableName/:id',
    async (ctx) => {
      const m = crudRegistry.get(ctx.params.tableName)
      if (!m) return R.notFound('CRUD表')
      try {
        const w = buildWhere(m.tableName, `id = ${ctx.params.id}`, ctx)
        if (!w) return R.forbidden('无权更新或记录不存在')
        const n = await m.updateMany(w, ctx.body as any)
        if (n === 0) return R.forbidden('无权更新或记录不存在')
        const data = await m.getOne(ctx.params.id as any)
        return R.ok(data, '更新成功')
      } catch (e: any) {
        return R.badRequest(e.message || '更新失败')
      }
    },
    {
      params: t.Object({
        tableName: t.String({ description: '表名' }),
        id: t.Numeric({ description: '记录ID' }),
      }),
      body: t.Any({ description: '更新数据（JSON对象，部分更新）' }),
      response: {
        200: SuccessResponse(t.Any(), '更新后的记录'),
        400: ErrorResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '通用CRUD更新',
        description:
          '更新指定表中的记录，自动应用数据权限过滤\n\n🔐 **所需权限**: `crud:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:update'] } },
      },
    },
  )

  // 删除
  .delete(
    '/:tableName/:id',
    async (ctx) => {
      const m = crudRegistry.get(ctx.params.tableName)
      if (!m) return R.notFound('CRUD表')
      const w = buildWhere(m.tableName, `id = ${ctx.params.id}`, ctx)
      if (!w) return R.forbidden('无权删除或记录不存在')
      const ok = (await m.deleteMany(w)) > 0
      if (!ok) return R.forbidden('无权删除或记录不存在')
      return R.success('删除成功')
    },
    {
      params: t.Object({
        tableName: t.String({ description: '表名' }),
        id: t.Numeric({ description: '记录ID' }),
      }),
      response: {
        200: MessageResponse,
        403: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '通用CRUD删除',
        description:
          '删除指定表中的记录，自动应用数据权限过滤\n\n🔐 **所需权限**: `crud:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:delete'] } },
      },
    },
  )
