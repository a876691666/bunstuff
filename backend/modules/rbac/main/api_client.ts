import { Elysia, t } from "elysia";
import { rbacService } from "./service";
import { R, SuccessResponse, ErrorResponse } from "@/modules/response";

// 导出管理端控制器
export { rbacAdminController } from "./api_admin";

/** RBAC 模块控制器（客户端） */
export const rbacController = new Elysia({ prefix: "/rbac", tags: ["客户端 - RBAC权限"] })
  // ============ 当前用户相关 ============

  /** 获取当前用户的权限编码列表 */
  .get("/my/permissions", async (ctx) => {
    const userId = (ctx as any).userId as number | null;
    if (!userId) {
      return R.unauthorized();
    }
    const info = await rbacService.getUserPermissionInfo(userId);
    if (!info) return R.notFound("用户");
    return R.ok(Array.from(info.permissionCodes));
  }, {
    response: {
      200: SuccessResponse(t.Array(t.String({ description: "权限编码" })), "当前用户权限编码列表"),
      401: ErrorResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: "获取当前用户权限",
      description: "获取当前登录用户的所有权限编码列表",
      security: [{ bearerAuth: [] }],
    },
  })

  /** 获取当前用户的菜单树 */
  .get("/my/menus/tree", async (ctx) => {
    const userId = (ctx as any).userId as number | null;
    if (!userId) {
      return R.unauthorized();
    }
    const data = await rbacService.getUserMenuTree(userId);
    return R.ok(data);
  }, {
    response: {
      200: SuccessResponse(t.Array(t.Recursive((Self) =>
        t.Object({
          id: t.Number({ description: "菜单ID" }),
          name: t.String({ description: "菜单名称" }),
          path: t.Nullable(t.String({ description: "路由路径" })),
          component: t.Nullable(t.String({ description: "组件路径" })),
          icon: t.Nullable(t.String({ description: "图标" })),
          sort: t.Number({ description: "排序" }),
          parentId: t.Nullable(t.Number({ description: "父菜单ID" })),
          type: t.Number({ description: "类型：1-目录, 2-菜单, 3-按钮" }),
          visible: t.Number({ description: "是否可见：1-是, 0-否" }),
          permission: t.Nullable(t.String({ description: "权限标识" })),
          children: t.Optional(t.Array(Self)),
        })
      )), "当前用户菜单树结构"),
      401: ErrorResponse,
    },
    detail: {
      summary: "获取当前用户菜单树",
      description: "获取当前登录用户的菜单树形结构，用于前端渲染导航",
      security: [{ bearerAuth: [] }],
    },
  })

  /** 检查当前用户是否拥有指定权限 */
  .post("/my/permissions/check", async (ctx) => {
    const userId = (ctx as any).userId as number | null;
    if (!userId) {
      return R.unauthorized();
    }
    const hasPermission = await rbacService.userHasPermission(userId, ctx.body.permissionCode);
    return R.ok({ hasPermission });
  }, {
    body: t.Object({
      permissionCode: t.String({ description: "要检查的权限编码" }),
    }),
    response: {
      200: SuccessResponse(t.Object({
        hasPermission: t.Boolean({ description: "是否拥有权限" }),
      }), "权限检查结果"),
      401: ErrorResponse,
    },
    detail: {
      summary: "检查当前用户权限",
      description: "检查当前登录用户是否拥有指定的单个权限",
      security: [{ bearerAuth: [] }],
    },
  })

  /** 检查当前用户是否拥有任一权限 */
  .post("/my/permissions/check-any", async (ctx) => {
    const userId = (ctx as any).userId as number | null;
    if (!userId) {
      return R.unauthorized();
    }
    const hasPermission = await rbacService.userHasAnyPermission(userId, ctx.body.permissionCodes);
    return R.ok({ hasPermission });
  }, {
    body: t.Object({
      permissionCodes: t.Array(t.String({ description: "权限编码" })),
    }),
    response: {
      200: SuccessResponse(t.Object({
        hasPermission: t.Boolean({ description: "是否拥有权限" }),
      }), "权限检查结果"),
      401: ErrorResponse,
    },
    detail: {
      summary: "检查当前用户任一权限",
      description: "检查当前登录用户是否拥有给定权限列表中的任意一个",
      security: [{ bearerAuth: [] }],
    },
  });

export default rbacController;
