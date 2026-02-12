# HTTP 请求

## HttpClient

`utils/http.ts` 封装了基于 `fetch` 的 HTTP 客户端，提供统一的请求处理。

## 核心特性

- **自动 Token 注入**：Bearer Authorization 头
- **自动响应解包**：提取 `ApiResponse.data`
- **统一错误处理**：401 自动跳转登录页
- **类型安全**：泛型响应类型

## 请求方法

### GET 请求

```typescript
import { http } from '@/utils/http'

// 普通 GET
const user = await http.get<User>('/api/admin/users/1')

// 带查询参数
const users = await http.get<User[]>('/api/admin/users', {
  page: 1,
  pageSize: 10,
  filter: 'status = 1',
})
```

### 分页 GET

```typescript
// 返回 { data, total, page, pageSize }
const result = await http.getPage<User>('/api/admin/users', {
  page: 1,
  pageSize: 10,
})
```

### POST 请求

```typescript
const newUser = await http.post<User>('/api/admin/users', {
  username: 'test',
  password: '123456',
  nickname: '测试用户',
})
```

### PUT 请求

```typescript
const updatedUser = await http.put<User>('/api/admin/users/1', {
  nickname: '新昵称',
})
```

### DELETE 请求

```typescript
await http.delete('/api/admin/users/1')
```

## 响应格式

所有后端接口返回统一格式：

```typescript
interface ApiResponse<T = any> {
  code: number       // 0=成功，其他=错误
  message: string    // 提示消息
  data?: T           // 数据
  total?: number     // 分页总数
  page?: number      // 当前页
  pageSize?: number  // 每页数量
}
```

HttpClient 自动处理：
- `code === 0` → 返回 `data`
- `code === 401` → 清除 token，跳转登录页
- 其他错误 → 弹出错误提示

## 请求拦截

```typescript
// 自动添加 Authorization 头
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`,
}
```

## 在 API 层使用

```typescript
// api/user.ts
import { http } from '@/utils/http'

export const userApi = {
  list: (params?: any) => http.getPage('/api/admin/users', params),
  detail: (id: number) => http.get(`/api/admin/users/${id}`),
  create: (data: any) => http.post('/api/admin/users', data),
  update: (id: number, data: any) => http.put(`/api/admin/users/${id}`, data),
  delete: (id: number) => http.delete(`/api/admin/users/${id}`),
}
```
