import { Elysia } from "elysia";
import { permissionScopeService } from "./service";
import {
  createPermissionScopeBody,
  updatePermissionScopeBody,
  permissionScopeIdParams,
  permissionScopeQueryParams,
  PermissionScopeSchema,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "../response";

/** 数据过滤规则模块控制器 */
export const permissionScopeController = new Elysia({ prefix: "/permission-scope", tags: ["数据权限"] })
  /** 获取数据过滤规则列表 */
  .get("/", async ({ query }) => {
    const result = await permissionScopeService.findAll(query);
    return R.page(result);
  }, {
    query: permissionScopeQueryParams,
    response: {
      200: PagedResponse(PermissionScopeSchema, "数据过滤规则列表分页数据"),
    },
    detail: {
      summary: "获取数据过滤规则列表",
      description: "分页获取数据过滤规则列表，支持按权限ID、名称、表名筛选\n\n🔐 **所需权限**: `permission-scope:list`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["permission-scope:list"] },
    },
  })

  /** 根据ID获取数据过滤规则 */
  .get("/:id", async ({ params }) => {
    const data = await permissionScopeService.findById(params.id);
    if (!data) return R.notFound("数据过滤规则");
    return R.ok(data);
  }, {
    params: permissionScopeIdParams,
    response: {
      200: SuccessResponse(PermissionScopeSchema, "数据过滤规则详情数据"),
      404: ErrorResponse,
    },
    detail: {
      summary: "获取数据过滤规则详情",
      description: "根据ID获取数据过滤规则详细信息\n\n🔐 **所需权限**: `permission-scope:read`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["permission-scope:read"] },
    },
  })

  /** 创建数据过滤规则 */
  .post("/", async ({ body }) => {
    const data = await permissionScopeService.create(body);
    return R.ok(data, "创建成功");
  }, {
    body: createPermissionScopeBody,
    response: {
      200: SuccessResponse(PermissionScopeSchema, "新创建的数据过滤规则信息"),
    },
    detail: {
      summary: "创建数据过滤规则",
      description: "创建新的数据过滤规则，用于行级数据权限控制。ssqlRule 为 SSQL 格式的过滤表达式\n\n🔐 **所需权限**: `permission-scope:create`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["permission-scope:create"] },
    },
  })

  /** 更新数据过滤规则 */
  .put("/:id", async ({ params, body }) => {
    const existing = await permissionScopeService.findById(params.id);
    if (!existing) return R.notFound("数据过滤规则");
    const data = await permissionScopeService.update(params.id, body);
    return R.ok(data, "更新成功");
  }, {
    params: permissionScopeIdParams,
    body: updatePermissionScopeBody,
    response: {
      200: SuccessResponse(PermissionScopeSchema, "更新后的数据过滤规则信息"),
      404: ErrorResponse,
    },
    detail: {
      summary: "更新数据过滤规则",
      description: "更新指定数据过滤规则的信息，支持部分更新\n\n🔐 **所需权限**: `permission-scope:update`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["permission-scope:update"] },
    },
  })

  /** 删除数据过滤规则 */
  .delete("/:id", async ({ params }) => {
    const existing = await permissionScopeService.findById(params.id);
    if (!existing) return R.notFound("数据过滤规则");
    await permissionScopeService.delete(params.id);
    return R.success("删除成功");
  }, {
    params: permissionScopeIdParams,
    response: {
      200: MessageResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: "删除数据过滤规则",
      description: "删除指定数据过滤规则，此操作不可恢复\n\n🔐 **所需权限**: `permission-scope:delete`",
      security: [{ bearerAuth: [] }],
      scope: { permissions: ["permission-scope:delete"] },
    },
  });

export default permissionScopeController;
