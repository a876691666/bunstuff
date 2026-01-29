/**
 * Auth 模块控制器
 */

import { Elysia, t } from "elysia";
import { authService } from "./service";
import { R, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** Auth 模块控制器 */
export const authController = new Elysia({ prefix: "/auth", tags: ["认证管理"] })
  /** 用户登录 */
  .post(
    "/login",
    async ({ body, request }) => {
      const ip = request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 undefined;
      const userAgent = request.headers.get("user-agent") || undefined;

      const result = await authService.login(body.username, body.password, {
        ip,
        userAgent,
      });

      if (!result.success) {
        return R.badRequest(result.message!);
      }

      return R.ok({ token: result.token, user: result.user }, result.message);
    },
    {
      body: t.Object({
        username: t.String({ description: "用户名", minLength: 1 }),
        password: t.String({ description: "密码", minLength: 1 }),
      }),
      response: {
        200: SuccessResponse(t.Object({
          token: t.String({ description: "JWT访问令牌" }),
          user: t.Object({
            id: t.Number({ description: "用户ID" }),
            username: t.String({ description: "用户名" }),
            nickname: t.Nullable(t.String({ description: "昵称" })),
            roleId: t.Number({ description: "角色ID" }),
          }),
        }), "登录成功返回令牌和用户信息"),
        400: ErrorResponse,
      },
      detail: { 
        skipAuth: true,
        summary: "用户登录",
        description: "使用用户名和密码进行登录，返回访问令牌和用户基本信息",
      },
    }
  )

  /** 用户注册 */
  .post(
    "/register",
    async ({ body }) => {
      const result = await authService.register(body);

      if (!result.success) {
        return R.badRequest(result.message!);
      }

      return R.ok({ userId: result.userId }, result.message);
    },
    {
      body: t.Object({
        username: t.String({ description: "用户名", minLength: 2, maxLength: 50 }),
        password: t.String({ description: "密码", minLength: 6, maxLength: 100 }),
        nickname: t.Optional(t.String({ description: "昵称", maxLength: 50 })),
        email: t.Optional(t.String({ description: "邮箱", format: "email" })),
        phone: t.Optional(t.String({ description: "手机号" })),
      }),
      response: {
        200: SuccessResponse(t.Object({
          userId: t.Number({ description: "新用户ID" }),
        }), "注册成功返回用户ID"),
        400: ErrorResponse,
      },
      detail: { 
        skipAuth: true,
        summary: "用户注册",
        description: "注册新用户账号，用户名不能重复",
      },
    }
  )

  /** 用户登出 */
  .post("/logout", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      authService.logout(token);
    }
    return R.success("登出成功");
  }, {
    response: {
      200: MessageResponse,
    },
    detail: {
      summary: "用户登出",
      description: "退出登录，销毁当前会话令牌",
    },
  })

  /** 获取当前用户信息 */
  .get("/me", async ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return R.unauthorized();
    }

    const token = authHeader.slice(7);
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return R.unauthorized("登录已过期");
    }

    return R.ok(user);
  }, {
    response: {
      200: SuccessResponse(t.Object({
        id: t.Number({ description: "用户ID" }),
        username: t.String({ description: "用户名" }),
        nickname: t.Nullable(t.String({ description: "昵称" })),
        roleId: t.Number({ description: "角色ID" }),
        email: t.Nullable(t.String({ description: "邮箱" })),
        phone: t.Nullable(t.String({ description: "手机号" })),
        status: t.Number({ description: "状态：1-正常, 0-禁用" }),
      }), "当前登录用户详细信息"),
      401: ErrorResponse,
    },
    detail: {
      summary: "获取当前用户信息",
      description: "获取当前登录用户的详细信息，包括用户名、昵称、角色等",
    },
  })

  /** 刷新 token */
  .post("/refresh", ({ request }) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return R.unauthorized();
    }

    const token = authHeader.slice(7);
    const session = authService.refreshToken(token);

    if (!session) {
      return R.unauthorized("登录已过期");
    }

    return R.ok({ expiresAt: session.expiresAt }, "刷新成功");
  }, {
    response: {
      200: SuccessResponse(t.Object({
        expiresAt: t.String({ description: "新的过期时间" }),
      }), "令牌刷新成功"),
      401: ErrorResponse,
    },
    detail: {
      summary: "刷新令牌",
      description: "刷新访问令牌的有效期，延长登录状态",
    },
  })

  /** 修改密码 */
  .post(
    "/change-password",
    async (ctx) => {
      const userId = (ctx as any).userId as number | null;
      if (!userId) {
        return R.unauthorized();
      }

      const result = await authService.changePassword(
        userId,
        ctx.body.oldPassword,
        ctx.body.newPassword
      );

      if (!result.success) {
        return R.badRequest(result.message!);
      }

      return R.success(result.message);
    },
    {
      body: t.Object({
        oldPassword: t.String({ description: "原密码", minLength: 1 }),
        newPassword: t.String({ description: "新密码", minLength: 6, maxLength: 100 }),
      }),
      response: {
        200: MessageResponse,
        400: ErrorResponse,
        401: ErrorResponse,
      },
      detail: {
        summary: "修改密码",
        description: "修改当前用户的登录密码，需要验证原密码",
      },
    }
  )

  /** 获取当前用户的所有会话 */
  .get("/sessions", (ctx) => {
    const userId = (ctx as any).userId as number | null;
    if (!userId) {
      return R.unauthorized();
    }

    const sessions = authService.getUserSessions(userId);
    // 脱敏：不返回完整 token
    const data = sessions.map((s) => ({
      tokenPrefix: s.token.slice(0, 8) + "...",
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      lastActiveAt: s.lastActiveAt,
      ip: s.ip,
      userAgent: s.userAgent,
    }));

    return R.ok(data);
  }, {
    response: {
      200: SuccessResponse(t.Array(t.Object({
        tokenPrefix: t.String({ description: "令牌前缀（脱敏）" }),
        createdAt: t.String({ description: "创建时间" }),
        expiresAt: t.String({ description: "过期时间" }),
        lastActiveAt: t.String({ description: "最后活跃时间" }),
        ip: t.Optional(t.String({ description: "IP地址" })),
        userAgent: t.Optional(t.String({ description: "客户端信息" })),
      })), "当前用户所有会话列表"),
      401: ErrorResponse,
    },
    detail: {
      summary: "获取会话列表",
      description: "获取当前用户的所有登录会话，令牌信息已脱敏处理",
    },
  })

  /** ========== 管理接口 ========== */

  /** 获取在线统计 */
  .get("/admin/stats", () => {
    const stats = authService.getOnlineStats();
    return R.ok(stats);
  }, {
    response: {
      200: SuccessResponse(t.Object({
        onlineUsers: t.Number({ description: "在线用户数" }),
        totalSessions: t.Number({ description: "总会话数" }),
      }), "在线用户统计数据"),
    },
    detail: {
      summary: "获取在线统计",
      description: "获取当前在线用户数和会话数统计（管理员接口）\n\n🔐 **所需权限**: `auth:admin`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["auth:admin"] },
    },
  })

  /** 获取所有会话（管理员） */
  .get("/admin/sessions", () => {
    const sessions = authService.getAllSessions();
    const data = sessions.map((s) => ({
      tokenPrefix: s.token.slice(0, 8) + "...",
      userId: s.userId,
      username: s.username,
      roleId: s.roleId,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      lastActiveAt: s.lastActiveAt,
      ip: s.ip,
      userAgent: s.userAgent,
    }));
    return R.ok(data);
  }, {
    response: {
      200: SuccessResponse(t.Array(t.Object({
        tokenPrefix: t.String({ description: "令牌前缀（脱敏）" }),
        userId: t.Number({ description: "用户ID" }),
        username: t.String({ description: "用户名" }),
        roleId: t.Number({ description: "角色ID" }),
        createdAt: t.String({ description: "创建时间" }),
        expiresAt: t.String({ description: "过期时间" }),
        lastActiveAt: t.String({ description: "最后活跃时间" }),
        ip: t.Optional(t.String({ description: "IP地址" })),
        userAgent: t.Optional(t.String({ description: "客户端信息" })),
      })), "所有用户会话列表"),
    },
    detail: {
      summary: "获取所有会话",
      description: "获取系统中所有登录会话列表（管理员接口）\n\n🔐 **所需权限**: `auth:admin`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["auth:admin"] },
    },
  })

  /** 踢用户下线（管理员） */
  .post(
    "/admin/kick-user",
    ({ body }) => {
      const count = authService.kickUser(body.userId);
      return R.success(`已踢下线 ${count} 个会话`);
    },
    {
      body: t.Object({
        userId: t.Number({ description: "要踢下线的用户ID" }),
      }),
      response: {
        200: MessageResponse,
      },
      detail: {
        summary: "踢用户下线",
        description: "强制指定用户的所有会话下线（管理员接口）\n\n🔐 **所需权限**: `auth:admin`",
        security: [{ bearerAuth: [] }],
        scope: { permissions: ["auth:admin"] },
      },
    }
  )

  /** 踢指定会话下线（管理员） */
  .post(
    "/admin/kick-session",
    ({ body }) => {
      const success = authService.kickSession(body.token);
      if (!success) {
        return R.notFound("会话");
      }
      return R.success("踢下线成功");
    },
    {
      body: t.Object({
        token: t.String({ description: "要踢下线的会话令牌" }),
      }),
      response: {
        200: MessageResponse,
        404: ErrorResponse,
      },
      detail: {
        summary: "踢会话下线",
        description: "强制指定会话下线，需要提供完整令牌（管理员接口）\n\n🔐 **所需权限**: `auth:admin`",
        security: [{ bearerAuth: [] }],
        scope: { permissions: ["auth:admin"] },
      },
    }
  );

export default authController;
