# ⚙️ CRUD 服务

CRUD 服务模块提供标准化的增删改查工具，集成数据权限过滤和 Velocity 模板渲染，是所有业务 Service 的基础构建块。

## 📖 模块概览

| 组件 | 路径 | 说明 |
|------|------|------|
| `buildWhere` | `core/crud.ts` | 构建带数据权限的 WHERE 条件 |
| `checkCreateScope` | `core/crud.ts` | 创建数据前的权限校验 |
| `buildVelocityContext` | `core/crud.ts` | 构建 Velocity 模板上下文 |
| `renderSsql` | `core/crud.ts` | Velocity 模板渲染 |
| `evaluateSsql` | `core/crud.ts` | SSQL 布尔求值 |

## 🏗️ Service 模式

Bunstuff 的业务 Service 采用**函数式模块**模式，每个模块导出一组函数，配合 `buildWhere()` 和 `checkCreateScope()` 实现透明的数据权限过滤。

### 标准 Service 模板

```typescript
import { model } from '@/core/model'
import { buildWhere, checkCreateScope, type CrudContext, type PageQuery } from '@/core/crud'
import type { Insert, Update } from '@/packages/orm'

const MyTable = model.my_table

// ============ 查询方法 ============

/** 分页查询（自动应用数据权限） */
export async function findAll(query: PageQuery, ctx?: CrudContext) {
  return MyTable.page({
    where: buildWhere(MyTable.tableName, query?.filter, ctx),
    page: query?.page,
    pageSize: query?.pageSize,
  })
}

/** 按 ID 查询（自动应用数据权限） */
export async function findById(id: number, ctx?: CrudContext) {
  return MyTable.findOne({
    where: buildWhere(MyTable.tableName, `id = ${id}`, ctx)
  })
}

// ============ 写入方法 ============

/** 创建记录（数据权限校验） */
export async function create(data: Insert<typeof MyTable>, ctx?: CrudContext) {
  if (!checkCreateScope(MyTable.tableName, data as Record<string, any>, ctx))
    return null
  return MyTable.create(data)
}

/** 更新记录（数据权限过滤） */
export async function update(id: number, data: Update<typeof MyTable>, ctx?: CrudContext) {
  const where = buildWhere(MyTable.tableName, `id = ${id}`, ctx)
  if (!where) return null
  const n = await MyTable.updateMany(where, data)
  if (n === 0) return null
  return MyTable.getOne(id as any)
}

/** 删除记录（数据权限过滤） */
export async function remove(id: number, ctx?: CrudContext) {
  const where = buildWhere(MyTable.tableName, `id = ${id}`, ctx)
  if (!where) return false
  return (await MyTable.deleteMany(where)) > 0
}

/** Schema 代理，用于路由类型生成 */
export const getSchema: (typeof MyTable)['getSchema'] = MyTable.getSchema.bind(MyTable)
```

## 📐 类型定义

### PageQuery - 分页查询参数

```typescript
interface PageQuery {
  page?: number       // 页码（默认 1）
  pageSize?: number   // 每页数量（默认 10）
  filter?: string     // SSQL 过滤表达式
}
```

### PageResult - 分页查询结果

```typescript
interface PageResult<T> {
  data: T[]           // 数据列表
  total: number       // 总记录数
  page: number        // 当前页码
  pageSize: number    // 每页数量
}
```

### CrudContext - CRUD 上下文

```typescript
interface CrudContext {
  request?: Request
  params?: Record<string, any>
  body?: any
  query?: Record<string, any>
  cookie?: Record<string, any>
  userId?: number | null
  roleId?: string | null
  session?: any
  dataScope?: DataScope | null
  [key: string]: any
}
```

:::tip 直接传入 Elysia 上下文
`CrudContext` 兼容 Elysia handler 的上下文对象，可以直接将 `ctx` 传入：

