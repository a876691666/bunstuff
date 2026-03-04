````skill
---
name: elysia-crud-api
description: Elysia CRUD API 最佳实践。基于 Model.getSchema() 的增删改查接口开发规范，包含权限校验、响应类型、OpenAPI 文档配置。关键词：CRUD、getSchema、response、rbac、detail、PagedResponse、SuccessResponse
---

# Elysia CRUD API 最佳实践

基于 Elysia + TypeBox + ORM Model 的完整 CRUD API 开发规范。

## 架构设计原则

> **显式代码 > 工厂封装**：每个 API 文件和 Service 文件都显式编写完整的 CRUD 代码，不使用 `createCrudService()` 或 `createAdminCrud()` 等工厂函数。
> 这确保每个接口的代码**完全可控、可独立修改**，开发者无需理解工厂抽象层即可直接定位和修改任意接口的逻辑。

## 代码规范

- **禁止文件头部注释**：不要在文件顶部添加 `/** ... */` 块注释描述文件用途，直接以 `import` 开头
- **Schema 内联定义**：使用 `service.getSchema()` 在使用处生成，不预定义 Schema 常量
- **handler 使用 ctx**：handler 参数统一用 `ctx`，整体传给 service 以支持数据权限
- **Tags 自动分配**：Elysia 构造器不写 `tags`，由 `config.ts` 中的 `name` 字段自动分配

## 基础结构

```typescript
import { Elysia, t } from 'elysia'
import { idParams, query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { operLogPlugin } from '@/plugins/oper-log'
import MyModel from '@/models/my-model'

// tags 由 config.ts 的 name 字段自动分配，无需在构造器中手动声明
export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())
// ... 路由定义
```

## Schema 定义规范

**✅ 推荐**：使用 `Model.getSchema()` 内联定义

```typescript
// ✅ 直接在使用处生成 Schema
{
  body: MyModel.getSchema({ exclude: ['id'], required: ['name'] }),
  response: { 200: SuccessResponse(MyModel.getSchema()) }
}
```

**❌ 避免**：预先定义常量（增加维护成本）

```typescript
// ❌ 不推荐：重复定义
const MySchema = MyModel.getSchema()
const MyCreateSchema = MyModel.getSchema({ exclude: ['id'] })
const MyUpdateSchema = MyModel.getSchema({ exclude: ['id'], partial: true })
```

## CRUD 模板

### 1. 列表查询（List）

```typescript
.get(
  '/',
  async (ctx) => {
    const result = await service.findAll(ctx.query, ctx)
    return R.page(result)
  },
  {
    query: query(),
    response: {
      200: PagedResponse(service.getSchema(), '数据列表'),
    },
    detail: {
      summary: '获取列表',
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ['module:admin:list'] } },
    },
  },
)
```

### 2. 详情查询（Read）

```typescript
.get(
  '/:id',
  async (ctx) => {
    const data = await service.findById(ctx.params.id, ctx)
    if (!data) return R.notFound('资源')
    return R.ok(data)
  },
  {
    params: idParams({ label: '资源ID' }),
    response: {
      200: SuccessResponse(service.getSchema(), '详情数据'),
      404: ErrorResponse,
    },
    detail: {
      summary: '获取详情',
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ['module:admin:read'] } },
    },
  },
)
```

### 3. 创建（Create）

```typescript
.post(
  '/',
  async (ctx) => {
    // 业务校验
    const existing = await service.findByName(ctx.body.name)
    if (existing) return R.badRequest('名称已存在')

    const data = await service.create(ctx.body, ctx)
    return data ? R.ok(data, '创建成功') : R.fail('无权创建')
  },
  {
    body: service.getSchema(
      { exclude: ['id'], required: ['name'] },
      {
        // 额外字段示例
        confirmField: t.String({ description: '确认字段' }),
      },
    ),
    response: {
      200: SuccessResponse(service.getSchema(), '新创建的数据'),
      400: ErrorResponse,
    },
    detail: {
      summary: '创建资源',
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ['module:admin:create'] } },
      operLog: { title: '模块名', type: 'create' },
    },
  },
)
```

### 4. 更新（Update）

