# Route Model

## 概述

Route Model 是路由 Schema 工具包（`backend/packages/route-model`），为 Elysia 路由提供标准化的参数和响应 Schema 定义。

## API

### query()

生成分页 + 过滤查询参数 Schema：

```typescript
import { query } from '@/packages/route-model'

.get('/list', handler, {
  query: query(),
})

// 生成 Schema:
// {
//   page: t.Number({ default: 1 }),
//   pageSize: t.Number({ default: 10 }),
//   filter: t.Optional(t.String()),
// }
```

### idParams()

生成 ID 路径参数 Schema：

```typescript
import { idParams } from '@/packages/route-model'

.get('/:id', handler, {
  params: idParams(),
})

// 生成 Schema:
// {
//   id: t.Numeric(),  // 字符串自动转数字
// }
```

### schema()

生成带时间戳的响应 Schema（自动添加 createdAt/updatedAt）：

```typescript
import { schema } from '@/packages/route-model'

const ArticleSchema = schema({
  id: t.Number(),
  title: t.String(),
  content: t.String(),
})
// 自动包含 createdAt 和 updatedAt
```

### body()

生成创建请求体 Schema：

```typescript
import { body } from '@/packages/route-model'

.post('/', handler, {
  body: body({
    title: t.String(),
    content: t.String(),
    status: t.Number({ default: 1 }),
  }),
})
```

### updateBody()

生成更新请求体 Schema（所有字段自动变为可选）：

```typescript
import { updateBody } from '@/packages/route-model'

.put('/:id', handler, {
  body: updateBody({
    title: t.String(),
    content: t.String(),
    status: t.Number(),
  }),
})

// 所有字段变为 Optional
```

### tree()

生成树形递归结构 Schema：

```typescript
import { tree } from '@/packages/route-model'

const MenuTree = tree({
  id: t.Number(),
  name: t.String(),
  parentId: t.Number(),
})

// 生成自引用的 children 数组
```

### merge()

合并多个 Schema 对象：

```typescript
import { merge } from '@/packages/route-model'

const Combined = merge(
  { id: t.Number(), name: t.String() },
  { status: t.Number(), remark: t.String() }
)
```

### omit()

从 Schema 中移除指定字段：

```typescript
import { omit } from '@/packages/route-model'

const WithoutId = omit(ArticleSchema, ['id', 'createdAt'])
```

### pick()

从 Schema 中选取指定字段：

```typescript
import { pick } from '@/packages/route-model'

const IdAndTitle = pick(ArticleSchema, ['id', 'title'])
```

### fromModel()

从 ORM Schema 类生成 TypeBox Schema：

```typescript
import { fromModel } from '@/packages/route-model'
import ArticleSchema from '@/models/article/schema'

const typeboxSchema = fromModel(ArticleSchema)
```

## 与 Model.getSchema() 的关系

`Model.getSchema()` 内部也生成 TypeBox Schema，但更强大：

| 特性 | Route Model | Model.getSchema() |
|------|-------------|-------------------|
| 来源 | 手动定义 | 从 ORM Schema 自动生成 |
| 排除字段 | `omit()` | `{ exclude: [...] }` |
| 可选字段 | `updateBody()` | `{ partial: true }` |
| 必填字段 | 手动标注 | `{ required: [...] }` |
| 额外字段 | `merge()` | 第二参数 |

::: tip 推荐
优先使用 `Model.getSchema()` 生成 Schema，它能确保 Schema 与数据库模型始终同步。Route Model 中的工具函数作为补充使用。
:::

## 完整路由示例

```typescript
import { query, idParams } from '@/packages/route-model'
import { R, PagedResponse, SuccessResponse, ErrorResponse } from '@/modules/response'
import Article from '@/models/article'

export const articleApi = new Elysia({ prefix: '/article' })
  .get('/', (ctx) => R.page(articleService.findAll(ctx.query, ctx)), {
    query: query(),
    response: { 200: PagedResponse(Article.getSchema()) },
  })
  .get('/:id', (ctx) => { ... }, {
    params: idParams(),
    response: { 200: SuccessResponse(Article.getSchema()), 404: ErrorResponse },
  })
  .post('/', (ctx) => { ... }, {
    body: Article.getSchema({ exclude: ['id'], required: ['title'] }),
    response: { 200: SuccessResponse(Article.getSchema()) },
  })
  .put('/:id', (ctx) => { ... }, {
    params: idParams(),
    body: Article.getSchema({ exclude: ['id'], partial: true }),
    response: { 200: SuccessResponse(Article.getSchema()), 404: ErrorResponse },
  })
```