```typescript
app.get('/items', async (ctx) => {
  const result = await itemService.findAll(ctx.query, ctx)
  return R.page(result)
})
```
:::

## 🔧 核心函数

### buildWhere - 构建 WHERE 条件

```typescript
function buildWhere(
  tableName: string,
  filter?: string,
  ctx?: CrudContext
): string | undefined
```

将用户的 `filter` 与 DataScope 中的 SSQL 规则合并为一个 WHERE 字符串。

**合并逻辑：**

| 情况 | 返回值 |
|------|--------|
| 无 dataScope | `filter \|\| undefined` |
| 有 dataScope 但无匹配规则 | `filter \|\| undefined` |
| 有 scope 规则，无 filter | `scopeExpr` |
| 有 scope 规则 + filter | `(filter) && (scopeExpr)` |

**Scope 规则合并：**

```typescript
// 多条规则之间用 OR
const scopeExpr = rendered.length === 1
  ? rendered[0]
  : `(${rendered.join(' || ')})`
```

### checkCreateScope - 创建权限校验

```typescript
function checkCreateScope(
  tableName: string,
  data: Record<string, any>,
  ctx?: CrudContext
): boolean
```

创建数据前检查新记录是否符合数据域规则。例如，某角色只能创建 `deptId = 1` 的记录，如果提交的数据 `deptId = 2`，则校验不通过。

**校验流程：**

1. 获取并渲染该表的 scope 规则
2. 若无规则 → 返回 `true`（无限制）
3. 将 SSQL 规则作为布尔表达式对 `data` 对象求值
4. 满足任一规则 → 返回 `true`

```typescript
// 示例：规则 'deptId = 1'，数据 { deptId: 1, name: 'test' }
checkCreateScope('orders', { deptId: 1, name: 'test' }, ctx)  // true
checkCreateScope('orders', { deptId: 2, name: 'test' }, ctx)  // false
```

### getScopeRules - 获取已渲染的规则

```typescript
function getScopeRules(tableName: string, ctx?: CrudContext): string[]
```

从 DataScope 获取原始规则，通过 Velocity 渲染后返回。

## 🎨 Velocity 模板渲染

### 上下文构建

`buildVelocityContext()` 从 Elysia 上下文自动构建 Velocity 模板变量：

```typescript
const velocityCtx = {
  req: {
    method: 'GET',
    url: 'http://...',
    headers: { ... },
    cookies: { ... },
    body: { ... },
    params: { id: '1', deptId: '3' },
    query: { status: '1' },
  },
  auth: {
    userId: 1,
    roleId: 'editor',
    roleCode: 'editor',
    username: 'zhangsan',
    session: { ... },
  },
  // 其它非内置键也会透传
}
```

### 模板语法

```velocity
## 简单变量替换
id = $auth.userId

## 嵌套属性
deptId = $req.params.deptId

## 字符串值需要引号
roleId = "$auth.roleId"
```

### 渲染过程

```typescript
function renderSsql(ssqlTemplate: string, velocityCtx: Record<string, any>): string {
  try {
    return render(ssqlTemplate, velocityCtx).trim()
  } catch {
    return ssqlTemplate  // 渲染失败则原样返回
  }
}
```

### 完整示例

```
原始规则:  createBy = $auth.userId && deptId = $req.params.deptId
模板上下文: { auth: { userId: 42 }, req: { params: { deptId: 3 } } }
渲染结果:  createBy = 42 && deptId = 3
```

## 📊 SSQL 布尔求值

`evaluateSsql()` 将 SSQL 表达式解析为 AST，然后对给定数据对象进行布尔求值：

```typescript
function evaluateSsql(ssql: string, data: Record<string, any>): boolean
```

支持的操作符：