```typescript
.put(
  '/:id',
  async (ctx) => {
    const existing = await service.findById(ctx.params.id, ctx)
    if (!existing) return R.notFound('资源')

    const data = await service.update(ctx.params.id, ctx.body, ctx)
    return data ? R.ok(data, '更新成功') : R.fail('更新失败')
  },
  {
    params: idParams({ label: '资源ID' }),
    body: service.getSchema({ exclude: ['id'], partial: true }),
    response: {
      200: SuccessResponse(service.getSchema(), '更新后的数据'),
      404: ErrorResponse,
    },
    detail: {
      summary: '更新资源',
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ['module:admin:update'] } },
      operLog: { title: '模块名', type: 'update' },
    },
  },
)
```

### 5. 删除（Delete）

```typescript
.delete(
  '/:id',
  async (ctx) => {
    const existing = await service.findById(ctx.params.id, ctx)
    if (!existing) return R.notFound('资源')

    await service.remove(ctx.params.id, ctx)
    return R.success('删除成功')
  },
  {
    params: idParams({ label: '资源ID' }),
    response: {
      200: MessageResponse,
      404: ErrorResponse,
    },
    detail: {
      summary: '删除资源',
      security: [{ bearerAuth: [] }],
      rbac: { scope: { permissions: ['module:admin:delete'] } },
      operLog: { title: '模块名', type: 'delete' },
    },
  },
)
```

## Model.getSchema() 参数速查

| 参数          | 类型       | 说明                    | 示例                              |
| ------------- | ---------- | ----------------------- | --------------------------------- |
| `exclude`     | `string[]` | 排除字段                | `{ exclude: ['id', 'password'] }` |
| `include`     | `string[]` | 仅包含字段              | `{ include: ['id', 'name'] }`     |
| `partial`     | `boolean`  | 所有字段可选            | `{ partial: true }`               |
| `required`    | `string[]` | 指定必填字段            | `{ required: ['name', 'email'] }` |
| `timestamps`  | `boolean`  | 包含时间戳（默认 true） | `{ timestamps: false }`           |
| `description` | `string`   | Schema 描述             | `{ description: '用户信息' }`     |

**第二参数**：额外字段

```typescript
MyModel.getSchema({ exclude: ['id'] }, { extraField: t.String({ description: '额外字段' }) })
```

## 响应类型速查

| 类型                             | 用途              | 示例                             |
| -------------------------------- | ----------------- | -------------------------------- |
| `SuccessResponse(schema, desc?)` | 单条数据成功      | `200: SuccessResponse(MySchema)` |
| `PagedResponse(schema, desc?)`   | 分页列表          | `200: PagedResponse(MySchema)`   |
| `MessageResponse`                | 仅消息（无 data） | `200: MessageResponse`           |
| `ErrorResponse`                  | 错误响应          | `400/404: ErrorResponse`         |

## 权限配置 (rbac.scope)

```typescript
detail: {
  rbac: {
    scope: {
      permissions: ['module:admin:list'],   // 需要权限
      roles: ['admin'],                     // 或需要角色
      requireAll: true,                     // 需要全部权限（默认 false）
    }
  }
}
```

## detail 配置规范

> **Tags 不在路由中写**，由 `config.ts` 中的 `name` 字段自动分配。
> Elysia 构造器仅需 `new Elysia()`，不必手动声明 `tags` 或 `detail`。

```typescript
// ✅ 路由构造器：无需 tags，由 config.ts 自动分配
export default new Elysia()

// ✅ 单个路由的 detail
detail: {
  summary: '简短标题（4-8字）',
  security: [{ bearerAuth: [] }],
  rbac: { scope: { permissions: ['xxx:admin:list'] } },
  operLog: { title: '模块名', type: 'create' | 'update' | 'delete' },
}
```

## R 响应工具

```typescript
R.ok(data, msg?)              // { code: 0, data, msg }
R.success(msg?)               // { code: 0, msg }
R.page({ data, total, ... })  // { code: 0, data, total, page, pageSize }
R.fail(msg, code?)            // { code, msg }
R.badRequest(msg)             // { code: 400, msg }
R.notFound(name)              // { code: 404, msg: '${name}不存在' }
R.unauthorized(msg?)          // { code: 401, msg }
R.forbidden(msg?)             // { code: 403, msg }
R.serverError(msg?)           // { code: 500, msg }
```

