import { t } from 'elysia'

// ============ 角色菜单关联模型 ============

/** 角色菜单关联信息模型（响应用） */
export const RoleMenuSchema = t.Object({
  id: t.Number({ description: '关联ID' }),
  roleId: t.Number({ description: '角色ID' }),
  menuId: t.Number({ description: '菜单ID' }),
  createdAt: t.String({ description: '创建时间' }),
})

/** 角色菜单关联创建请求模型 */
export const createRoleMenuBody = t.Object(
  {
    roleId: t.Number({ description: '角色ID' }),
    menuId: t.Number({ description: '菜单ID' }),
  },
  { description: '创建角色菜单关联请求体' },
)

/** 批量设置角色菜单请求模型 */
export const batchSetRoleMenuBody = t.Object(
  {
    roleId: t.Number({ description: '角色ID' }),
    menuIds: t.Array(t.Number({ description: '菜单ID' }), { description: '菜单ID列表' }),
  },
  { description: '批量设置角色菜单请求体' },
)

/** 角色菜单关联ID参数模型 */
export const roleMenuIdParams = t.Object(
  {
    id: t.Numeric({ description: '关联ID' }),
  },
  { description: '角色菜单关联ID路径参数' },
)

/** 角色菜单关联查询参数模型 */
export const roleMenuQueryParams = t.Object(
  {
    page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
    pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
    roleId: t.Optional(t.Numeric({ description: '角色ID筛选' })),
    menuId: t.Optional(t.Numeric({ description: '菜单ID筛选' })),
  },
  { description: '角色菜单关联列表查询参数' },
)

/** 角色ID参数模型 */
export const roleIdParams = t.Object(
  {
    roleId: t.Numeric({ description: '角色ID' }),
  },
  { description: '角色ID路径参数' },
)
