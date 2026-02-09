import { Elysia, t } from 'elysia'
import { roleService } from './service'
import { idParams, query, tree } from '@/packages/route-model'
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
import { operLogPlugin } from '@/modules/system'
import Role from '@/models/role'

/** 角色管理控制器（管理端） */
export const roleAdminController = new Elysia({ prefix: '/role', tags: ['管理 - 角色'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
  /** 获取角色列表 */
  .get(
    '/',
    async (ctx) => {
      const result = await roleService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(Role.getSchema(), '角色列表分页数据'),
      },
      detail: {
        summary: '获取角色列表',
        description:
          '分页获取角色列表，支持按名称、编码、状态筛选\n\n🔐 **所需权限**: `role:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:list'] } },
      },
    },
  )

  /** 获取角色树 */
  .get(
    '/tree',
    async () => {
      const data = await roleService.getTree()
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            tree({
              id: t.Number({ description: '角色ID' }),
              parentId: t.Nullable(t.Number({ description: '父角色ID' })),
              name: t.String({ description: '角色名称' }),
              code: t.String({ description: '角色编码' }),
              status: t.Number({ description: '状态：1启用 0禁用' }),
              sort: t.Number({ description: '排序值' }),
              description: t.Nullable(t.String({ description: '角色描述' })),
            }),
          ),
          '角色树形结构数据',
        ),
      },
      detail: {
        summary: '获取角色树',
        description: '获取角色的树形结构，包含父子层级关系\n\n🔐 **所需权限**: `role:admin:tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:tree'] } },
      },
    },
  )

  /** 根据ID获取角色 */
  .get(
    '/:id',
    async (ctx) => {
      const data = await roleService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('角色')
      return R.ok(data)
    },
    {
      params: idParams({ label: '角色ID' }),
      response: {
        200: SuccessResponse(Role.getSchema(), '角色详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色详情',
        description: '根据角色ID获取角色详细信息\n\n🔐 **所需权限**: `role:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:read'] } },
      },
    },
  )

  /** 创建角色 */
  .post(
    '/',
    async (ctx) => {
      // 检查编码是否已存在
      const existing = await roleService.findByCode(ctx.body.code)
      if (existing) return R.badRequest('角色编码已存在')
      const data = await roleService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: Role.getSchema({ exclude: ['id'], required: ['name', 'code'] }),
      response: {
        200: SuccessResponse(Role.getSchema(), '新创建的角色信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建角色',
        description: '创建新角色，角色编码必须唯一\n\n🔐 **所需权限**: `role:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:create'] } },
        operLog: { title: '角色管理', type: 'create' },
      },
    },
  )

  /** 更新角色 */
  .put(
    '/:id',
    async (ctx) => {
      const existing = await roleService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色')
      // 如果更新编码，检查是否重复
      if (ctx.body.code && ctx.body.code !== existing.code) {
        const codeExists = await roleService.findByCode(ctx.body.code)
        if (codeExists) return R.badRequest('角色编码已存在')
      }
      const data = await roleService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '角色ID' }),
      body: Role.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(Role.getSchema(), '更新后的角色信息'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新角色',
        description: '更新指定角色的信息，支持部分更新\n\n🔐 **所需权限**: `role:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:update'] } },
        operLog: { title: '角色管理', type: 'update' },
      },
    },
  )

  /** 删除角色 */
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await roleService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色')
      await roleService.delete(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '角色ID' }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除角色',
        description: '删除指定角色，此操作不可恢复\n\n🔐 **所需权限**: `role:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:delete'] } },
        operLog: { title: '角色管理', type: 'delete' },
      },
    },
  )

export default roleAdminController