## 完整示例（脱敏版）

```typescript
import { Elysia, t } from 'elysia'
import { idParams, query } from '@/packages/route-model'
import {
  R,
  PagedResponse,
  SuccessResponse,
  MessageResponse,
  ErrorResponse,
} from '@/services/response'
import { authPlugin } from '@/plugins/auth'
import { rbacPlugin } from '@/plugins/rbac'
import { vipPlugin } from '@/plugins/vip'
import { operLogPlugin } from '@/plugins/oper-log'
import * as userService from '@/services/user'

export default new Elysia()
  .use(authPlugin())
  .use(rbacPlugin())
  .use(vipPlugin())
  .use(operLogPlugin())

  // 列表
  .get(
    '/',
    async (ctx) => {
      const result = await userService.findAll(ctx.query, ctx)
      return R.page(result)
    },
    {
      query: query(),
      response: { 200: PagedResponse(userService.getSchema(), '用户列表') },
      detail: {
        summary: '获取用户列表',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:list'] } },
      },
    },
  )

  // 详情
  .get(
    '/:id',
    async (ctx) => {
      const data = await userService.findById(ctx.params.id, ctx)
      if (!data) return R.notFound('用户')
      const { password, ...safe } = data
      return R.ok(safe)
    },
    {
      params: idParams({ label: '用户ID' }),
      response: { 200: SuccessResponse(userService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '获取用户详情',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:read'] } },
      },
    },
  )

  // 创建
  .post(
    '/',
    async (ctx) => {
      const existing = await userService.findByUsername(ctx.body.username)
      if (existing) return R.badRequest('用户名已存在')
      const data = await userService.create(ctx.body, ctx)
      return R.ok(data, '创建成功')
    },
    {
      body: userService.getSchema(
        { exclude: ['id'], required: ['username', 'password'] },
        { confirmPassword: t.String({ description: '确认密码', minLength: 6 }) },
      ),
      response: { 200: SuccessResponse(userService.getSchema()), 400: ErrorResponse },
      detail: {
        summary: '创建用户',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:create'] } },
        operLog: { title: '用户管理', type: 'create' },
      },
    },
  )

  // 更新
  .put(
    '/:id',
    async (ctx) => {
      const existing = await userService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('用户')
      const data = await userService.update(ctx.params.id, ctx.body, ctx)
      return data ? R.ok(data, '更新成功') : R.fail('更新失败')
    },
    {
      params: idParams({ label: '用户ID' }),
      body: userService.getSchema({ exclude: ['id', 'password'], partial: true }),
      response: { 200: SuccessResponse(userService.getSchema()), 404: ErrorResponse },
      detail: {
        summary: '更新用户',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:update'] } },
        operLog: { title: '用户管理', type: 'update' },
      },
    },
  )

  // 删除
  .delete(
    '/:id',
    async (ctx) => {
      const existing = await userService.findById(ctx.params.id, ctx)
      if (!existing) return R.notFound('用户')
      await userService.remove(ctx.params.id, ctx)
      return R.success('删除成功')
    },
    {
      params: idParams({ label: '用户ID' }),
      response: { 200: MessageResponse, 404: ErrorResponse },
      detail: {
        summary: '删除用户',
        security: [{ bearerAuth: [] }],
        rbac: { scope: { permissions: ['user:admin:delete'] } },
        operLog: { title: '用户管理', type: 'delete' },
      },
    },
  )
```

## 最佳实践总结

1. **显式代码** - 每个 API/Service 文件显式编写完整 CRUD，不使用工厂函数封装，确保可控可修改
2. **禁止文件头部注释** - 不写 `/** ... */` 块注释描述文件用途，直接以 `import` 开头
3. **Tags 自动分配** - 由 `config.ts` 的 `name` 字段自动分配，Elysia 构造器不写 `tags`
4. **Schema 内联定义** - 使用 `Model.getSchema()` 直接在使用处生成，避免预定义常量
5. **完整响应类型** - 为每个路由配置 `response`，包括成功和错误情况
6. **业务校验前置** - 在 service 调用前进行业务逻辑验证
7. **统一错误处理** - 使用 `R.notFound()`、`R.badRequest()` 等标准响应
8. **数据脱敏** - 返回前移除敏感字段（如 password）

````
