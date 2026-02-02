import { t } from 'elysia'

// ============ 权限数据模型 ============

/** 权限信息模型（响应用） */
export const PermissionSchema = t.Object({
  id: t.Number({ description: '权限ID' }),
  name: t.String({ description: '权限名称' }),
  code: t.String({ description: '权限编码' }),
  resource: t.Nullable(t.String({ description: '资源标识' })),
  description: t.Nullable(t.String({ description: '权限描述' })),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 权限创建请求模型 */
export const createPermissionBody = t.Object(
  {
    name: t.String({ description: '权限名称', minLength: 1, maxLength: 50 }),
    code: t.String({
      description: '权限编码（唯一），如：user:create',
      minLength: 1,
      maxLength: 100,
    }),
    resource: t.Optional(
      t.Nullable(t.String({ description: '资源标识，如：/api/users', maxLength: 200 })),
    ),
    description: t.Optional(t.Nullable(t.String({ description: '权限描述', maxLength: 200 }))),
  },
  { description: '创建权限请求体' },
)

/** 权限更新请求模型 */
export const updatePermissionBody = t.Object(
  {
    name: t.Optional(t.String({ description: '权限名称', minLength: 1, maxLength: 50 })),
    code: t.Optional(t.String({ description: '权限编码', minLength: 1, maxLength: 100 })),
    resource: t.Optional(t.Nullable(t.String({ description: '资源标识', maxLength: 200 }))),
    description: t.Optional(t.Nullable(t.String({ description: '权限描述', maxLength: 200 }))),
  },
  { description: '更新权限请求体' },
)

/** 权限ID参数模型 */
export const permissionIdParams = t.Object(
  {
    id: t.Numeric({ description: '权限ID' }),
  },
  { description: '权限ID路径参数' },
)

/** 权限查询参数模型 */
export const permissionQueryParams = t.Object(
  {
    page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
    pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
    filter: t.Optional(t.String({ description: 'SSQL过滤条件' })),
  },
  { description: '权限列表查询参数' },
)
