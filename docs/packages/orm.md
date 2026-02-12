# ORM

## 概述

`@pkg/orm` 是专为本项目设计的轻量级 ORM，支持 SQLite / MySQL / PostgreSQL。

## 核心组件

| 文件 | 导出 | 说明 |
|------|------|------|
| `column.ts` | `column` | 链式列构建器 |
| `schema.ts` | `Schema`, `TimestampSchema`, `BaseSchema` | Schema 基类 |
| `model.ts` | `Model` | 模型类（CRUD + getSchema） |
| `db.ts` | `DB` | 数据库连接 + 模型工厂 |
| `types.ts` | `Row`, `Insert`, `Update` | 类型推导工具 |

## DB 类

### 创建连接

```typescript
import { DB } from '@pkg/orm'

// SQLite
const db = new DB('sqlite://data/myapp.db')

// MySQL
const db = new DB('mysql://user:password@localhost:3306/dbname')

// PostgreSQL
const db = new DB('postgres://user:password@localhost:5432/dbname')
```

### 创建模型

```typescript
const User = await db.model({
  tableName: 'users',
  schema: UsersSchema,
})
```

`db.model()` 会自动执行 `syncTable()`，确保数据库表结构与 Schema 一致。

## Column 构建器

### 类型方法

```typescript
import { column } from '@pkg/orm'

column.string()   // TEXT / VARCHAR   → string
column.number()   // INTEGER / INT    → number
column.boolean()  // BOOLEAN          → boolean
column.date()     // DATETIME         → string
column.blob()     // BLOB             → Buffer
```

### 链式修饰

```typescript
column.number()
  .primaryKey()           // 设为主键
  .autoIncrement()        // 自增
  .description('用户ID')  // OpenAPI 描述

column.string()
  .default('')            // 默认值
  .unique()               // 唯一约束
  .nullable()             // 允许 NULL
  .description('用户名')

column.string()
  .default('[]')
  .serialize((v: string[]) => JSON.stringify(v))     // 写入时序列化
  .deserialize((v: string) => JSON.parse(v) as string[])  // 读取时反序列化
  .description('标签列表')
```

## Schema 定义

```typescript
import { TimestampSchema, column } from '@pkg/orm'

export default class ArticleSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('ID')
  title = column.string().default('').description('标题')
  content = column.string().default('').description('内容')
  status = column.number().default(1).description('状态')
  sort = column.number().default(0).description('排序')
  publishedAt = column.string().nullable().description('发布时间')
}
```

### 继承体系

```typescript
// 无额外字段
class Schema {}

// 自动时间戳
class TimestampSchema extends Schema {
  createdAt = column.string().description('创建时间')
  updatedAt = column.string().description('更新时间')
}

// 带备注
class BaseSchema extends TimestampSchema {
  remark = column.string().default('').description('备注')
}
```

## Model CRUD

```typescript
const Article = await db.model({ tableName: 'article', schema: ArticleSchema })

// 查询所有
const articles = await Article.findMany()
const articles = await Article.findMany({ status: 1 })

// 分页查询
const result = await Article.findPage({ page: 1, pageSize: 10 })
// { data: Row[], total: number }

// 条件查询
const article = await Article.findOne({ title: 'hello' })
const article = await Article.findById(1)

// 统计
const count = await Article.count({ status: 1 })
const exists = await Article.exists({ title: 'hello' })

// 创建
const newArticle = await Article.create({
  title: '新文章',
  content: '内容...',
})

// 更新
const updated = await Article.update(1, { title: '修改标题' })

// 删除
const deleted = await Article.delete(1)
```

## getSchema()

从 Schema 生成 TypeBox Schema，用于 Elysia 路由校验和 OpenAPI 文档：

```typescript
// 完整 Schema（所有字段）
Article.getSchema()

// 排除字段（用于创建 Body）
Article.getSchema({ exclude: ['id', 'createdAt', 'updatedAt'] })

// 部分字段可选（用于更新 Body）
Article.getSchema({ exclude: ['id'], partial: true })

// 指定必填字段
Article.getSchema({
  exclude: ['id'],
  required: ['title', 'content'],
})

// 添加额外字段
Article.getSchema(
  { exclude: ['id'] },
  { categoryName: t.String({ description: '分类名' }) }
)
```

### 在路由中使用

```typescript
.post('/articles', handler, {
  body: Article.getSchema({ exclude: ['id'], required: ['title'] }),
  response: { 200: SuccessResponse(Article.getSchema()) },
})

.put('/articles/:id', handler, {
  body: Article.getSchema({ exclude: ['id'], partial: true }),
  response: { 200: SuccessResponse(Article.getSchema()) },
})
```

## 类型推导

```typescript
import type { Row, Insert, Update, InferRow, InsertData, UpdateData } from '@pkg/orm'

// 从模型实例推导
type ArticleRow = Row<typeof Article>
type ArticleInsert = Insert<typeof Article>
type ArticleUpdate = Update<typeof Article>

// 从 Schema 类推导
type ArticleRow2 = InferRow<ArticleSchema>
type ArticleInsert2 = InsertData<ArticleSchema>
type ArticleUpdate2 = UpdateData<ArticleSchema>
```

## 表同步

`db.model()` 调用时自动同步表结构：

| 场景 | 行为 |
|------|------|
| 表不存在 | 自动 `CREATE TABLE` |
| 新增字段 | 自动 `ALTER TABLE ADD COLUMN` |
| 删除字段 | **不操作**（安全考虑） |
| 类型变更 | **不操作**（需手动迁移） |
