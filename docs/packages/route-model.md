# @pkg/route-model

Elysia 路由 Schema 工具集，用于生成标准化的请求参数、响应体和查询条件的 TypeBox Schema。

## 🎯 核心能力

| 功能                    | 说明                                   |
| ----------------------- | -------------------------------------- |
| **schema()**            | 生成完整的响应体 Schema                |
| **body()**              | 生成创建请求的 Body Schema             |
| **updateBody()**        | 生成更新请求的 Body Schema（字段可选） |
| **idParams()**          | 生成 ID 路径参数 Schema                |
| **query()**             | 生成分页 + SSQL 过滤的 Query Schema    |
| **tree()**              | 生成递归树形 Schema                    |
| **merge / omit / pick** | Schema 合并与裁剪工具                  |
| **fromModel()**         | 从 ORM Schema 自动生成 TypeBox Schema  |

## 📋 API 参考

### schema()

```typescript
import { schema } from '@pkg/route-model'
import { t } from 'elysia'

const UserSchema = schema({
  id: t.Number(),
  username: t.String(),
  email: t.Nullable(t.String()),
})
// 自动包含 createdAt / updatedAt

// 不含时间戳
const UserSchema = schema({ ... }, { timestamps: false })
```

### body() / updateBody()

```typescript
import { body, updateBody } from '@pkg/route-model'

// 创建 Body：所有字段必填
const CreateBody = body(
  {
    username: t.String(),
    email: t.String(),
    password: t.String(),
  },
  { exclude: ['id'] },
)

// 更新 Body：所有字段可选
const UpdateBody = updateBody(
  {
    username: t.String(),
    email: t.String(),
  },
  {
    exclude: ['password'],
    required: ['username'], // 保持必填
  },
)
```

### idParams()

```typescript
import { idParams } from '@pkg/route-model'

// 默认：{ id: Numeric }
const params = idParams()

// 自定义参数名
const params = idParams({ name: 'userId', label: '用户ID' })
```

### query()

```typescript
import { query } from '@pkg/route-model'

// 默认：page + pageSize + filter
const q = query()

// 附加字段
const q = query({
  extra: {
    status: t.Optional(t.Numeric()),
    type: t.Optional(t.String()),
  },
})

// 无分页
const q = query({ pagination: false })
```

### tree()

```typescript
import { tree } from '@pkg/route-model'

// 递归树形 Schema
const MenuTree = tree({
  id: t.Number(),
  name: t.String(),
  parentId: t.Nullable(t.Number()),
})
// 自动添加 children: Optional(Array(Self))
```

### merge / omit / pick

```typescript
import { merge, omit, pick } from '@pkg/route-model'

const base = { id: t.Number(), name: t.String(), age: t.Number() }

// 合并
const extended = merge(base, { email: t.String() })

// 排除
const withoutId = omit(base, ['id'])

// 选取
const nameOnly = pick(base, ['name'])
```

### fromModel()

从 ORM Schema 类自动生成 TypeBox Schema：

```typescript
import { fromModel } from '@pkg/route-model'
import UsersSchema from '@/models/users/schema'

const schema = fromModel(UsersSchema)

// 排除字段
const schema = fromModel(UsersSchema, { exclude: ['password'] })

// 选取字段
const schema = fromModel(UsersSchema, { include: ['id', 'username', 'email'] })
```

## 🔗 与 Model.getSchema() 的关系

`Model.getSchema()` 内部使用了 `@pkg/route-model` 的能力，两者可互换：

```typescript
// 方式一：通过 model 实例
const schema = model.users.getSchema('omit', ['password'])

// 方式二：通过 route-model 包
const schema = fromModel(UsersSchema, { exclude: ['password'] })
```

::: tip 推荐方式
在已注册模型的场景下，优先使用 `model.xxx.getSchema()`，更简洁。`fromModel()` 适合在模型尚未注册时使用。
:::

## 📝 预设字段

```typescript
import { timestamps, pagination, filterField } from '@pkg/route-model'

// timestamps = { createdAt: t.String(), updatedAt: t.String() }
// pagination = { page: t.Optional(t.Numeric()), pageSize: t.Optional(t.Numeric()) }
// filterField = { filter: t.Optional(t.String()) }
```
