import { Elysia, t } from 'elysia'
import * as roleService from '@/services/role'
import { query, tree } from '@/packages/route-model'
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

export default new Elysia({ tags: ['管理 - 角色'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  .get(
    '/',
    async (ctx) => {
      const result = await roleService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(roleService.getSchema(), '角色列表分页数据') },
      detail: {
        summary: '获取角色列表',
        description: '分页获取角色列表\n\n🔐 **所需权限**: `role:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:list'] } },
      },
    },
  )

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
              id: t.String({ description: '角色编码' }),
              name: t.String({ description: '角色名称' }),
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
        description: '获取角色的树形结构\n\n🔐 **所需权限**: `role:admin:tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:tree'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await roleService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('角色')
      return R.ok(data)
    },
    {
      params: t.Object({ id: t.String({ description: '角色编码' }) }),
      response: {
        200: SuccessResponse(roleService.getSchema(), '角色详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色详情',
        description: '根据角色编码获取角色详细信息\n\n🔐 **所需权限**: `role:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const existing = await roleService.findById(ctx.body.id)
      if (existing) return R.badRequest('角色编码已存在')
      const data = await roleService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: roleService.getSchema({ required: ['id', 'name'] }),
      response: {
        200: SuccessResponse(roleService.getSchema(), '新创建的角色信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建角色',
        description: '创建新角色，编码必须唯一\n\n🔐 **所需权限**: `role:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:create'] } },
        operLog: { title: '角色管理', type: 'create' },
      },
    },
  )

  .put(
    '/:id',
    async (ctx) => {
      const existing = await roleService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色')
      const data = await roleService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: t.Object({ id: t.String({ description: '角色编码' }) }),
      body: roleService.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(roleService.getSchema(), '更新后的角色信息'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新角色',
        description: '更新指定角色的信息\n\n🔐 **所需权限**: `role:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:update'] } },
        operLog: { title: '角色管理', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await roleService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色')
      await roleService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: t.Object({ id: t.String({ description: '角色编码' }) }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除角色',
        description: '删除指定角色\n\n🔐 **所需权限**: `role:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:admin:delete'] } },
        operLog: { title: '角色管理', type: 'delete' },
      },
    },
  )
