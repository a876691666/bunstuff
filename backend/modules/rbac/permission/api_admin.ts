import { Elysia } from 'elysia'
import { permissionService } from './service'
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
import Permission from '@/models/permission'

/** 权限管理控制器（管理端） */
export const permissionAdminController = new Elysia({
  prefix: '/permission',
  tags: ['管理 - 权限'],
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
  /** 获取权限列表 */
  .get(
    '/',
    async ({ query }) => {
      const result = await permissionService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(Permission.getSchema(), '权限列表分页数据'),
      },
      detail: {
        summary: '获取权限列表',
        description:
          '分页获取权限列表，支持按名称、编码、资源筛选\n\n🔐 **所需权限**: `permission:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:list'] } },
      },
    },
  )

  /** 根据ID获取权限 */
  .get(
    '/:id',
    async ({ params }) => {
      const data = await permissionService.findById(params.id)
      if (!data) return R.notFound('权限')
      return R.ok(data)
    },
    {
      params: idParams({ label: '权限ID' }),
      response: {
        200: SuccessResponse(Permission.getSchema(), '权限详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取权限详情',
        description: '根据权限ID获取权限详细信息\n\n🔐 **所需权限**: `permission:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:read'] } },
      },
    },
  )

  /** 创建权限 */
  .post(
    '/',
    async ({ body }) => {
      // 检查编码是否已存在
      const existing = await permissionService.findByCode(body.code)
      if (existing) return R.badRequest('权限编码已存在')
      const data = await permissionService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: Permission.getSchema({ exclude: ['id'], required: ['name', 'code'] }),
      response: {
        200: SuccessResponse(Permission.getSchema(), '新创建的权限信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建权限',
        description:
          '创建新权限，权限编码必须唯一，格式建议：资源:操作，如 user:create\n\n🔐 **所需权限**: `permission:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:create'] } },
        operLog: { title: '权限管理', type: 'create' },
      },
    },
  )

  /** 更新权限 */
  .put(
    '/:id',
    async ({ params, body }) => {
      const existing = await permissionService.findById(params.id)
      if (!existing) return R.notFound('权限')
      // 如果更新编码，检查是否重复
      if (body.code && body.code !== existing.code) {
        const codeExists = await permissionService.findByCode(body.code)
        if (codeExists) return R.badRequest('权限编码已存在')
      }
      const data = await permissionService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '权限ID' }),
      body: Permission.getSchema({ exclude: ['id'], partial: true }),
      response: {
        200: SuccessResponse(Permission.getSchema(), '更新后的权限信息'),
        400: ErrorResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '更新权限',
        description:
          '更新指定权限的信息，支持部分更新\n\n🔐 **所需权限**: `permission:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:update'] } },
        operLog: { title: '权限管理', type: 'update' },
      },
    },
  )

  /** 删除权限 */
  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await permissionService.findById(params.id)
      if (!existing) return R.notFound('权限')
      await permissionService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '权限ID' }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除权限',
        description: '删除指定权限，此操作不可恢复\n\n🔐 **所需权限**: `permission:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['permission:admin:delete'] } },
        operLog: { title: '权限管理', type: 'delete' },
      },
    },
  )

export default permissionAdminController
