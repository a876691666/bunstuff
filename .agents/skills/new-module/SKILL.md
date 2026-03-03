---
name: new-module
description: 构建新模块的完整最佳实践。从 Schema 定义、Seed 数据、Service 层、API 路由、Policy 权限到代码生成的端到端流程。关键词：new module、schema、seed、service、api、policy、crud、getSchema、definePolicy、buildWhere
---

# 构建新模块 — 完整流程

以「**文章管理**」为例，演示从 0 到 1 搭建一个带 CRUD、权限、数据域、操作日志的完整模块。

## 架构原则

- **显式代码 > 工厂封装**：每个文件显式编写完整 CRUD，确保可控可修改
- **禁止文件头部注释**：不写 `/** ... */` 描述文件用途，直接以 `import` 开头
- **security 统一声明**：在 Elysia 构造器 `detail` 中声明，单个路由不重复

## 目录结构（需要创建的文件）

```
backend/
  models/article/
    schema.ts          ← 1. 表结构
    seed.ts            ← 2. 初始数据
  services/article.ts  ← 3. 业务逻辑
  api/admin/article/
    index.ts           ← 4. 管理端路由
    policy.ts          ← 5. 权限策略
```

创建完成后运行 `bun run generate` 自动注册到 `_generated/` 下的所有注册表。

---

## Step 1. Schema — `models/article/schema.ts`

```typescript
import { TimestampSchema, column } from '../../packages/orm'

export const tableName = 'article'

export default class ArticleSchema extends TimestampSchema {
  id = column.number().primaryKey().autoIncrement().description('ID')
  title = column.string().default('').description('标题')
  content = column.string().default('').description('正文内容')
  categoryId = column.number().default(0).description('分类ID')
  coverUrl = column.string().nullable().default(null).description('封面图URL')
  sort = column.number().default(0).description('排序值')
  status = ArticleSchema.status(1).description('状态：1发布 0草稿')
  createBy = column.number().default(0).description('创建者ID')
  remark = column.string().nullable().default(null).description('备注')
}
```

**要点**：
- 继承 `TimestampSchema` 自动带 `createdAt` / `updatedAt`
- 必须 `export const tableName` + `export default class`（代码生成依赖这两项）
- `description()` 会自动同步到 API 文档

### column 链式 API 速查

```typescript
column.string()              // 文本
column.number()              // 数值（支持 .autoIncrement()）
column.boolean()             // 布尔
column.date()                // 日期
column.blob()                // 二进制

// 通用链式方法
.primaryKey()                // 主键
.autoIncrement()             // 自增（仅 number）
.unique()                    // 唯一约束
.nullable()                  // 允许 NULL
.default(value)              // 默认值
.description(text)           // 字段描述（同步到 API 文档）
.serialize(fn)               // 读取时转换
.deserialize(fn)             // 写入时转换

// Schema 静态便捷方法
ArticleSchema.status(1)      // → column.number().default(1)
ArticleSchema.sort(0)        // → column.number().default(0)
ArticleSchema.remark()       // → column.string().nullable().default(null)
```

---

## Step 2. Seed — `models/article/seed.ts`

```typescript
import type { SeedDefinition } from '@/services/seed'
import { model } from '@/core/model'

export const articleSeed: SeedDefinition = {
  name: 'article-default',
  description: '初始化文章示例数据',
  dependencies: ['dict-type-init'], // 可选，声明依赖其他 seed
  async run() {
    await model.article.create({
      title: '欢迎使用',
      content: '这是第一篇文章',
      status: 1,
      createBy: 1,
    })
  },
}

export default articleSeed
```

**要点**：
- `name` 全局唯一，`dependencies` 声明执行顺序
- 空表无需初始化数据时，`run()` 直接 log 即可
- 必须 `export default`（代码生成依赖）

---

## Step 3. Service — `services/article.ts`

```typescript
import type { Insert, Update } from '@/packages/orm'
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'

const Article = model.article

// ============ 查询 ============

export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return Article.page({
    where: buildWhere(Article.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
    orderBy: [{ column: 'sort', order: 'ASC' }],
  })
}

export async function findById(id: number, ctx?: CrudContext) {
  return Article.findOne({ where: buildWhere(Article.tableName, `id = ${id}`, ctx) })
}

// ============ 写入 ============

export async function create(data: Insert<typeof Article>, ctx?: CrudContext) {
  if (!checkCreateScope(Article.tableName, data as Record<string, any>, ctx)) return null
  return Article.create(data)
}

export async function update(id: number, data: Update<typeof Article>, ctx?: CrudContext) {
  const w = buildWhere(Article.tableName, `id = ${id}`, ctx)
  if (!w) return null
  const n = await Article.updateMany(w, data)
  if (n === 0) return null
  return Article.getOne(id as any)
}

export async function remove(id: number, ctx?: CrudContext) {
  const w = buildWhere(Article.tableName, `id = ${id}`, ctx)
  if (!w) return false
  return (await Article.deleteMany(w)) > 0
}

// ============ Schema 代理（供路由层使用） ============

export const getSchema: (typeof Article)['getSchema'] = Article.getSchema.bind(Article)
```

