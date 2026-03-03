import { Elysia, t } from 'elysia'
import { R, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { loginLogPlugin } from '@/plugins/login-log'
import { operLogPlugin } from '@/plugins/oper-log'
import * as session from '@/services/session'

/** Auth 管理控制器（管理端） */
export default new Elysia({ tags: ['管理 - 认证'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(loginLogPlugin())
  .use(operLogPlugin())
  /** 获取在线统计 */
  .get(
    '/admin/stats',
    (ctx) => {
      const stats = session.getStats()
      return R.ok(stats)
    },
    {
      response: {
        200: SuccessResponse(
          t.Object({
            onlineUsers: t.Number({ description: '在线用户数（有会话的独立用户）' }),
            totalSessions: t.Number({ description: '总有效会话数' }),
            activeSessions: t.Number({ description: '活跃会话数（30分钟内有活动）' }),
            activeUsers: t.Number({ description: '活跃用户数（30分钟内有活动）' }),
            todayNewSessions: t.Number({ description: '今日新登录会话数' }),
            expiringSessions: t.Number({ description: '即将过期会话数（1小时内）' }),
          }),
          '在线用户统计数据',
        ),
      },
      detail: {
        summary: '获取在线统计',
        description:
          '获取当前在线用户数和会话数统计（管理员接口）\n\n🔐 **所需权限**: `auth:admin:stats`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['auth:admin:stats'] } },
      },
    },
  )

  /** 获取所有会话（管理员） */
  .get(
    '/admin/sessions',
    (ctx) => {
      const sessions = session.getAllSessions()
      const data = sessions.map((s) => ({
        id: s.id,
        token: s.token,
        tokenPrefix: s.token.slice(0, 8) + '...',
        userId: s.userId,
        username: s.username,
        roleId: s.roleId,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
        ip: s.ip,
        userAgent: s.userAgent,
      }))
      return R.ok(data)
    },
    {
      response: {
        200: SuccessResponse(
          t.Array(
            t.Object({
              id: t.Number({ description: '会话ID' }),
              token: t.String({ description: '完整令牌' }),
              tokenPrefix: t.String({ description: '令牌前缀（脱敏）' }),
              userId: t.Number({ description: '用户ID' }),
              username: t.String({ description: '用户名' }),
              roleId: t.String({ description: '角色编码' }),
              createdAt: t.String({ description: '创建时间' }),
              expiresAt: t.String({ description: '过期时间' }),
              lastActiveAt: t.String({ description: '最后活跃时间' }),
              ip: t.Optional(t.String({ description: 'IP地址' })),
              userAgent: t.Optional(t.String({ description: '客户端信息' })),
            }),
          ),
          '所有用户会话列表',
        ),
      },
      detail: {
        summary: '获取所有会话',
        description:
          '获取系统中所有登录会话列表（管理员接口）\n\n🔐 **所需权限**: `auth:admin:sessions`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['auth:admin:sessions'] } },
      },
    },
  )

  /** 踢用户下线（管理员） */
  .post(
    '/admin/kick-user',
    async (ctx) => {
      const ip =
        ctx.request.headers.get('x-forwarded-for') ||
        ctx.request.headers.get('x-real-ip') ||
        undefined
      const userAgent = ctx.request.headers.get('user-agent') || undefined

      // 获取用户所有会话用于记录日志
      const sessions = session.getUserSessions(ctx.body.userId)
      const count = await session.kickUser(ctx.body.userId)

      // 记录踢下线日志
      for (const session of sessions) {
        await ctx.loginLog.logLogin({
          userId: session.userId,
          username: session.username,
          ip,
          userAgent,
          status: 1,
          action: 'kick',
          msg: '管理员踢下线',
        })
      }

      return R.success(`已踢下线 ${count} 个会话`)
    },
    {
      body: t.Object({
        userId: t.Number({ description: '要踢下线的用户ID' }),
      }),
      response: {
        200: MessageResponse,
      },
      detail: {
        summary: '踢用户下线',
        description:
          '强制指定用户的所有会话下线（管理员接口）\n\n🔐 **所需权限**: `auth:admin:kick-user`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['auth:admin:kick-user'] } },
        operLog: { title: '会话管理', type: 'delete' },
      },
    },
  )

  /** 踢指定会话下线（管理员） */
  .post(
    '/admin/kick-session',
    async (ctx) => {
      const ip =
        ctx.request.headers.get('x-forwarded-for') ||
        ctx.request.headers.get('x-real-ip') ||
        undefined
      const userAgent = ctx.request.headers.get('user-agent') || undefined

      // 先获取会话信息用于记录日志
      const sess = session.verify(ctx.body.token)
      if (!sess) {
        return R.notFound('会话')
      }

      // 记录踢下线日志
      await ctx.loginLog.logLogin({
        userId: sess.userId,
        username: sess.username,
        ip,
        userAgent,
        status: 1,
        action: 'kick',
        msg: '管理员踢下线',
      })

      const success = await session.kickSession(ctx.body.token)
      if (!success) {
        return R.notFound('会话')
      }
      return R.success('踢下线成功')
    },
    {
      body: t.Object({
        token: t.String({ description: '要踢下线的会话令牌' }),
      }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: '踢会话下线',
        description:
          '强制指定会话下线，需要提供完整令牌（管理员接口）\n\n🔐 **所需权限**: `auth:admin:kick-session`',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['auth:admin:kick-session'] } },
        operLog: { title: '会话管理', type: 'delete' },
      },
    },
  )
