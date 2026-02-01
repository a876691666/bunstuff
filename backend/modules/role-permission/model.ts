import { t } from "elysia";

// ============ 角色权限关联模型 ============

/** 角色权限关联信息模型（响应用） */
export const RolePermissionSchema = t.Object({
  id: t.Number({ description: "关联ID" }),
  roleId: t.Number({ description: "角色ID" }),
  permissionId: t.Number({ description: "权限ID" }),
  createdAt: t.String({ description: "创建时间" }),
});

/** 角色权限关联创建请求模型 */
export const createRolePermissionBody = t.Object({
  roleId: t.Number({ description: "角色ID" }),
  permissionId: t.Number({ description: "权限ID" }),
}, { description: "创建角色权限关联请求体" });

/** 批量设置角色权限请求模型 */
export const batchSetRolePermissionBody = t.Object({
  roleId: t.Number({ description: "角色ID" }),
  permissionIds: t.Array(t.Number({ description: "权限ID" }), { description: "权限ID列表" }),
}, { description: "批量设置角色权限请求体" });

/** 角色权限关联ID参数模型 */
export const rolePermissionIdParams = t.Object({
  id: t.Numeric({ description: "关联ID" }),
}, { description: "角色权限关联ID路径参数" });

/** 角色权限关联查询参数模型 */
export const rolePermissionQueryParams = t.Object({
  page: t.Optional(t.Numeric({ description: "页码", default: 1, minimum: 1 })),
  pageSize: t.Optional(t.Numeric({ description: "每页条数", default: 10, minimum: 1 })),
  roleId: t.Optional(t.Numeric({ description: "角色ID筛选" })),
  permissionId: t.Optional(t.Numeric({ description: "权限ID筛选" })),
}, { description: "角色权限关联列表查询参数" });

/** 角色ID参数模型 */
export const roleIdParams = t.Object({
  roleId: t.Numeric({ description: "角色ID" }),
}, { description: "角色ID路径参数" });
