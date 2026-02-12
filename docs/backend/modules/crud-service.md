# CrudService 基类

## 概述

`CrudService` 是所有 CRUD 服务的基类（位于 `modules/crud-service.ts`），提供：

- 统一的增删改查接口
- 分页查询（SSQL 过滤）
- 数据权限过滤（DataScope）
- VelocityJS 模板渲染

## 基本用法

```typescript
import { CrudService } from '@/modules/crud-service'
import MyModel from '@/models/my-model'

class MyService extends CrudService<typeof MyModel.schemaInstance> {
  constructor() {
    super(MyModel)
  }
  
  // 可添加自定义方法
  async findByName(name: string) {
    return this.model.findOne({ name })
  }
}

export const myService = new MyService()
```

## API 方法

### 查询方法

#### findAll(query?, ctx?)

分页查询，支持 SSQL 过滤和数据权限：

```typescript
const result = await service.findAll({
  page: 1,
  pageSize: 10,
  filter: 'status = 1 && name ~ "test"',
}, ctx)

// 返回: { data: Row[], total: number, page: number, pageSize: number }
```

#### findById(id, ctx?)

根据 ID 查询单条记录：

```typescript
const row = await service.findById(1, ctx)
// 返回: Row | null
```

#### findOne(filter, ctx?)

根据条件查询单条记录：

```typescript
const row = await service.findOne({ username: 'admin' }, ctx)
```

#### findMany(filter?, ctx?)

查询多条记录（不分页）：

```typescript
const rows = await service.findMany({ status: 1 }, ctx)
```

#### count(filter?, ctx?)

统计数量：

```typescript
const total = await service.count({ status: 1 }, ctx)
```

#### exists(filter, ctx?)

检查是否存在：

```typescript
const found = await service.exists({ username: 'admin' }, ctx)
```

### 写入方法

#### create(data, ctx?)

创建记录：

```typescript
const row = await service.create({
  username: 'test',
  email: 'test@example.com',
}, ctx)
// 返回: Row | null（创建后的完整记录）
```

#### update(id, data, ctx?)

更新单条记录：

```typescript
const row = await service.update(1, {
  nickname: '新昵称',
}, ctx)
// 返回: Row | null
```

#### updateMany(filter, data, ctx?)

批量更新：

```typescript
const count = await service.updateMany(
  { status: 0 },    // 条件
  { status: 1 },    // 更新数据
  ctx
)
// 返回: number（更新行数）
```

#### delete(id, ctx?)

删除单条记录：

```typescript
const ok = await service.delete(1, ctx)
// 返回: boolean
```

#### deleteMany(filter, ctx?)

批量删除：

```typescript
const count = await service.deleteMany({ status: 0 }, ctx)
// 返回: number（删除行数）
```

## 数据权限集成

当请求上下文（ctx）中包含 `dataScope` 时，CrudService 自动应用数据权限过滤。

### 查询过滤

```
原始查询: SELECT * FROM users WHERE status = 1
DataScope: createBy = 42
最终查询: SELECT * FROM users WHERE status = 1 AND createBy = 42
```

### 创建校验

创建数据时，DataScope 的 SSQL 规则会被解析为 AST，通过布尔求值检查新数据是否满足权限范围：

```
DataScope: deptId = 3
创建数据: { name: "test", deptId: 5 }
校验: deptId(5) = 3 → false → 拒绝创建
```

### 更新/删除过滤

更新和删除操作同样会合并 DataScope 条件到 WHERE 子句，确保用户只能修改权限范围内的数据。

## Velocity 模板

CrudService 使用 VelocityJS 渲染 SSQL 参数中的模板变量：

```typescript
// DataScope 规则模板
"createBy = $auth.userId"

// 渲染上下文
{
  auth: { userId: 42, roleId: 1, username: 'admin' },
  req: { method: 'GET', path: '/api/admin/users' },
}

// 渲染结果
"createBy = 42"
```

## 完整 CRUD 路由示例

```typescript
import Elysia from 'elysia'
import { authPlugin } from '@/modules/auth/main/plugin'
import { rbacPlugin } from '@/modules/rbac/main/plugin'
import { operLogPlugin } from '@/modules/system/oper-log/plugin'
import { query, idParams } from '@/packages/route-model'
import { R, PagedResponse, SuccessResponse, ErrorResponse, MessageResponse } from '@/modules/response'
import Model from '@/models/my-model'
import { myService } from './service'

export const myAdminApi = new Elysia({ prefix: '/my-model', tags: ['我的模块'] })
  .use(authPlugin())
  .use(rbacPlugin())
  .use(operLogPlugin())

  // 列表
  .get('/', async (ctx) => R.page(await myService.findAll(ctx.query, ctx)), {
    query: query(),
    response: { 200: PagedResponse(Model.getSchema()) },
    detail: { rbac: { scope: { permissions: ['my-model:admin:list'] } } },
  })

  // 详情
  .get('/:id', async (ctx) => {
    const data = await myService.findById(ctx.params.id, ctx)
    return data ? R.ok(data) : R.notFound('数据')
  }, {
    params: idParams(),
    response: { 200: SuccessResponse(Model.getSchema()), 404: ErrorResponse },
    detail: { rbac: { scope: { permissions: ['my-model:admin:read'] } } },
  })

  // 创建
  .post('/', async (ctx) => R.ok(await myService.create(ctx.body, ctx)), {
    body: Model.getSchema({ exclude: ['id'], required: ['name'] }),
    response: { 200: SuccessResponse(Model.getSchema()) },
    detail: {
      rbac: { scope: { permissions: ['my-model:admin:create'] } },
      operLog: { title: '我的模块', type: 'create' },
    },
  })

  // 更新
  .put('/:id', async (ctx) => {
    const r = await myService.update(ctx.params.id, ctx.body, ctx)
    return r ? R.ok(r) : R.notFound('数据')
  }, {
    params: idParams(),
    body: Model.getSchema({ exclude: ['id'], partial: true }),
    response: { 200: SuccessResponse(Model.getSchema()), 404: ErrorResponse },
    detail: {
      rbac: { scope: { permissions: ['my-model:admin:update'] } },
      operLog: { title: '我的模块', type: 'update' },
    },
  })

  // 删除
  .delete('/:id', async (ctx) => {
    return (await myService.delete(ctx.params.id, ctx))
      ? R.success('删除成功') : R.notFound('数据')
  }, {
    params: idParams(),
    response: { 200: MessageResponse, 404: ErrorResponse },
    detail: {
      rbac: { scope: { permissions: ['my-model:admin:delete'] } },
      operLog: { title: '我的模块', type: 'delete' },
    },
  })
```
