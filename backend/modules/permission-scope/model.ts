import { t } from "elysia";

// ============ 数据过滤规则模型 ============

/** 数据过滤规则信息模型（响应用） */
export const PermissionScopeSchema = t.Object({
  id: t.Number({ description: "规则ID" }),
  permissionId: t.Number({ description: "关联权限ID" }),
  name: t.String({ description: "规则名称" }),
  tableName: t.String({ description: "目标表名" }),
  ssqlRule: t.String({ description: "SSQL过滤规则表达式" }),
  description: t.Nullable(t.String({ description: "规则描述" })),
  createdAt: t.String({ description: "创建时间" }),
  updatedAt: t.String({ description: "更新时间" }),
});

/** 数据过滤规则创建请求模型 */
export const createPermissionScopeBody = t.Object({
  permissionId: t.Number({ description: "关联的权限ID" }),
  name: t.String({ description: "规则名称", minLength: 1, maxLength: 50 }),
  tableName: t.String({ description: "目标表名，如：users、orders", minLength: 1, maxLength: 100 }),
  ssqlRule: t.String({ description: "SSQL过滤规则，如：department_id = @user.departmentId", minLength: 1 }),
  description: t.Optional(t.Nullable(t.String({ description: "规则描述", maxLength: 200 }))),
}, { description: "创建数据过滤规则请求体" });

/** 数据过滤规则更新请求模型 */
export const updatePermissionScopeBody = t.Object({
  permissionId: t.Optional(t.Number({ description: "关联的权限ID" })),
  name: t.Optional(t.String({ description: "规则名称", minLength: 1, maxLength: 50 })),
  tableName: t.Optional(t.String({ description: "目标表名", minLength: 1, maxLength: 100 })),
  ssqlRule: t.Optional(t.String({ description: "SSQL过滤规则" })),
  description: t.Optional(t.Nullable(t.String({ description: "规则描述", maxLength: 200 }))),
}, { description: "更新数据过滤规则请求体" });

/** 数据过滤规则ID参数模型 */
export const permissionScopeIdParams = t.Object({
  id: t.Numeric({ description: "规则ID" }),
}, { description: "数据过滤规则ID路径参数" });

/** 数据过滤规则查询参数模型 */
export const permissionScopeQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: "页码", default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: "每页条数", default: 10, minimum: 1 })),
  permissionId: t.Optional(t.Numeric({ description: "权限ID筛选" })),
  name: t.Optional(t.String({ description: "规则名称（模糊搜索）" })),
  tableName: t.Optional(t.String({ description: "表名（模糊搜索）" })),
}, { description: "数据过滤规则列表查询参数" });
