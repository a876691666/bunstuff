# 模型定义规范

## 创建模型

每个模型包含两个文件，放在 `backend/models/` 下的独立目录中。

### Schema 文件

定义数据表结构：

```typescript
// models/article/schema.ts
import { TimestampSchema, column } from '@pkg/orm'

export default class ArticleSchema extends TimestampSchema {
  // 主键 — 自增 ID
  id = column.number().primaryKey().autoIncrement().description('文章ID')
  
  // 字符串字段
  title = column.string().default('').description('标题')
  content = column.string().default('').description('内容')
  slug = column.string().default('').unique().description('URL 别名')
  
  // 数字字段
  viewCount = column.number().default(0).description('浏览量')
  authorId = column.number().default(0).description('作者ID')
  
  // 状态字段（1=正常 0=禁用）
  status = column.number().default(1).description('状态：1正常 0禁用')
  
  // 排序字段
  sort = column.number().default(0).description('排序')
  
  // 可空字段
  publishedAt = column.string().nullable().description('发布时间')
  
  // JSON 字段（序列化/反序列化）
  tags = column.string().default('[]')
    .serialize((v: string[]) => JSON.stringify(v))
    .deserialize((v: string) => JSON.parse(v))
    .description('标签')
}
```

### 模型注册文件

```typescript
// models/article/index.ts
import { db } from '../main'
import Schema from './schema'

const Article = await db.model({
  tableName: 'article',
  schema: Schema,
})

export default Article
```

## Column 链式 API

`column` 提供链式构建器：

### 类型方法

| 方法 | SQL 类型 | TS 类型 |
|------|---------|---------|
| `column.string()` | TEXT / VARCHAR | `string` |
| `column.number()` | INTEGER / INT | `number` |
| `column.boolean()` | BOOLEAN | `boolean` |
| `column.date()` | DATETIME / TIMESTAMP | `string` |
| `column.blob()` | BLOB | `Buffer` |

### 修饰方法

| 方法 | 说明 |
|------|------|
| `.primaryKey()` | 设为主键 |
| `.autoIncrement()` | 自增 |
| `.unique()` | 唯一约束 |
| `.nullable()` | 允许 NULL |
| `.default(value)` | 默认值 |
| `.description(text)` | 字段描述（用于 OpenAPI） |
| `.serialize(fn)` | 写入时转换 |
| `.deserialize(fn)` | 读取时转换 |

## Schema 基类选择

| 基类 | 包含字段 | 适用场景 |
|------|---------|----------|
| `Schema` | 无额外字段 | 关联表、日志表 |
| `TimestampSchema` | `createdAt`, `updatedAt` | 大多数业务表 |
| `BaseSchema` | `createdAt`, `updatedAt`, `remark` | 需要备注的业务表 |

## getSchema() 用法

模型的 `getSchema()` 方法生成 TypeBox Schema，用于 Elysia 路由校验和 OpenAPI 文档：

```typescript
// 完整 Schema（所有字段）
Article.getSchema()

// 排除字段
Article.getSchema({ exclude: ['id', 'createdAt', 'updatedAt'] })

// 部分字段可选（用于更新 Body）
Article.getSchema({ exclude: ['id'], partial: true })

// 指定必填字段
Article.getSchema({ exclude: ['id'], required: ['title', 'content'] })

// 添加额外字段
Article.getSchema(
  { exclude: ['id'] },
  { categoryName: t.String() }
)
```

## 数据库同步

模型注册时自动同步表结构：

- **表不存在**：自动创建（CREATE TABLE）
- **新字段**：自动添加（ALTER TABLE ADD COLUMN）
- **字段删除**：不自动删除（安全考虑）
- **类型变更**：不自动变更（需手动迁移）

## Model 类型推导

ORM 提供完整的类型推导工具：

```typescript
import type { Row, Insert, Update } from '@pkg/orm'

// 行类型（完整记录）
type ArticleRow = Row<typeof Article>
// { id: number, title: string, content: string, status: number, ... }

// 插入类型（排除自动生成字段）
type ArticleInsert = Insert<typeof Article>
// { title?: string, content?: string, status?: number, ... }

// 更新类型（所有字段可选）
type ArticleUpdate = Update<typeof Article>
// { title?: string, content?: string, status?: number, ... }
```
