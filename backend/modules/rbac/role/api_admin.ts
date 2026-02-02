import { Elysia, t } from 'elysia'
import { roleService } from './service'
import {
  createRoleBody,
  updateRoleBody,
  roleIdParams,
  roleQueryParams,
  RoleSchema,
  RoleTreeSchema,
} from './model'
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

/** 角色管理控制器（管理端） */
export const roleAdminController = new Elysia({ prefix: '/role', tags: ['管理 - 角色'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  /** 获取角色列表 */
  .get(
    '/',
    async ({ query }) => {
      const result = await roleService.findAll(query)
      return R.page(result)
    },
    {
      query: roleQueryParams,
      response: {
        200: PagedResponse(RoleSchema, '角色列表分页数据'),
      },
      detail: {
        summary: '获取角色列表',
        description: '分页获取角色列表，支持按名称、编码、状态筛选\n\n🔐 **所需权限**: `role:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:list'] } },
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
        200: SuccessResponse(t.Array(RoleTreeSchema), '角色树形结构数据'),
      },
      detail: {
        summary: '获取角色树',
        description: '获取角色的树形结构，包含父子层级关系\n\n🔐 **所需权限**: `role:tree`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:tree'] } },
      },
    },
  )

  /** 根据ID获取角色 */
  .get(
    '/:id',
    async ({ params }) => {
      const data = await roleService.findById(params.id)
      if (!data) return R.notFound('角色')
      return R.ok(data)
    },
    {
      params: roleIdParams,
      response: {
        200: SuccessResponse(RoleSchema, '角色详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取角色详情',
        description: '根据角色ID获取角色详细信息\n\n🔐 **所需权限**: `role:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:read'] } },
      },
    },
  )

  /** 创建角色 */
  .post(
    '/',
    async ({ body }) => {
      // 检查编码是否已存在
      const existing = await roleService.findByCode(body.code)
      if (existing) return R.badRequest('角色编码已存在')
      const data = await roleService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: createRoleBody,
      response: {
        200: SuccessResponse(RoleSchema, '新创建的角色信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建角色',
        description: '创建新角色，角色编码必须唯一\n\n🔐 **所需权限**: `role:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:create'] } },
      },
    },
  )

  /** 更新角色 */
  .put(
    '/:id',
    async ({ params, body }) => {
      const existing = await roleService.findById(params.id)
      if (!existing) return R.notFound('角色')
      // 如果更新编码，检查是否重复
      if (body.code && body.code !== existing.code) {
        const codeExists = await roleService.findByCode(body.code)
        if (codeExists) return R.badRequest('角色编码已存在')
      }
      const data = await roleService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: roleIdParams,
      body: updateRoleBody,
      response: {
        200: SuccessResponse(RoleSchema, '更新后的角色信息'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新角色',
        description: '更新指定角色的信息，支持部分更新\n\n🔐 **所需权限**: `role:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:update'] } },
      },
    },
  )

  /** 删除角色 */
  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await roleService.findById(params.id)
      if (!existing) return R.notFound('角色')
      await roleService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: roleIdParams,
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除角色',
        description: '删除指定角色，此操作不可恢复\n\n🔐 **所需权限**: `role:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['role:delete'] } },
      },
    },
  )

export default roleAdminController