| 操作符 | SSQL 语法 | 说明 |
|--------|-----------|------|
| `Eq` | `field = value` | 等于 |
| `Neq` | `field != value` | 不等于 |
| `Gt` | `field > value` | 大于 |
| `Gte` | `field >= value` | 大于等于 |
| `Lt` | `field < value` | 小于 |
| `Lte` | `field <= value` | 小于等于 |
| `Like` | `field ~ '%value%'` | 模糊匹配 |
| `NotLike` | `field !~ '%value%'` | 非模糊匹配 |
| `In` | `field in (1,2,3)` | 包含 |
| `NotIn` | `field !in (1,2,3)` | 不包含 |
| `IsNull` | `field is null` | 为空 |
| `NotNull` | `field is not null` | 非空 |
| `Between` | `field between (1, 10)` | 区间 |

逻辑运算：

| 运算 | 语法 | 说明 |
|------|------|------|
| AND | `&&` | 且 |
| OR | `\|\|` | 或 |
| 分组 | `(expr)` | 优先级分组 |

## 🏷️ getSchema - TypeBox Schema 生成

ORM Model 的 `getSchema()` 方法根据 Schema 定义自动生成 TypeBox Schema，用于路由的 Body/Response 类型定义：

```typescript
// 完整 Schema（所有字段）
const fullSchema = myService.getSchema()

// 排除字段
const createBody = myService.getSchema({
  exclude: ['id'],          // 排除 ID
  partial: true,            // 所有字段可选
  required: ['name'],       // 但 name 必填
})

// 更新 Body
const updateBody = myService.getSchema({
  exclude: ['id', 'createBy'],
  partial: true,
})

// 排除时间戳
const bodyNoTs = myService.getSchema({
  exclude: ['id'],
  timestamps: false,        // 排除 createdAt/updatedAt
})
```

### 在路由中使用

```typescript
import * as myService from '@/services/my-service'
import { idParams, query } from '@/packages/route-model'
import { R, PagedResponse, SuccessResponse, MessageResponse, ErrorResponse } from '@/services/response'

app
  // 列表
  .get('/', async (ctx) => {
    const result = await myService.findAll(ctx.query, ctx)
    return R.page(result)
  }, {
    query: query(),
    response: { 200: PagedResponse(myService.getSchema(), '数据列表') },
    detail: {
      summary: '获取列表',
      rbac: { scope: { permissions: ['my:admin:list'] } },
    },
  })

  // 详情
  .get('/:id', async (ctx) => {
    const data = await myService.findById(ctx.params.id, ctx)
    if (!data) return R.notFound('记录')
    return R.ok(data)
  }, {
    params: idParams(),
    response: { 200: SuccessResponse(myService.getSchema()), 404: ErrorResponse },
    detail: {
      summary: '获取详情',
      rbac: { scope: { permissions: ['my:admin:read'] } },
    },
  })

  // 创建
  .post('/', async (ctx) => {
    const data = await myService.create(ctx.body, ctx)
    if (!data) return R.forbidden('无权创建')
    return R.ok(data, '创建成功')
  }, {
    body: myService.getSchema({ exclude: ['id'], timestamps: false, required: ['name'] }),
    response: { 200: SuccessResponse(myService.getSchema()), 400: ErrorResponse },
    detail: {
      summary: '创建记录',
      rbac: { scope: { permissions: ['my:admin:create'] } },
    },
  })

  // 更新
  .put('/:id', async (ctx) => {
    const data = await myService.update(ctx.params.id, ctx.body, ctx)
    if (!data) return R.forbidden('无权更新或记录不存在')
    return R.ok(data, '更新成功')
  }, {
    params: idParams(),
    body: myService.getSchema({ exclude: ['id'], partial: true }),
    response: { 200: SuccessResponse(myService.getSchema()), 404: ErrorResponse },
    detail: {
      summary: '更新记录',
      rbac: { scope: { permissions: ['my:admin:update'] } },
    },
  })

  // 删除
  .delete('/:id', async (ctx) => {
    const ok = await myService.remove(ctx.params.id, ctx)
    if (!ok) return R.forbidden('无权删除或记录不存在')
    return R.success('删除成功')
  }, {
    params: idParams(),
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      summary: '删除记录',
      rbac: { scope: { permissions: ['my:admin:delete'] } },
    },
  })
```

