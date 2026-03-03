# @pkg/orm

轻量级 ORM 包，支持 SQLite / MySQL / PostgreSQL，提供 Schema 定义、自动建表、CRUD 操作和分页查询。

## 🎯 核心能力

| 功能 | 说明 |
|------|------|
| **Schema 定义** | 类式 Schema + `column` 链式 API |
| **自动建表** | 根据 Schema 自动 CREATE / ALTER TABLE |
| **CRUD** | `create` / `findOne` / `findMany` / `update` / `deleteMany` |
| **分页** | `page()` / `list()` |
| **getSchema** | 从 ORM Schema 生成 Elysia TypeBox Schema |
| **多数据库** | 同一 API 适配 SQLite / MySQL / PostgreSQL |

## 📋 导出清单

```typescript
// 核心类
export { DB } from './db'
export { Model } from './model'

// Schema 基类
export { Schema, TimestampSchema, BaseSchema } from './schema'

// 字段构造器
export { column } from './column'

// 类型工具
export type { Row, Insert, Update, ModelLike } from './types'

// 方言（来自 @pkg/ssql）
export { sqlite, mysql, postgres, getDialect, where, whereOr } from '@pkg/ssql'
```

## 🔧 使用示例

### 连接数据库

```typescript
import { DB } from '@pkg/orm'

// SQLite（默认）
const db = new DB('data/myapp.db')

// MySQL
const db = new DB('mysql://user:pass@localhost:3306/mydb')

// PostgreSQL
const db = new DB('postgres://user:pass@localhost:5432/mydb')
```

### 定义 Schema

```typescript
import { TimestampSchema, column } from '@pkg/orm'

export const tableName = 'users'

export default class UsersSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('用户ID')
  username = column.string().default('').description('用户名')
  email = column.string().nullable().default(null).description('邮箱')
  status = UsersSchema.status(1).description('状态')
}
```

### 注册 Model

```typescript
const Users = await db.model({
  tableName: 'users',
  schema: UsersSchema,
})
```

### CRUD 操作

```typescript
// 创建
const user = await Users.create({
  username: 'admin',
  email: 'admin@example.com',
  status: 1,
})

// 查询单条
const found = await Users.findOne({ where: 'id = 1' })

// 查询多条
const actives = await Users.findMany({
  where: 'status = 1',
  orderBy: [{ column: 'id', order: 'DESC' }],
})

// 分页查询
const page = await Users.page({
  where: 'status = 1',
  page: 1,
  pageSize: 10,
})
// → { data: [...], total: 100, page: 1, pageSize: 10 }

// 更新
await Users.update(1, { email: 'new@example.com' })

// 删除
await Users.deleteMany('id = 1')
```

### getSchema

Model 实例提供 `getSchema()` 方法，自动将 ORM Schema 转换为 Elysia TypeBox Schema：

```typescript
// 完整 Schema
const full = Users.getSchema()

// 排除字段
const createBody = Users.getSchema('omit', ['id', 'createdAt', 'updatedAt'])

// 选取字段
const updateBody = Users.getSchema('pick', ['username', 'email'])
```

## 📋 column API

| 构造器 | SQL 类型 | TS 类型 |
|--------|---------|---------|
| `column.string()` | TEXT | `string` |
| `column.number()` | INTEGER | `number` |
| `column.boolean()` | INTEGER | `boolean` |
| `column.date()` | TEXT | `Date` |
| `column.blob()` | BLOB | `Buffer` |

| 修饰符 | 说明 |
|--------|------|
| `.primaryKey()` | 主键 |
| `.autoIncrement()` | 自增 |
| `.nullable()` | 允许 NULL |
| `.unique()` | 唯一约束 |
| `.default(val)` | 默认值 |
| `.description(text)` | 字段描述 |
| `.deserialize(fn)` | 写入时转换 |
