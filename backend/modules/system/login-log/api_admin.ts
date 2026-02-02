import { Elysia } from "elysia";
import { loginLogService } from "./service";
import { LoginLogSchema, loginLogIdParams, loginLogQueryParams } from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "@/modules/response";
import { authPlugin } from "@/modules/auth";
import { rbacPlugin } from "@/modules/rbac";
import { vipPlugin } from "@/modules/vip";
import { loginLogPlugin } from "./plugin";

/** 登录日志管理控制器（管理端） */
export const loginLogAdminController = new Elysia({ prefix: "/login-log", tags: ["管理 - 登录日志"] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(loginLogPlugin())
  .get("/", async ({ query }) => {
    const result = await loginLogService.findAll(query);
    return R.page(result);
  }, {
    query: loginLogQueryParams,
    response: { 200: PagedResponse(LoginLogSchema, "登录日志列表") },
    detail: {
      summary: "获取登录日志列表",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["loginLog:list"] } },
    },
  })

  .get("/:id", async ({ params }) => {
    const data = await loginLogService.findById(params.id);
    if (!data) return R.notFound("登录日志");
    return R.ok(data);
  }, {
    params: loginLogIdParams,
    response: { 200: SuccessResponse(LoginLogSchema), 404: ErrorResponse },
    detail: {
      summary: "获取登录日志详情",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["loginLog:read"] } },
    },
  })

  .delete("/:id", async ({ params }) => {
    const existing = await loginLogService.findById(params.id);
    if (!existing) return R.notFound("登录日志");
    await loginLogService.delete(params.id);
    return R.success("删除成功");
  }, {
    params: loginLogIdParams,
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      summary: "删除登录日志",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["loginLog:delete"] } },
    },
  })

  .delete("/clear", async () => {
    await loginLogService.clear();
    return R.success("清空成功");
  }, {
    response: { 200: MessageResponse },
    detail: {
      summary: "清空登录日志",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["loginLog:clear"] } },
    },
  });
