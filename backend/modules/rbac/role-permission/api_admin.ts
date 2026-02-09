import { Elysia, t } from 'elysia'
import { rolePermissionService } from './service'
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
import { operLogPlugin } from '@/modules/system'
import RolePermission from '@/models/role-permission'

/** 角色权限关联管理控制器（管理端） */
export const rolePermissionAdminController = new Elysia({
  prefix: '/role-permission',
  tags: ['管理 - 角色权限'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
  /** 获取角色权限关联列表 */
  .get(
    '/',
    async (ctx) => {
      const result = await rolePermissionService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(
          RolePermission.getSchema({ timestamps: false }),
          '角色权限关联列表分页数据',
        ),
      },
      detail: {
        summary: '获取角色权限关联列表',
        description:
          '分页获取角色权限关联列表，支持按角色ID、权限ID、权限范围ID筛选\n\n🔐 **所需权限**: `role-permission:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:list'] } },
      },
    },
  )

  /** 获取角色的权限ID列表 */
  .get(
    '/role/:roleId/permissions',
    async ({ params }) => {
      const data = await rolePermissionService.findPermissionIdsByRoleId(params.roleId)
      return R.ok(data)
    },
    {
      params: t.Object({ roleId: t.Numeric({ description: '角色ID' }) }),
      response: {
        200: SuccessResponse(t.Array(t.Number({ description: '权限ID' })), '角色关联的权限ID列表'),
      },
      detail: {
        summary: '获取角色的权限ID列表',
        description:
          '获取指定角色关联的所有权限ID，用于权限分配\n\n🔐 **所需权限**: `role-permission:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:list'] } },
      },
    },
  )

  /** 根据ID获取角色权限关联 */
  .get(
    '/:id',
    async (ctx) => {
      const data = await rolePermissionService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('角色权限关联')
      return R.ok(data)
    },
    {
      params: idParams({ label: '角色权限关联ID' }),
      response: {
        200: SuccessResponse(
          RolePermission.getSchema({ timestamps: false }),
          '角色权限关联详情数据',
        ),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色权限关联详情',
        description:
          '根据ID获取角色权限关联详细信息\n\n🔐 **所需权限**: `role-permission:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:read'] } },
      },
    },
  )

  /** 创建角色权限关联 */
  .post(
    '/',
    async (ctx) => {
      const data = await rolePermissionService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: RolePermission.getSchema({
        exclude: ['id'],
        required: ['roleId', 'permissionId'],
        timestamps: false,
      }),
      response: {
        200: SuccessResponse(
          RolePermission.getSchema({ timestamps: false }),
          '新创建的角色权限关联信息',
        ),
      },
      detail: {
        summary: '创建角色权限关联',
        description: '为角色添加单个权限关联\n\n🔐 **所需权限**: `role-permission:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:create'] } },
        operLog: { title: '角色权限', type: 'create' },
      },
    },
  )

  /** 批量设置角色权限 */
  .post(
    '/batch',
    async (ctx) => {
      const data = await rolePermissionService.batchSetRolePermissions(
        ctx.body.roleId,
        ctx.body.permissionIds,
        ctx,
      )
      return R.ok(data, '设置成功')
    },
    {
      body: t.Object({
        roleId: t.Number({ description: '角色ID' }),
        permissionIds: t.Array(t.Number({ description: '权限ID' }), { description: '权限ID列表' }),
      }),
      response: {
        200: SuccessResponse(
          t.Array(RolePermission.getSchema({ timestamps: false })),
          '批量创建的角色权限关联列表',
        ),
      },
      detail: {
        summary: '批量设置角色权限',
        description:
          '批量设置角色的权限关联，会先删除原有关联再创建新的（全量更新）\n\n🔐 **所需权限**: `role-permission:admin:batch`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:batch'] } },
        operLog: { title: '角色权限', type: 'update' },
      },
    },
  )

  /** 删除角色权限关联 */
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await rolePermissionService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('角色权限关联')
      await rolePermissionService.delete(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '角色权限关联ID' }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除角色权限关联',
        description: '删除指定的角色权限关联\n\n🔐 **所需权限**: `role-permission:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role-permission:admin:delete'] } },
        operLog: { title: '角色权限', type: 'delete' },
      },
    },
  )

export default rolePermissionAdminController
