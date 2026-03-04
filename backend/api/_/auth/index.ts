import { Elysia, t } from 'elysia'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { loginLogPlugin } from '@/plugins/login-log'
import * as auth from '@/services/auth'
import * as session from '@/services/session'

export default new Elysia({ tags: ['客户端 - 认证'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(loginLogPlugin())
  /** 用户登录 */
  .post(
    '/login',
    async ({ body, request, loginLog }) => {
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined

      try {
        const result = await auth.login(body.username, body.password, {
          ip,
          userAgent,
        })

        // 记录登录日志
        await loginLog.logLogin({
          userId: result.user.id,
          username: body.username,
          ip,
          userAgent,
          status: 1,
          action: 'login',
          msg: '登录成功',
        })

        return R.ok({ token: result.token, user: result.user }, '登录成功')
      } catch (error: any) {
        // 记录失败登录日志
        await loginLog.logLogin({
          username: body.username,
          ip,
          userAgent,
          status: 0,
          action: 'login',
          msg: error.message,
        })

        return R.badRequest(error.message)
      }
    },
    {
      body: t.Object({
        username: t.String({ description: '用户名', minLength: 1 }),
        password: t.String({ description: '密码', minLength: 1 }),
      }),
      response: {
        200: SuccessResponse(
          t.Object({
            token: t.String({ description: 'JWT访问令牌' }),
            user: t.Object({
              id: t.Number({ description: '用户ID' }),
              username: t.String({ description: '用户名' }),
              nickname: t.Nullable(t.String({ description: '昵称' })),
              roleId: t.String({ description: '角色编码' }),
            }),
          }),
          '登录成功返回令牌和用户信息',
        ),
        400: ErrorResponse,
      },
      detail: {
        auth: {
          skipAuth: true,
        },
        summary: '用户登录',
        description: '使用用户名和密码进行登录，返回访问令牌和用户基本信息',
      },
    },
  )

  /** 用户注册 */
  .post(
    '/register',
    async ({ body }) => {
      const result = await auth.register(body)
      return R.ok({ userId: result.userId }, '注册成功')
    },
    {
      body: t.Object({
        username: t.String({ description: '用户名', minLength: 2, maxLength: 50 }),
        password: t.String({ description: '密码', minLength: 6, maxLength: 100 }),
        nickname: t.Optional(t.String({ description: '昵称', maxLength: 50 })),
        email: t.Optional(t.String({ description: '邮箱', format: 'email' })),
        phone: t.Optional(t.String({ description: '手机号' })),
      }),
      response: {
        200: SuccessResponse(
          t.Object({
            userId: t.Number({ description: '新用户ID' }),
          }),
          '注册成功返回用户ID',
        ),
        400: ErrorResponse,
      },
      detail: {
        auth: {
          skipAuth: true,
        },
        summary: '用户注册',
        description: '注册新用户账号，用户名不能重复',
      },
    },
  )

  /** 用户登出 */
  .post(
    '/logout',
    async ({ request, loginLog }) => {
      const authHeader = request.headers.get('Authorization')
      const ip =
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
      const userAgent = request.headers.get('user-agent') || undefined

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        // 先获取会话信息用于记录日志
        const sess = session.verify(token)
        if (sess) {
          // 记录登出日志
          await loginLog.logLogin({
            userId: sess.userId,
            username: sess.username,
            ip,
            userAgent,
            status: 1,
            action: 'logout',
            msg: '用户登出',
          })
        }
        await session.remove(token)
      }
      return R.success('登出成功')
    },
    {
      response: {
        200: MessageResponse,
      },
      detail: {
        summary: '用户登出',
        description: '退出登录，销毁当前会话令牌',
        auth: {
          skipAuth: true,
        },
      },
    },
  )

  /** 获取当前用户信息 */
  .get(
    '/me',
    async ({ request }) => {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return R.unauthorized()
      }

      const token = authHeader.slice(7)
      const user = await auth.getCurrentUser(token)

      if (!user) {
        return R.unauthorized('登录已过期')
      }

      return R.ok(user)
    },
    {
      response: {
        200: SuccessResponse(
          t.Object({
            id: t.Number({ description: '用户ID' }),
            username: t.String({ description: '用户名' }),
            nickname: t.Nullable(t.String({ description: '昵称' })),
            roleId: t.String({ description: '角色编码' }),
            email: t.Nullable(t.String({ description: '邮箱' })),
            phone: t.Nullable(t.String({ description: '手机号' })),
            status: t.Number({ description: '状态：1-正常, 0-禁用' }),
          }),
          '当前登录用户详细信息',
        ),
        401: ErrorResponse,
      },
      detail: {
        summary: '获取当前用户信息',
        description: '获取当前登录用户的详细信息，包括用户名、昵称、角色等',
      },
    },
  )

  /** 刷新 token */
  .post(
    '/refresh',
    async ({ request }) => {
      const authHeader = request.headers.get('Authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return R.unauthorized()
      }

      const token = authHeader.slice(7)
      const sess = await session.refresh(token)

      if (!sess) {
        return R.unauthorized('登录已过期')
      }

      return R.ok({ expiresAt: sess.expiresAt }, '刷新成功')
    },
    {
      response: {
        200: SuccessResponse(
          t.Object({
            expiresAt: t.String({ description: '新的过期时间' }),
          }),
          '令牌刷新成功',
        ),
        401: ErrorResponse,
      },
      detail: {
        summary: '刷新令牌',
        description: '刷新访问令牌的有效期，延长登录状态',
      },
    },
  )

  /** 修改密码 */
  .post(
    '/change-password',
    async (ctx) => {
      const userId = (ctx as any).userId as number | null
      if (!userId) {
        return R.unauthorized()
      }

      await auth.changePassword(userId, ctx.body.oldPassword, ctx.body.newPassword)
      return R.success('密码修改成功')
    },
    {
      body: t.Object({
        oldPassword: t.String({ description: '原密码', minLength: 1 }),
        newPassword: t.String({ description: '新密码', minLength: 6, maxLength: 100 }),
      }),
      response: {
        200: MessageResponse,
      },
      detail: {
        summary: '修改密码',
        description: '修改当前登录用户的密码',
      },
    },
  )