## 🔄 数据权限集成流程

### 查询流程（findAll）

```
前端请求 GET /api/admin/items?page=1&pageSize=10&filter=status=1
  │
  ├─ rbacPlugin.derive()
  │   └─ 构建 dataScope（含当前路由权限匹配的 scope 规则）
  │
  └─ handler
      ├─ findAll(ctx.query, ctx)
      │   ├─ buildWhere('items', 'status=1', ctx)
      │   │   ├─ dataScope.getSsqlRules('items') → ['createBy = $auth.userId']
      │   │   ├─ buildVelocityContext(ctx) → { auth: { userId: 42 }, ... }
      │   │   ├─ renderSsql('createBy = $auth.userId', ctx) → 'createBy = 42'
      │   │   └─ 返回: '(status=1) && (createBy = 42)'
      │   │
      │   └─ MyTable.page({ where: '(status=1) && (createBy = 42)' })
      │
      └─ R.page(result)
```

### 创建流程（create）

```
前端请求 POST /api/admin/items { "name": "test", "deptId": 2 }
  │
  └─ handler
      ├─ create(ctx.body, ctx)
      │   ├─ checkCreateScope('items', { name:'test', deptId:2 }, ctx)
      │   │   ├─ getScopeRules('items', ctx) → ['deptId = 1']
      │   │   ├─ evaluateSsql('deptId = 1', { name:'test', deptId:2 })
      │   │   └─ 返回 false（不满足任何规则）
      │   │
      │   └─ return null（创建被拒绝）
      │
      └─ R.forbidden('无权创建')
```

### 更新/删除流程

```
前端请求 PUT /api/admin/items/5 { "name": "updated" }
  │
  └─ handler
      ├─ update(5, ctx.body, ctx)
      │   ├─ buildWhere('items', 'id = 5', ctx)
      │   │   └─ 返回: '(id = 5) && (createBy = 42)'
      │   │
      │   ├─ MyTable.updateMany('(id = 5) && (createBy = 42)', data)
      │   │   └─ 若 id=5 的记录 createBy 不是 42 → 更新 0 行
      │   │
      │   └─ n === 0 → return null
      │
      └─ R.forbidden('无权更新或记录不存在')
```

:::warning 数据权限透明性
数据权限对 Service 调用者完全透明 —— 传入 `ctx` 即自动应用，无需业务代码关心。如果不传 `ctx` 或 `ctx.dataScope` 为 `null`，则不应用任何数据权限限制。
:::

## 📚 最佳实践

### 1. 始终传递 CrudContext

```typescript
// ✅ 推荐：传递完整上下文
const data = await myService.findAll(ctx.query, ctx)

// ❌ 不推荐：不传上下文（绕过数据权限）
const data = await myService.findAll(ctx.query)
```

### 2. 创建前校验

```typescript
// ✅ 推荐：使用 checkCreateScope
export async function create(data: Insert<typeof T>, ctx?: CrudContext) {
  if (!checkCreateScope(T.tableName, data as Record<string, any>, ctx))
    return null
  return T.create(data)
}
```

### 3. Schema 代理导出

```typescript
// ✅ 推荐：导出 Schema 代理供路由使用
export const getSchema: (typeof MyTable)['getSchema'] = MyTable.getSchema.bind(MyTable)
```

### 4. 更新采用 updateMany + getOne 模式

```typescript
// ✅ 推荐：先更新，再获取最新数据返回
export async function update(id: number, data: Update<typeof T>, ctx?: CrudContext) {
  const where = buildWhere(T.tableName, `id = ${id}`, ctx)
  if (!where) return null
  const n = await T.updateMany(where, data)
  if (n === 0) return null
  return T.getOne(id as any)
}
```