**要点**：
- **所有查询/写入都经过 `buildWhere` / `checkCreateScope`**，自动接入数据权限
- `ctx` 参数直接传 Elysia handler context（`CrudContext` 自动提取 userId/roleId/dataScope）
- `getSchema` 代理导出以便路由层 `service.getSchema({ ... })` 生成 body/response Schema

### Service 模式速查

```typescript
// 分页查询（自动带数据权限 WHERE）
Article.page({ where: buildWhere(tableName, filter, ctx), page, pageSize })

// 单条查询（组合 id 条件 + 数据权限）
Article.findOne({ where: buildWhere(tableName, `id = ${id}`, ctx) })

// 创建前检查数据权限
checkCreateScope(tableName, data, ctx)

// 更新/删除经过数据权限过滤
Article.updateMany(buildWhere(...), data)
Article.deleteMany(buildWhere(...))

// 唯一性校验
Article.findOne({ where: `code = '${code}'` })
```

---

## Step 4. API 路由 — `api/admin/article/index.ts`

```typescript
import { Elysia } from 'elysia'
import * as articleService from '@/services/article'
import { idParams, query } from '@/packages/route-model'
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { operLogPlugin } from '@/plugins/oper-log'

export default new Elysia({
  tags: ['管理 - 文章'],
  detail: { security: [{ bearerAuth: [] }] },
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // 列表
  .get('/', async (ctx) => {
    const result = await articleService.findAll(ctx.query, ctx)
    return R.page(result)
  }, {
    query: query(),
    response: { 200: PagedResponse(articleService.getSchema(), '文章列表') },
    detail: {
      summary: '获取文章列表',
      rbac: { scope: { permissions: ['article:admin:list'] } },
    },
  })

  // 详情
  .get('/:id', async (ctx) => {
    const data = await articleService.findById(ctx.params.id, ctx)
    if (!data) return R.notFound('文章')
    return R.ok(data)
  }, {
    params: idParams({ label: '文章ID' }),
    response: { 200: SuccessResponse(articleService.getSchema()), 404: ErrorResponse },
    detail: {
      summary: '获取文章详情',
      rbac: { scope: { permissions: ['article:admin:read'] } },
    },
  })

  // 创建
  .post('/', async (ctx) => {
    const data = await articleService.create({ ...ctx.body, createBy: ctx.userId! }, ctx)
    return data ? R.ok(data, '创建成功') : R.fail('无权创建')
  }, {
    body: articleService.getSchema({ exclude: ['id', 'createBy'], required: ['title', 'content'] }),
    response: { 200: SuccessResponse(articleService.getSchema()), 400: ErrorResponse },
    detail: {
      summary: '创建文章',
      rbac: { scope: { permissions: ['article:admin:create'] } },
      operLog: { title: '文章管理', type: 'create' },
    },
  })

  // 更新
  .put('/:id', async (ctx) => {
    const existing = await articleService.findById(ctx.params.id, ctx)
    if (!existing) return R.notFound('文章')
    const data = await articleService.update(ctx.params.id, ctx.body, ctx)
    return data ? R.ok(data, '更新成功') : R.fail('更新失败')
  }, {
    params: idParams({ label: '文章ID' }),
    body: articleService.getSchema({ exclude: ['id', 'createBy'], partial: true }),
    response: { 200: SuccessResponse(articleService.getSchema()), 404: ErrorResponse },
    detail: {
      summary: '更新文章',
      rbac: { scope: { permissions: ['article:admin:update'] } },
      operLog: { title: '文章管理', type: 'update' },
    },
  })

  // 删除
  .delete('/:id', async (ctx) => {
    const existing = await articleService.findById(ctx.params.id, ctx)
    if (!existing) return R.notFound('文章')
    await articleService.remove(ctx.params.id, ctx)
    return R.success('删除成功')
  }, {
    params: idParams({ label: '文章ID' }),
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      summary: '删除文章',
      rbac: { scope: { permissions: ['article:admin:delete'] } },
      operLog: { title: '文章管理', type: 'delete' },
    },
  })
```

**要点**：
- `export default new Elysia(...)` 直接导出（代码生成依赖默认导出）
- `tags` 对应 `backend/index.ts` 中的 OpenAPI tags 分组
- `detail: { security }` 在构造器统一声明，单个路由不重复写
- Schema 全部使用 `service.getSchema(...)` 内联生成，不预定义变量
- handler 参数用 `ctx` 整体传递给 service（`CrudContext` 兼容）
- `operLog: { title, type }` 自动记录操作日志
- 不写文件头部注释，直接以 `import` 开头

### 路由配置速查

