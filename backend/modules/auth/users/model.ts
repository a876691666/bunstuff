import { t } from 'elysia'

// ============ 用户数据模型 ============

/** 用户信息模型（响应用） */
export const UserSchema = t.Object({
  id: t.Number({ description: '用户ID' }),
  username: t.String({ description: '用户名' }),
  nickname: t.Nullable(t.String({ description: '昵称' })),
  email: t.Nullable(t.String({ description: '邮箱' })),
  phone: t.Nullable(t.String({ description: '手机号' })),
  avatar: t.Nullable(t.String({ description: '头像URL' })),
  status: t.Number({ description: '状态：1启用 0禁用' }),
  roleId: t.Number({ description: '角色ID' }),
  createdAt: t.String({ description: '创建时间' }),
  updatedAt: t.String({ description: '更新时间' }),
})

/** 用户创建请求模型 */
export const createUserBody = t.Object(
  {
    username: t.String({ description: '用户名', minLength: 2, maxLength: 50 }),
    password: t.String({ description: '密码', minLength: 6, maxLength: 100 }),
    nickname: t.Optional(t.Nullable(t.String({ description: '昵称', maxLength: 50 }))),
    email: t.Optional(t.Nullable(t.String({ description: '邮箱', format: 'email' }))),
    phone: t.Optional(t.Nullable(t.String({ description: '手机号' }))),
    avatar: t.Optional(t.Nullable(t.String({ description: '头像URL' }))),
    status: t.Optional(t.Number({ description: '状态：1启用 0禁用', default: 1 })),
    roleId: t.Number({ description: '角色ID' }),
  },
  { description: '创建用户请求体' },
)

/** 用户更新请求模型 */
export const updateUserBody = t.Object(
  {
    username: t.Optional(t.String({ description: '用户名', minLength: 2, maxLength: 50 })),
    password: t.Optional(t.String({ description: '新密码', minLength: 6, maxLength: 100 })),
    nickname: t.Optional(t.Nullable(t.String({ description: '昵称', maxLength: 50 }))),
    email: t.Optional(t.Nullable(t.String({ description: '邮箱', format: 'email' }))),
    phone: t.Optional(t.Nullable(t.String({ description: '手机号' }))),
    avatar: t.Optional(t.Nullable(t.String({ description: '头像URL' }))),
    status: t.Optional(t.Number({ description: '状态：1启用 0禁用' })),
    roleId: t.Optional(t.Number({ description: '角色ID' })),
  },
  { description: '更新用户请求体' },
)

/** 用户ID参数模型 */
export const userIdParams = t.Object(
  {
    id: t.Numeric({ description: '用户ID' }),
  },
  { description: '用户ID路径参数' },
)

/** 用户查询参数模型 */
export const userQueryParams = t.Object(
  {
    page: t.Optional(t.Numeric({ description: '页码', default: 1, minimum: 1 })),
    pageSize: t.Optional(t.Numeric({ description: '每页条数', default: 10, minimum: 1 })),
    username: t.Optional(t.String({ description: '用户名（模糊搜索）' })),
    nickname: t.Optional(t.String({ description: '昵称（模糊搜索）' })),
    status: t.Optional(t.Numeric({ description: '状态筛选：1启用 0禁用' })),
    roleId: t.Optional(t.Numeric({ description: '角色ID筛选' })),
  },
  { description: '用户列表查询参数' },
)
