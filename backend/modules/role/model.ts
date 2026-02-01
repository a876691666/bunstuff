import { t } from "elysia";

// ============ 角色数据模型 ============

/** 角色信息模型（响应用） */
export const RoleSchema = t.Object({
  id: t.Number({ description: "角色ID" }),
  parentId: t.Nullable(t.Number({ description: "父角色ID" })),
  name: t.String({ description: "角色名称" }),
  code: t.String({ description: "角色编码" }),
  status: t.Number({ description: "状态：1启用 0禁用" }),
  sort: t.Number({ description: "排序值" }),
  description: t.Nullable(t.String({ description: "角色描述" })),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** 角色树节点模型 */
export const RoleTreeSchema = t.Recursive((Self) =>
  t.Object({
    id: t.Number({ description: "角色ID" }),
    parentId: t.Nullable(t.Number({ description: "父角色ID" })),
    name: t.String({ description: "角色名称" }),
    code: t.String({ description: "角色编码" }),
    status: t.Number({ description: "状态：1启用 0禁用" }),
    sort: t.Number({ description: "排序值" }),
    description: t.Nullable(t.String({ description: "角色描述" })),
    children: t.Optional(t.Array(Self, { description: "子角色列表" })),
  }), { description: "角色树节点" }
);

/** 角色创建请求模型 */
export const createRoleBody = t.Object({
  parentId: t.Optional(t.Nullable(t.Number({ description: "父角色ID，为空表示顶级角色" }))),
  name: t.String({ description: "角色名称", minLength: 1, maxLength: 50 }),
  code: t.String({ description: "角色编码（唯一）", minLength: 1, maxLength: 50 }),
  status: t.Optional(t.Number({ description: "状态：1启用 0禁用", default: 1 })),
  sort: t.Optional(t.Number({ description: "排序值，越小越靠前", default: 0 })),
  description: t.Optional(t.Nullable(t.String({ description: "角色描述", maxLength: 200 }))),
}, { description: "创建角色请求体" });

/** 角色更新请求模型 */
export const updateRoleBody = t.Object({
  parentId: t.Optional(t.Nullable(t.Number({ description: "父角色ID" }))),
  name: t.Optional(t.String({ description: "角色名称", minLength: 1, maxLength: 50 })),
  code: t.Optional(t.String({ description: "角色编码", minLength: 1, maxLength: 50 })),
  status: t.Optional(t.Number({ description: "状态：1启用 0禁用" })),
  sort: t.Optional(t.Number({ description: "排序值" })),
  description: t.Optional(t.Nullable(t.String({ description: "角色描述", maxLength: 200 }))),
}, { description: "更新角色请求体" });

/** 角色ID参数模型 */
export const roleIdParams = t.Object({
  id: t.Numeric({ description: "角色ID" }),
}, { description: "角色ID路径参数" });

/** 角色查询参数模型 */
export const roleQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: "页码", default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: "每页条数", default: 10, minimum: 1 })),
  name: t.Optional(t.String({ description: "角色名称（模糊搜索）" })),
  code: t.Optional(t.String({ description: "角色编码（模糊搜索）" })),
  status: t.Optional(t.Numeric({ description: "状态筛选：1启用 0禁用" })),
}, { description: "角色列表查询参数" });
