import { Elysia, t } from 'elysia'
import * as roleMenuService from '@/services/role-menu'
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

export default new Elysia({ tags: ['管理 - 角色菜单'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  .get(
    '/',
    async (ctx) => {
      const result = await roleMenuService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(
          roleMenuService.getSchema({ timestamps: false }),
          '角色菜单关联列表分页数据',
        ),
      },
      detail: {
        summary: '获取角色菜单关联列表',
        description: '分页获取角色菜单关联列表\n\n🔐 **所需权限**: `role-menu:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:list'] } },
      },
    },
  )

  .get(
    '/role/:roleId/menus',
    async ({ params }) => {
      const data = await roleMenuService.findMenuIdsByRoleId(params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(t.Array(t.Number({ description: '菜单ID' })), '角色关联的菜单ID列表'),
      },
      detail: {
        summary: '获取角色的菜单ID列表',
        description: '获取指定角色关联的所有菜单ID\n\n🔐 **所需权限**: `role-menu:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:list'] } },
      },
    },
  )

  .get(
    '/:id',
    async (ctx) => {
      const data = await roleMenuService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('角色菜单关联')
      return R.ok(data)
    },
    {
      params: idParams({ label: '角色菜单关联ID' }),
      response: {
        200: SuccessResponse(
          roleMenuService.getSchema({ timestamps: false }),
          '角色菜单关联详情数据',
        ),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色菜单关联详情',
        description: '根据ID获取角色菜单关联详细信息\n\n🔐 **所需权限**: `role-menu:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:read'] } },
      },
    },
  )

  .post(
    '/',
    async (ctx) => {
      const data = await roleMenuService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: roleMenuService.getSchema({
        exclude: ['id'],
        required: ['roleId', 'menuId'],
        timestamps: false,
      }),
      response: {
        200: SuccessResponse(
          roleMenuService.getSchema({ timestamps: false }),
          '新创建的角色菜单关联信息',
        ),
      },
      detail: {
        summary: '创建角色菜单关联',
        description: '为角色添加单个菜单关联\n\n🔐 **所需权限**: `role-menu:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:create'] } },
        operLog: { title: '角色菜单', type: 'create' },
      },
    },
  )

  .post(
    '/batch',
    async (ctx) => {
      const data = await roleMenuService.batchSetRoleMenus(ctx.body.roleId, ctx.body.menuIds, ctx)
      return R.ok(data, '设置成功')
    },
    {
      body: t.Object({
        roleId: t.Number({ description: '角色ID' }),
        menuIds: t.Array(t.Number({ description: '菜单ID' }), { description: '菜单ID列表' }),
      }),
      response: {
        200: SuccessResponse(
          t.Array(roleMenuService.getSchema({ timestamps: false })),
          '批量创建的角色菜单关联列表',
        ),
      },
      detail: {
        summary: '批量设置角色菜单',
        description:
          '批量设置角色的菜单关联（全量更新）\n\n🔐 **所需权限**: `role-menu:admin:batch`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:batch'] } },
        operLog: { title: '角色菜单', type: 'update' },
      },
    },
  )

  .delete(
    '/:id',
    async (ctx) => {
      const existing = await roleMenuService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色菜单关联')
      await roleMenuService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '角色菜单关联ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除角色菜单关联',
        description: '删除指定的角色菜单关联\n\n🔐 **所需权限**: `role-menu:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-menu:admin:delete'] } },
        operLog: { title: '角色菜单', type: 'delete' },
      },
    },
  )
