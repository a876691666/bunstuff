# 统一响应

## 响应格式

所有 API 接口使用统一的响应格式：

### 成功响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": { ... }
}
```

### 分页响应

```json
{
  "code": 0,
  "message": "操作成功",
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误"
}
```

## 响应工具（R）

`modules/response.ts` 导出 `R` 对象，提供所有响应构建函数：

### 成功类

```typescript
R.ok(data)              // { code: 0, message: '操作成功', data }
R.success('创建成功')    // { code: 0, message: '创建成功' }
R.page(pagedResult)     // { code: 0, message: '操作成功', data, total, page, pageSize }
```

### 错误类

```typescript
R.badRequest('参数错误')  // { code: 400, message: '参数错误' }
R.unauthorized()         // { code: 401, message: '未认证' }
R.forbidden()            // { code: 403, message: '无权限' }
R.notFound('用户')       // { code: 404, message: '用户不存在' }
R.serverError()          // { code: 500, message: '服务器错误' }
```

## Schema 类型

用于路由配置中的 `response` 字段，确保 OpenAPI 文档正确：

### SuccessResponse

```typescript
import { SuccessResponse } from '@/modules/response'

// 带数据的成功响应
response: {
  200: SuccessResponse(User.getSchema())
}

// 生成 Schema:
// {
//   code: t.Number(),
//   message: t.String(),
//   data: UserSchema
// }
```

### PagedResponse

```typescript
import { PagedResponse } from '@/modules/response'

// 分页响应
response: {
  200: PagedResponse(User.getSchema())
}

// 生成 Schema:
// {
//   code: t.Number(),
//   message: t.String(),
//   data: t.Array(UserSchema),
//   total: t.Number(),
//   page: t.Number(),
//   pageSize: t.Number()
// }
```

### MessageResponse

```typescript
import { MessageResponse } from '@/modules/response'

// 仅消息响应（无 data）
response: {
  200: MessageResponse
}
```

### ErrorResponse

```typescript
import { ErrorResponse } from '@/modules/response'

// 错误响应
response: {
  200: SuccessResponse(schema),
  404: ErrorResponse,
  403: ErrorResponse
}
```

## 使用示例

```typescript
import { R, PagedResponse, SuccessResponse, ErrorResponse, MessageResponse } from '@/modules/response'

// 列表接口
.get('/', async (ctx) => R.page(await service.findAll(ctx.query, ctx)), {
  response: { 200: PagedResponse(Model.getSchema()) },
})

// 详情接口
.get('/:id', async (ctx) => {
  const data = await service.findById(ctx.params.id, ctx)
  return data ? R.ok(data) : R.notFound('资源')
}, {
  response: { 200: SuccessResponse(Model.getSchema()), 404: ErrorResponse },
})

// 创建接口
.post('/', async (ctx) => R.ok(await service.create(ctx.body, ctx)), {
  response: { 200: SuccessResponse(Model.getSchema()) },
})

// 删除接口
.delete('/:id', async (ctx) => {
  return (await service.delete(ctx.params.id, ctx))
    ? R.success('删除成功') : R.notFound('资源')
}, {
  response: { 200: MessageResponse, 404: ErrorResponse },
})
```
