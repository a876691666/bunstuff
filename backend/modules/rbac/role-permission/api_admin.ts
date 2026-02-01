import { Elysia, t } from "elysia";
import { rolePermissionService } from "./service";
import {
  createRolePermissionBody,
  batchSetRolePermissionBody,
  rolePermissionIdParams,
  rolePermissionQueryParams,
  roleIdParams,
  RolePermissionSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "@/modules/response";

/** 角色权限关联管理控制器（管理端） */
export const rolePermissionAdminController = new Elysia({ prefix: "/role-permission", tags: ["管理 - 角色权限"] })
  /** 获取角色权限关联列表 */
  .get("/", async ({ query }) => {
    const result = await rolePermissionService.findAll(query);
    return R.page(result);
  }, {
    query: rolePermissionQueryParams,
    response: {
      200: PagedResponse(RolePermissionSchema, "角色权限关联列表分页数据"),
    },
    detail: {
      summary: "获取角色权限关联列表",
      description: "分页获取角色权限关联列表，支持按角色ID、权限ID、权限范围ID筛选\n\n🔐 **所需权限**: `role-permission:list`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:list"] } },
    },
  })

  /** 获取角色的权限ID列表 */
  .get("/role/:roleId/permissions", async ({ params }) => {
    const data = await rolePermissionService.findPermissionIdsByRoleId(params.roleId);
    return R.ok(data);
  }, {
    params: roleIdParams,
    response: {
      200: SuccessResponse(t.Array(t.Number({ description: "权限ID" })), "角色关联的权限ID列表"),
    },
    detail: {
      summary: "获取角色的权限ID列表",
      description: "获取指定角色关联的所有权限ID，用于权限分配\n\n🔐 **所需权限**: `role-permission:list`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:list"] } },
    },
  })

  /** 根据ID获取角色权限关联 */
  .get("/:id", async ({ params }) => {
    const data = await rolePermissionService.findById(params.id);
    if (!data) return R.notFound("角色权限关联");
    return R.ok(data);
  }, {
    params: rolePermissionIdParams,
    response: {
      200: SuccessResponse(RolePermissionSchema, "角色权限关联详情数据"),
      404: ErrorResponse,
    },
    detail: {
      summary: "获取角色权限关联详情",
      description: "根据ID获取角色权限关联详细信息\n\n🔐 **所需权限**: `role-permission:read`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:read"] } },
    },
  })

  /** 创建角色权限关联 */
  .post("/", async ({ body }) => {
    const data = await rolePermissionService.create(body);
    return R.ok(data, "创建成功");
  }, {
    body: createRolePermissionBody,
    response: {
      200: SuccessResponse(RolePermissionSchema, "新创建的角色权限关联信息"),
    },
    detail: {
      summary: "创建角色权限关联",
      description: "为角色添加单个权限关联\n\n🔐 **所需权限**: `role-permission:create`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:create"] } },
    },
  })

  /** 批量设置角色权限 */
  .post("/batch", async ({ body }) => {
    const data = await rolePermissionService.batchSetRolePermissions(body.roleId, body.permissionIds);
    return R.ok(data, "设置成功");
  }, {
    body: batchSetRolePermissionBody,
    response: {
      200: SuccessResponse(t.Array(RolePermissionSchema), "批量创建的角色权限关联列表"),
    },
    detail: {
      summary: "批量设置角色权限",
      description: "批量设置角色的权限关联，会先删除原有关联再创建新的（全量更新）\n\n🔐 **所需权限**: `role-permission:batch`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:batch"] } },
    },
  })

  /** 删除角色权限关联 */
  .delete("/:id", async ({ params }) => {
    const existing = await rolePermissionService.findById(params.id);
    if (!existing) return R.notFound("角色权限关联");
    await rolePermissionService.delete(params.id);
    return R.success("删除成功");
  }, {
    params: rolePermissionIdParams,
    response: {
      200: MessageResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: "删除角色权限关联",
      description: "删除指定的角色权限关联\n\n🔐 **所需权限**: `role-permission:delete`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["role-permission:delete"] } },
    },
  });

export default rolePermissionAdminController;
