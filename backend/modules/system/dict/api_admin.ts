import { Elysia, t } from "elysia";
import { dictService } from "./service";
import {
  DictTypeSchema, DictDataSchema,
  createDictTypeBody, updateDictTypeBody, dictTypeIdParams, dictTypeQueryParams,
  createDictDataBody, updateDictDataBody, dictDataIdParams, dictDataQueryParams,
} from "./model";
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from "@/modules/response";
import { authPlugin } from "@/modules/auth";
import { rbacPlugin } from "@/modules/rbac";
import { vipPlugin } from "@/modules/vip";
import { dictPlugin } from "./plugin";

/** 字典管理控制器（管理端） */
export const dictAdminController = new Elysia({ prefix: "/dict", tags: ["管理 - 字典"] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(dictPlugin())
  // ============ 字典类型 ============
  .get("/type", async ({ query }) => {
    const result = await dictService.findAllTypes(query);
    return R.page(result);
  }, {
    query: dictTypeQueryParams,
    response: { 200: PagedResponse(DictTypeSchema, "字典类型列表") },
    detail: {
      summary: "获取字典类型列表",
      description: "分页获取字典类型列表\n\n🔐 **所需权限**: `dict:type:list`",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:type:list"] } },
    },
  })

  .get("/type/:id", async ({ params }) => {
    const data = await dictService.findTypeById(params.id);
    if (!data) return R.notFound("字典类型");
    return R.ok(data);
  }, {
    params: dictTypeIdParams,
    response: { 200: SuccessResponse(DictTypeSchema), 404: ErrorResponse },
    detail: {
      summary: "获取字典类型详情",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:type:read"] } },
    },
  })

  .post("/type", async ({ body }) => {
    const existing = await dictService.findTypeByType(body.type);
    if (existing) return R.badRequest("字典类型已存在");
    const data = await dictService.createType(body);
    return R.ok(data, "创建成功");
  }, {
    body: createDictTypeBody,
    response: { 200: SuccessResponse(DictTypeSchema), 400: ErrorResponse },
    detail: {
      summary: "创建字典类型",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:type:create"] } },
    },
  })

  .put("/type/:id", async ({ params, body }) => {
    const existing = await dictService.findTypeById(params.id);
    if (!existing) return R.notFound("字典类型");
    if (body.type && body.type !== existing.type) {
      const typeExists = await dictService.findTypeByType(body.type);
      if (typeExists) return R.badRequest("字典类型已存在");
    }
    const data = await dictService.updateType(params.id, body);
    return R.ok(data, "更新成功");
  }, {
    params: dictTypeIdParams,
    body: updateDictTypeBody,
    response: { 200: SuccessResponse(DictTypeSchema), 400: ErrorResponse, 404: ErrorResponse },
    detail: {
      summary: "更新字典类型",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:type:update"] } },
    },
  })

  .delete("/type/:id", async ({ params }) => {
    const existing = await dictService.findTypeById(params.id);
    if (!existing) return R.notFound("字典类型");
    await dictService.deleteType(params.id);
    return R.success("删除成功");
  }, {
    params: dictTypeIdParams,
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      summary: "删除字典类型",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:type:delete"] } },
    },
  })

  // ============ 字典数据 ============
  .get("/data", async ({ query }) => {
    const result = await dictService.findAllData(query);
    return R.page(result);
  }, {
    query: dictDataQueryParams,
    response: { 200: PagedResponse(DictDataSchema, "字典数据列表") },
    detail: {
      summary: "获取字典数据列表",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:data:list"] } },
    },
  })

  .get("/data/:id", async ({ params }) => {
    const data = await dictService.findDataById(params.id);
    if (!data) return R.notFound("字典数据");
    return R.ok(data);
  }, {
    params: dictDataIdParams,
    response: { 200: SuccessResponse(DictDataSchema), 404: ErrorResponse },
    detail: {
      summary: "获取字典数据详情",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:data:read"] } },
    },
  })

  .post("/data", async ({ body }) => {
    const data = await dictService.createData(body);
    return R.ok(data, "创建成功");
  }, {
    body: createDictDataBody,
    response: { 200: SuccessResponse(DictDataSchema), 400: ErrorResponse },
    detail: {
      summary: "创建字典数据",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:data:create"] } },
    },
  })

  .put("/data/:id", async ({ params, body }) => {
    const existing = await dictService.findDataById(params.id);
    if (!existing) return R.notFound("字典数据");
    const data = await dictService.updateData(params.id, body);
    return R.ok(data, "更新成功");
  }, {
    params: dictDataIdParams,
    body: updateDictDataBody,
    response: { 200: SuccessResponse(DictDataSchema), 400: ErrorResponse, 404: ErrorResponse },
    detail: {
      summary: "更新字典数据",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:data:update"] } },
    },
  })

  .delete("/data/:id", async ({ params }) => {
    const existing = await dictService.findDataById(params.id);
    if (!existing) return R.notFound("字典数据");
    await dictService.deleteData(params.id);
    return R.success("删除成功");
  }, {
    params: dictDataIdParams,
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      summary: "删除字典数据",
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ["dict:data:delete"] } },
    },
  });