```typescript
// Schema 用法
body:     service.getSchema({ exclude: ['id'], required: ['name'] })
body:     service.getSchema({ exclude: ['id'], partial: true })
response: { 200: SuccessResponse(service.getSchema()) }
response: { 200: PagedResponse(service.getSchema(), '描述') }
response: { 200: MessageResponse, 404: ErrorResponse }

// 插件链（管理端标准组合）
.use(authPlugin()).use(rbacPlugin()).use(vipPlugin()).use(operLogPlugin())

// 构造器配置（security 统一声明）
new Elysia({
  tags: ['管理 - XX'],
  detail: { security: [{ bearerAuth: [] }] },
})

// detail 配置（单个路由无需 security）
detail: {
  summary: '简短标题',
  rbac: { scope: { permissions: ['xxx:admin:list'] } },
  operLog: { title: '模块名', type: 'create' | 'update' | 'delete' },
}
```

---

## Step 5. Policy — `api/admin/article/policy.ts`

```typescript
import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'article',
  permissions: [
    { code: 'article:admin:list', name: '查看文章列表' },
    { code: 'article:admin:read', name: '查看文章详情' },
    { code: 'article:admin:create', name: '创建文章' },
    { code: 'article:admin:update', name: '更新文章' },
    { code: 'article:admin:delete', name: '删除文章' },
  ],
  roles: {
    'super-admin': '*',                    // 全部权限
    'admin': '*',                           // 全部权限
    'user': ['article:admin:list', 'article:admin:read'], // 仅查看
  },
  scopes: [
    // user 角色仅能查看自己创建的文章
    {
      role: 'user',
      table: 'article',
      permission: 'article:admin:list',
      rule: "createBy = $auth.userId",
      description: '仅查看自己的文章',
    },
    {
      role: 'user',
      table: 'article',
      permission: 'article:admin:read',
      rule: "createBy = $auth.userId",
      description: '仅查看自己的文章',
    },
  ],
})
```

**要点**：
- `module` 仅用于日志标识
- `permissions.code` 权限编码格式：`模块:admin:动作`
- `roles` 中 `'*'` 表示该角色拥有本模块全部权限
- `scopes.rule` 支持 Velocity 变量 `$auth.userId` / `$auth.roleId` / `$req.params.xxx`

---

## Step 6. 生成注册表

```bash
bun run generate
```

自动生成/更新以下文件（**无需手动编辑**）：
- `_generated/model.generated.ts` — 新增 `article: ModelOf<typeof ArticleSchema>` 类型
- `_generated/schemas.generated.ts` — 新增 Schema 运行时导入
- `_generated/seeds.generated.ts` — 新增 Seed 导入
- `_generated/routes.generated.ts` — 新增 `{ prefix: 'api/admin/article', module }` 路由
- `_generated/policies.generated.ts` — 新增 Policy 导入

---

## 如需客户端 API（可选）

客户端路由放 `api/_/article/`，同样支持 `policy.ts`。

### `api/_/article/index.ts`

```typescript
import { Elysia, t } from 'elysia'
import * as articleService from '@/services/article'
import { R, PagedResponse, SuccessResponse } from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'

export default new Elysia({
  tags: ['客户端 - 文章'],
  detail: { security: [{ bearerAuth: [] }] },
})
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())

  .get('/', async ({ query }) => {
    const result = await articleService.findAll({ ...query, filter: `status = 1 && ${query.filter || '1=1'}` })
    return R.page(result)
  }, {
    query: t.Object({
      page: t.Optional(t.Numeric({ default: 1 })),
      pageSize: t.Optional(t.Numeric({ default: 10 })),
      filter: t.Optional(t.String()),
    }),
    response: { 200: PagedResponse(articleService.getSchema({ exclude: ['createBy'] })) },
    detail: {
      summary: '获取文章列表（客户端）',
      rbac: { scope: { permissions: ['article:client:list'] } },
    },
  })
```

### `api/_/article/policy.ts`（可选）

```typescript
import { definePolicy } from '@/core/policy'

export default definePolicy({
  module: 'article-client',
  permissions: [
    { code: 'article:client:list', name: '客户端查看文章列表' },
  ],
  roles: {
    'super-admin': '*',
    'admin': '*',
    'user': '*',
  },
})
```

> `gen-registry.ts` 使用 `**/policy.ts` 扫描整个 `api/` 目录，`api/_/` 下的 policy 同样会被自动注册。所有客户端路由已挂载 `rbacPlugin`，权限链路完整。

---

## 清单总结

| # | 文件 | 关键导出 |
|---|------|----------|
| 1 | `models/article/schema.ts` | `tableName` + `default class` |
| 2 | `models/article/seed.ts` | `SeedDefinition` + `export default` |
| 3 | `services/article.ts` | CRUD 函数 + `getSchema` 代理 |
| 4 | `api/admin/article/index.ts` | `export default new Elysia(...)` |
| 5 | `api/admin/article/policy.ts` | `export default definePolicy(...)` |
| 6 | 运行 `bun run generate` | 自动注册 |
