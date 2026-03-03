# 统一响应

Bunstuff 所有 API 接口使用统一的响应格式，通过 `R` 工具类封装，确保前后端交互一致性。

## 📋 响应格式

### 标准响应结构

```typescript
interface ApiResponse<T = any> {
  code: number       // 状态码
  message: string    // 提示信息
  data?: T           // 业务数据
  total?: number     // 总数（分页时）
  page?: number      // 当前页码（分页时）
}
```

### 响应示例

**成功响应（数据）：**

```json
{
  "code": 200,
  "message": "ok",
  "data": { "id": 1, "username": "admin" }
}
```

**成功响应（分页）：**

```json
{
  "code": 200,
  "message": "ok",
  "data": [
    { "id": 1, "username": "admin" },
    { "id": 2, "username": "user" }
  ],
  "total": 100,
  "page": 1
}
```

**成功响应（消息）：**

```json
{
  "code": 200,
  "message": "操作成功"
}
```

**错误响应：**

```json
{
  "code": 400,
  "message": "参数错误：用户名不能为空"
}
```

## 🔧 R 工具类

### 成功响应方法

| 方法 | 说明 | 返回 |
|------|------|------|
| `R.ok(data)` | 返回数据 | `{ code: 200, message: 'ok', data }` |
| `R.success(message?)` | 操作成功 | `{ code: 200, message: '操作成功' }` |
| `R.page({ list, total, page })` | 分页数据 | `{ code: 200, data: [...], total, page }` |

### 错误响应方法

| 方法 | 状态码 | 说明 |
|------|--------|------|
| `R.badRequest(message)` | 400 | 请求参数错误 |
| `R.unauthorized(message?)` | 401 | 未认证 / Token 过期 |
| `R.forbidden(message?)` | 403 | 无权限访问 |
| `R.notFound(message?)` | 404 | 资源不存在 |
| `R.serverError(message?)` | 500 | 服务器内部错误 |

### 使用示例

```typescript
import { R } from '@/services/response'

// 查询列表
.get('/list', async ({ query, dataScope }) => {
  const result = await service.findAll(query, dataScope)
  return R.page(result)
})

// 查询详情
.get('/:id', async ({ params }) => {
  const item = await service.findById(params.id)
  if (!item) return R.notFound('数据不存在')
  return R.ok(item)
})

// 创建
.post('/', async ({ body }) => {
  await service.create(body)
  return R.success('创建成功')
})

// 更新
.put('/:id', async ({ params, body }) => {
  await service.update(params.id, body)
  return R.success('更新成功')
})

// 删除
.delete('/:id', async ({ params }) => {
  await service.delete(params.id)
  return R.success('删除成功')
})
```

## 📐 响应 Schema 类型

路由配置中使用的响应 Schema 类型，用于 OpenAPI 文档生成：

| Schema 类型 | 用途 | 示例 |
|-------------|------|------|
| `SuccessResponse()` | 操作成功（无数据） | 创建/更新/删除 |
| `PagedResponse(schema)` | 分页列表 | 查询列表 |
| `DataResponse(schema)` | 单条数据 | 查询详情 |
| `MessageResponse()` | 消息响应 | 错误提示 |
| `ErrorResponse()` | 错误响应 | 参数/权限错误 |

### 路由中使用

```typescript
import { SuccessResponse, PagedResponse } from '@/services/response'

.get('/list', handler, {
  response: {
    200: PagedResponse(service.getSchema()),  // 分页列表
    400: ErrorResponse(),                     // 参数错误
    401: ErrorResponse(),                     // 未认证
  },
})

.post('/', handler, {
  response: {
    200: SuccessResponse(),                   // 创建成功
    400: ErrorResponse(),                     // 参数错误
  },
})

.get('/:id', handler, {
  response: {
    200: DataResponse(service.getSchema()),   // 单条数据
    404: ErrorResponse(),                     // 未找到
  },
})
```

## 📊 状态码约定

| 状态码 | 含义 | 使用场景 |
|--------|------|---------|
| `200` | 成功 | 所有成功请求 |
| `400` | 参数错误 | 请求参数校验失败 |
| `401` | 未认证 | Token 缺失或过期 |
| `403` | 权限不足 | RBAC 权限校验失败 |
| `404` | 未找到 | 资源不存在 |
| `429` | 请求过多 | 触发限流 |
| `500` | 服务器错误 | 内部异常 |

::: tip 前端处理
前端 `HttpClient` 会自动处理响应：
- `code === 200` → 返回 `data` 字段
- `code === 401` → 自动跳转登录页
- 其他 → 显示错误提示
:::
