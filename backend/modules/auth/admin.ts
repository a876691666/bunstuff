/**
 * Auth 模块管理控制器（管理端）
 */

import { Elysia, t } from "elysia";
import { authService } from "./service";
import { R, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** Auth 管理控制器（管理端） */
export const authAdminController = new Elysia({ prefix: "/auth", tags: ["管理 - 认证"] })
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

export default authAdminController;
