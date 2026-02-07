import { Elysia, t } from 'elysia'
import { userService } from './service'
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
import User from '@/models/users'

/** 用户管理控制器（管理端） */
export const userAdminController = new Elysia({ prefix: '/users', tags: ['管理 - 用户'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
  /** 获取用户列表 */
  .get(
    '/',
    async ({ query }) => {
      const result = await userService.findAll(query)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(User.getSchema(), '用户列表分页数据'),
      },
      detail: {
        summary: '获取用户列表',
        description:
          '分页获取用户列表，支持按用户名、昵称、状态、角色筛选\n\n🔐 **所需权限**: `user:admin:list`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:list'] } },
      },
    },
  )

  /** 根据ID获取用户 */
  .get(
    '/:id',
    async ({ params }) => {
      const data = await userService.findById(params.id)
      if (!data) return R.notFound('用户')
      // 不返回密码
      const { password, ...userWithoutPassword } = data
      return R.ok(userWithoutPassword)
    },
    {
      params: idParams({ label: '用户ID' }),
      response: {
        200: SuccessResponse(User.getSchema(), '用户详情数据'),
        404: ErrorResponse,
      },
      detail: {
        summary: '获取用户详情',
        description: '根据用户ID获取用户详细信息（不含密码）\n\n🔐 **所需权限**: `user:admin:read`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:read'] } },
      },
    },
  )

  /** 创建用户 */
  .post(
    '/',
    async ({ body }) => {
      // 检查用户名是否已存在
      const existing = await userService.findByUsername(body.username)
      if (existing) return R.badRequest('用户名已存在')
      const data = await userService.create(body)
      return R.ok(data, '创建成功')
    },
    {
      body: User.getSchema(
        { exclude: ['id'], required: ['username', 'password'] },
        {
          confirmPassword: t.String({ description: '确认密码', minLength: 6, maxLength: 100 }),
        },
      ),
      response: {
        200: SuccessResponse(User.getSchema(), '新创建的用户信息'),
        400: ErrorResponse,
      },
      detail: {
        summary: '创建用户',
        description: '创建新用户，用户名必须唯一\n\n🔐 **所需权限**: `user:admin:create`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:create'] } },
        operLog: { title: '用户管理', type: 'create' },
      },
    },
  )

  /** 更新用户 */
  .put(
    '/:id',
    async ({ params, body }) => {
      const existing = await userService.findById(params.id)
      if (!existing) return R.notFound('用户')
      const data = await userService.update(params.id, body)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '用户ID' }),
      body: User.getSchema({ exclude: ['id', 'password'], partial: true }),
      response: {
        200: SuccessResponse(User.getSchema(), '更新后的用户信息'),
        404: ErrorResponse,
      },
      detail: {
        summary: '更新用户',
        description: '更新指定用户的信息，支持部分更新\n\n🔐 **所需权限**: `user:admin:update`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:update'] } },
        operLog: { title: '用户管理', type: 'update' },
      },
    },
  )

  /** 删除用户 */
  .delete(
    '/:id',
    async ({ params }) => {
      const existing = await userService.findById(params.id)
      if (!existing) return R.notFound('用户')
      await userService.delete(params.id)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '用户ID' }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '删除用户',
        description: '删除指定用户，此操作不可恢复\n\n🔐 **所需权限**: `user:admin:delete`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:delete'] } },
        operLog: { title: '用户管理', type: 'delete' },
      },
    },
  )

export default userAdminController
