import { Elysia } from "elysia";
import { userService } from "./service";
import {
  createUserBody,
  updateUserBody,
  userIdParams,
  userQueryParams,
  UserSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** 用户模块控制器 */
export const userController = new Elysia({ prefix: "/users", tags: ["用户管理"] })
  /** 获取用户列表 */
  .get("/", async ({ query }) => {
    const result = await userService.findAll(query);
    return R.page(result);
  }, {
    query: userQueryParams,
    response: {
      200: PagedResponse(UserSchema, "用户列表分页数据"),
    },
    detail: {
      summary: "获取用户列表",
      description: "分页获取用户列表，支持按用户名、昵称、状态、角色筛选\n\n🔐 **所需权限**: `user:list`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["user:list"] },
    },
  })

  /** 根据ID获取用户 */
  .get("/:id", async ({ params }) => {
    const data = await userService.findById(params.id);
    if (!data) return R.notFound("用户");
    // 不返回密码
    const { password, ...userWithoutPassword } = data;
    return R.ok(userWithoutPassword);
  }, {
    params: userIdParams,
    response: {
      200: SuccessResponse(UserSchema, "用户详情数据"),
      404: ErrorResponse,
    },
    detail: {
      summary: "获取用户详情",
      description: "根据用户ID获取用户详细信息（不含密码）\n\n🔐 **所需权限**: `user:read`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["user:read"] },
    },
  })

  /** 创建用户 */
  .post("/", async ({ body }) => {
    // 检查用户名是否已存在
    const existing = await userService.findByUsername(body.username);
    if (existing) return R.badRequest("用户名已存在");
    const data = await userService.create(body);
    return R.ok(data, "创建成功");
  }, {
    body: createUserBody,
    response: {
      200: SuccessResponse(UserSchema, "新创建的用户信息"),
      400: ErrorResponse,
    },
    detail: {
      summary: "创建用户",
      description: "创建新用户，用户名必须唯一\n\n🔐 **所需权限**: `user:create`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["user:create"] },
    },
  })

  /** 更新用户 */
  .put("/:id", async ({ params, body }) => {
    const existing = await userService.findById(params.id);
    if (!existing) return R.notFound("用户");
    const data = await userService.update(params.id, body);
    return R.ok(data, "更新成功");
  }, {
    params: userIdParams,
    body: updateUserBody,
    response: {
      200: SuccessResponse(UserSchema, "更新后的用户信息"),
      404: ErrorResponse,
    },
    detail: {
      summary: "更新用户",
      description: "更新指定用户的信息，支持部分更新\n\n🔐 **所需权限**: `user:update`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["user:update"] },
    },
  })

  /** 删除用户 */
  .delete("/:id", async ({ params }) => {
    const existing = await userService.findById(params.id);
    if (!existing) return R.notFound("用户");
    await userService.delete(params.id);
    return R.success("删除成功");
  }, {
    params: userIdParams,
    response: {
      200: MessageResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: "删除用户",
      description: "删除指定用户，此操作不可恢复\n\n🔐 **所需权限**: `user:delete`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["user:delete"] },
    },
  });

export default userController;
