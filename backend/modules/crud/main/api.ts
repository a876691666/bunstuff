import { Elysia, t } from 'elysia'
import { query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/modules/response'
import { authPlugin } from '@/modules/auth'
import { rbacPlugin } from '@/modules/rbac'
import { crudRegistry } from './service'

/**
 * 通用 CRUD 通配接口
 *
 * 路由: /crud/:tableName
 * 为每个已注册到 crudRegistry 的 ORM Model 提供基础的增删改查 API。
 * 所有操作均通过 CrudService 完成，自动集成 dataScope SSQL 数据权限过滤。
 *
 * 权限: crud:admin:list / crud:admin:read / crud:admin:create / crud:admin:update / crud:admin:delete
 * 数据过滤: 借助 permission-scope 表的 tableName 字段做 SSQL 数据过滤
 */
export const crudController = new Elysia({ prefix: '/crud', tags: ['通用 - CRUD'] })
  .use(authPlugin())
  .use(rbacPlugin())

  // 分页列表
  .get(
    '/:tableName',
    async (ctx) => {
      const service = crudRegistry.get(ctx.params.tableName)
      if (!service) return R.notFound('CRUD表')
      const result = await service.findAll(ctx.query, ctx)
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
      const service = crudRegistry.get(ctx.params.tableName)
      if (!service) return R.notFound('CRUD表')
      const data = await service.findById(ctx.params.id, ctx)
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
      const service = crudRegistry.get(ctx.params.tableName)
      if (!service) return R.notFound('CRUD表')
      try {
        const data = await service.create(ctx.body as any, ctx)
        if (!data) return R.forbidden('无权创建')
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
        description:
          '在指定表中创建新记录\n\n🔐 **所需权限**: `crud:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:create'] } },
      },
    },
  )

  // 更新
  .put(
    '/:tableName/:id',
    async (ctx) => {
      const service = crudRegistry.get(ctx.params.tableName)
      if (!service) return R.notFound('CRUD表')
      try {
        const data = await service.update(ctx.params.id, ctx.body as any, ctx)
        if (!data) return R.forbidden('无权更新或记录不存在')
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
      const service = crudRegistry.get(ctx.params.tableName)
      if (!service) return R.notFound('CRUD表')
      const ok = await service.delete(ctx.params.id, ctx)
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
        description:
          '获取所有已注册到通配接口的表名\n\n🔐 **所需权限**: `crud:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['crud:admin:list'] } },
      },
    },
  )
