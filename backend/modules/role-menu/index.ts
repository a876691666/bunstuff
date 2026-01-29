import { Elysia, t } from "elysia";
import { roleMenuService } from "./service";
import {
  createRoleMenuBody,
  batchSetRoleMenuBody,
  roleMenuIdParams,
  roleMenuQueryParams,
  roleIdParams,
  RoleMenuSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** 角色菜单关联模块控制器 */
export const roleMenuController = new Elysia({ prefix: "/role-menu", tags: ["角色菜单"] })
  /** 获取角色菜单关联列表 */
  .get("/", async ({ query }) => {
    const result = await roleMenuService.findAll(query);
    return R.page(result);
  }, {
    query: roleMenuQueryParams,
    response: {
      200: PagedResponse(RoleMenuSchema, "角色菜单关联列表分页数据"),
    },
    detail: {
      summary: "获取角色菜单关联列表",
      description: "分页获取角色菜单关联列表，支持按角色ID、菜单ID筛选\n\n🔐 **所需权限**: `role-menu:list`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:list"] },
    },
  })

  /** 获取角色的菜单ID列表 */
  .get("/role/:roleId/menus", async ({ params }) => {
    const data = await roleMenuService.findMenuIdsByRoleId(params.roleId);
    return R.ok(data);
  }, {
    params: roleIdParams,
    response: {
      200: SuccessResponse(t.Array(t.Number({ description: "菜单ID" })), "角色关联的菜单ID列表"),
    },
    detail: {
      summary: "获取角色的菜单ID列表",
      description: "获取指定角色关联的所有菜单ID，用于菜单权限分配\n\n🔐 **所需权限**: `role-menu:list`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:list"] },
    },
  })

  /** 根据ID获取角色菜单关联 */
  .get("/:id", async ({ params }) => {
    const data = await roleMenuService.findById(params.id);
    if (!data) return R.notFound("角色菜单关联");
    return R.ok(data);
  }, {
    params: roleMenuIdParams,
    response: {
      200: SuccessResponse(RoleMenuSchema, "角色菜单关联详情数据"),
      404: ErrorResponse,
    },
    detail: {
      summary: "获取角色菜单关联详情",
      description: "根据ID获取角色菜单关联详细信息\n\n🔐 **所需权限**: `role-menu:read`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:read"] },
    },
  })

  /** 创建角色菜单关联 */
  .post("/", async ({ body }) => {
    const data = await roleMenuService.create(body);
    return R.ok(data, "创建成功");
  }, {
    body: createRoleMenuBody,
    response: {
      200: SuccessResponse(RoleMenuSchema, "新创建的角色菜单关联信息"),
    },
    detail: {
      summary: "创建角色菜单关联",
      description: "为角色添加单个菜单关联\n\n🔐 **所需权限**: `role-menu:create`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:create"] },
    },
  })

  /** 批量设置角色菜单 */
  .post("/batch", async ({ body }) => {
    const data = await roleMenuService.batchSetRoleMenus(body.roleId, body.menuIds);
    return R.ok(data, "设置成功");
  }, {
    body: batchSetRoleMenuBody,
    response: {
      200: SuccessResponse(t.Array(RoleMenuSchema), "批量创建的角色菜单关联列表"),
    },
    detail: {
      summary: "批量设置角色菜单",
      description: "批量设置角色的菜单关联，会先删除原有关联再创建新的（全量更新）\n\n🔐 **所需权限**: `role-menu:batch`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:batch"] },
    },
  })

  /** 删除角色菜单关联 */
  .delete("/:id", async ({ params }) => {
    const existing = await roleMenuService.findById(params.id);
    if (!existing) return R.notFound("角色菜单关联");
    await roleMenuService.delete(params.id);
    return R.success("删除成功");
  }, {
    params: roleMenuIdParams,
    response: {
      200: MessageResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: "删除角色菜单关联",
      description: "删除指定的角色菜单关联\n\n🔐 **所需权限**: `role-menu:delete`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["role-menu:delete"] },
    },
  });

export default roleMenuController;
