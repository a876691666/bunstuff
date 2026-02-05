---
name: route-model
description: Elysia 路由模型工具包。用于创建 API 接口的 Schema、Body、Params、Query 等类型定义。关键词：schema、body、updateBody、idParams、query、tree、merge、omit、pick、getSchema
---

# Route Model 工具包

位置：`backend/packages/route-model`

```ts
import { schema, body, updateBody, idParams, query, tree, merge, omit, pick } from '@/packages/route-model'
```

## 核心函数

### Model.getSchema() - 从 ORM Model 生成 Schema（推荐）
```ts
import User from '@/models/users'

// 获取完整 Schema（包含所有字段+时间戳）
const UserSchema = User.getSchema()

// 排除字段 + 所有字段可选
const UserPartial = User.getSchema({ exclude: ['password'], partial: true })

// 排除 id，指定必填字段，添加额外字段
const UserCreate = User.getSchema(
  { exclude: ['id'], required: ['username', 'password'] },
  { confirmPassword: t.String({ description: '确认密码' }) }
)

// 只包含指定字段
const UserLogin = User.getSchema({ include: ['id', 'username', 'nickname'] })

// 不包含时间戳
User.getSchema({ timestamps: false })
```

💡 **优势**: description 定义在 Model Schema 中，自动同步到 API Schema

### schema() - 响应 Schema
```ts
// 自动添加 createdAt, updatedAt
export const UserSchema = schema({
  id: t.Number({ description: 'ID' }),
  username: t.String({ description: '用户名' }),
  email: t.Nullable(t.String({ description: '邮箱' })),
})

// 不需要时间戳
schema({ ... }, { timestamps: false })
```

### body() - 创建请求体
```ts
export const createUserBody = body({
  username: t.String({ description: '用户名', minLength: 2 }),
  roleId: t.Number({ description: '角色ID' }),
})
```

### updateBody() - 更新请求体（字段自动可选）
```ts
export const updateUserBody = updateBody({
  username: t.String({ description: '用户名' }),
  status: t.Number({ description: '状态' }),
}, { exclude: ['password'], required: ['username'] })
```

### idParams() - ID 路径参数
```ts
export const userIdParams = idParams()  // { id: Numeric }
export const roleIdParams = idParams({ name: 'roleId', label: '角色ID' })
```

### query() - 查询参数（含分页+过滤）
```ts
export const userQueryParams = query()  // { page, pageSize, filter }
export const logQueryParams = query({
  extra: { username: t.Optional(t.String({ description: '用户名' })) }
})
query({ pagination: false })  // 不带分页
```

### tree() - 树形结构
```ts
export const MenuTreeSchema = tree({
  id: t.Number({ description: 'ID' }),
  parentId: t.Nullable(t.Number({ description: '父ID' })),
  name: t.String({ description: '名称' }),
})  // 自动添加 children

tree({ ... }, { exclude: ['createdAt', 'updatedAt'] })
```

## 预设常量

- `timestamps` - `{ createdAt, updatedAt }`
- `pagination` - `{ page, pageSize }`
- `filterField` - `{ filter }`

## 工具函数

### merge() - 合并对象（禁止使用 {...xxx}）
```ts
const createUserBody = body(
  merge(userFields, {
    nickname: t.Optional(userFields.nickname),
    status: t.Optional(t.Number({ description: '状态', default: 1 })),
  }),
)

// 支持多个参数
merge(a, b)
merge(a, b, c)
merge(a, b, c, d)
```

### omit() - 排除字段
```ts
const fieldsWithoutPassword = omit(userFields, ['password'])
```

### pick() - 选取字段
```ts
const loginFields = pick(userFields, ['username', 'password'])
```
- `filterField` - `{ filter }`