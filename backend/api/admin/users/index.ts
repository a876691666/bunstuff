import { Elysia, t } from 'elysia'
import * as userService from '@/services/user'
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

export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  /** 获取用户列表 */
  .get(
    '/',
    async (ctx) => {
      const result = await userService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: {
        200: PagedResponse(userService.getSchema(), '用户列表分页数据'),
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
    async (ctx) => {
      const data = await userService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('用户')
      const { password, ...userWithoutPassword } = data
      return R.ok(userWithoutPassword)
    },
    {
      params: idParams({ label: '用户ID' }),
      response: {
        200: SuccessResponse(userService.getSchema(), '用户详情数据'),
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
    async (ctx) => {
      const existing = await userService.findByUsername(ctx.body.username)
      if (existing) return R.badRequest('用户名已存在')
      const data = await userService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: userService.getSchema(
        { exclude: ['id'], required: ['username', 'password'] },
        {
          confirmPassword: t.String({ description: '确认密码', minLength: 6, maxLength: 100 }),
        },
      ),
      response: {
        200: SuccessResponse(userService.getSchema(), '新创建的用户信息'),
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
    async (ctx) => {
      const existing = await userService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('用户')
      const data = await userService.update(ctx.params.id, ctx.body, ctx)
      return R.ok(data, '更新成功')
    },
    {
      params: idParams({ label: '用户ID' }),
      body: userService.getSchema({ exclude: ['id', 'password'], partial: true }),
      response: {
        200: SuccessResponse(userService.getSchema(), '更新后的用户信息'),
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
    async (ctx) => {
      const existing = await userService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('用户')
      await userService.remove(ctx.params.id, ctx)
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
